'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createLessonSchema, type CreateLessonFormData } from '@/lib/validations';
import { useCreateLesson } from '@/lib/api/hooks';
import { ApiConflictError } from '@/lib/api/client';
import type { Teacher, Group, Room, ConflictingLesson } from '@/lib/api/types';

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  teachers: Teacher[];
  groups: Group[];
  rooms: Room[];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function ConflictWarning({
  conflicts,
  onIgnore,
  onCancel,
  isLoading,
}: {
  conflicts: { teacher?: ConflictingLesson[]; room?: ConflictingLesson[]; availability?: string[] };
  onIgnore: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const hasTeacherConflicts = conflicts.teacher && conflicts.teacher.length > 0;
  const hasRoomConflicts = conflicts.room && conflicts.room.length > 0;
  const hasAvailabilityConflicts = conflicts.availability && conflicts.availability.length > 0;

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-medium text-red-400">Scheduling Conflicts Detected</h4>

          {hasTeacherConflicts && (
            <div className="space-y-1">
              <p className="text-xs text-red-300">Teacher conflicts:</p>
              <ul className="text-xs text-red-200 space-y-1 pl-4">
                {conflicts.teacher!.map((lesson) => (
                  <li key={lesson.id} className="list-disc">
                    {lesson.title} ({formatTime(lesson.startAt)} - {formatTime(lesson.endAt)})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasRoomConflicts && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-red-300">Room conflicts:</p>
              <ul className="text-xs text-red-200 space-y-1 pl-4">
                {conflicts.room!.map((lesson) => (
                  <li key={lesson.id} className="list-disc">
                    {lesson.title} ({formatTime(lesson.startAt)} - {formatTime(lesson.endAt)})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasAvailabilityConflicts && (
            <div className="space-y-1 mt-2">
              <p className="text-xs text-red-300">Availability conflicts:</p>
              <ul className="text-xs text-red-200 space-y-1 pl-4">
                {conflicts.availability!.map((reason, idx) => (
                  <li key={idx} className="list-disc">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onIgnore}
          disabled={isLoading}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Anyway
        </Button>
      </div>
    </div>
  );
}

export function AddLessonDialog({
  open,
  onOpenChange,
  onSuccess,
  teachers,
  groups,
  rooms,
}: AddLessonDialogProps) {
  const { mutate: createLesson, isLoading } = useCreateLesson();
  const [conflicts, setConflicts] = useState<{ teacher?: ConflictingLesson[]; room?: ConflictingLesson[]; availability?: string[] } | null>(null);
  const [pendingData, setPendingData] = useState<CreateLessonFormData | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateLessonFormData>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      type: 'group',
      title: '',
      startAt: '',
      endAt: '',
      teacherId: '',
      groupId: '',
      roomId: '',
    },
  });

  const lessonType = watch('type');

  const handleClose = () => {
    setConflicts(null);
    setPendingData(null);
    reset();
    onOpenChange(false);
  };

  const submitLesson = async (data: CreateLessonFormData, forceCreate = false) => {
    try {
      await createLesson({
        title: data.title,
        startAt: data.startAt,
        endAt: data.endAt,
        type: data.type,
        teacherId: data.teacherId,
        groupId: data.type === 'group' ? data.groupId : undefined,
        studentId: data.type === 'one_on_one' ? data.studentId : undefined,
        roomId: data.roomId || undefined,
        forceCreate,
      });
      toast.success('Lesson created successfully');
      handleClose();
      onSuccess();
    } catch (error) {
      if (error instanceof ApiConflictError) {
        // Show conflict warning
        setConflicts(error.conflicts);
        setPendingData(data);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to create lesson');
      }
    }
  };

  const onSubmit = async (data: CreateLessonFormData) => {
    await submitLesson(data, false);
  };

  const handleIgnoreConflicts = async () => {
    if (pendingData) {
      await submitLesson(pendingData, true);
    }
  };

  const handleCancelConflict = () => {
    setConflicts(null);
    setPendingData(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Lesson</DialogTitle>
          <DialogDescription className="text-white/60">
            Schedule a new lesson for your school.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Conflict Warning */}
          {conflicts && (
            <ConflictWarning
              conflicts={conflicts}
              onIgnore={handleIgnoreConflicts}
              onCancel={handleCancelConflict}
              isLoading={isLoading}
            />
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              placeholder="e.g., Arabic Beginners A1"
              {...register('title')}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
            />
            {errors.title && (
              <p className="text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Lesson Type */}
          <div className="space-y-2">
            <Label>Lesson Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14171C] border-white/10">
                    <SelectItem value="group" className="text-white/80 focus:bg-white/5 focus:text-white">
                      Group Lesson
                    </SelectItem>
                    <SelectItem value="one_on_one" className="text-white/80 focus:bg-white/5 focus:text-white">
                      One-on-One
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Date/Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startAt">Start Time</Label>
              <Input
                id="startAt"
                type="datetime-local"
                {...register('startAt')}
                className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50"
              />
              {errors.startAt && (
                <p className="text-xs text-red-400">{errors.startAt.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">End Time</Label>
              <Input
                id="endAt"
                type="datetime-local"
                {...register('endAt')}
                className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50"
              />
              {errors.endAt && (
                <p className="text-xs text-red-400">{errors.endAt.message}</p>
              )}
            </div>
          </div>

          {/* Teacher */}
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Controller
              name="teacherId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14171C] border-white/10">
                    {teachers.map((teacher) => (
                      <SelectItem
                        key={teacher.id}
                        value={teacher.id}
                        className="text-white/80 focus:bg-white/5 focus:text-white"
                      >
                        {teacher.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.teacherId && (
              <p className="text-xs text-red-400">{errors.teacherId.message}</p>
            )}
          </div>

          {/* Group (for group lessons) */}
          {lessonType === 'group' && (
            <div className="space-y-2">
              <Label>Group</Label>
              <Controller
                name="groupId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#14171C] border-white/10">
                      {groups.map((group) => (
                        <SelectItem
                          key={group.id}
                          value={group.id}
                          className="text-white/80 focus:bg-white/5 focus:text-white"
                        >
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.groupId && (
                <p className="text-xs text-red-400">{errors.groupId.message}</p>
              )}
            </div>
          )}

          {/* Room */}
          <div className="space-y-2">
            <Label>Room (Optional)</Label>
            <Controller
              name="roomId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14171C] border-white/10">
                    {rooms
                      .filter((r) => r.status === 'available')
                      .map((room) => (
                        <SelectItem
                          key={room.id}
                          value={room.id}
                          className="text-white/80 focus:bg-white/5 focus:text-white"
                        >
                          {room.name} (Capacity: {room.capacity})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {!conflicts && (
            <DialogFooter className="gap-2 sm:gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Lesson
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
