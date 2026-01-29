'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { AvailabilityEditor } from './AvailabilityEditor';
import { AvailabilityExceptionDialog } from './AvailabilityExceptionDialog';
import { createTeacherSchema, type CreateTeacherFormData } from '@/lib/validations';
import { useCreateTeacher, useUpdateTeacher } from '@/lib/api/hooks';
import type { Teacher } from '@/lib/api/types';
import type { AvailabilitySlot, AvailabilityException } from '@/lib/db/types';

interface TeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  teacher?: Teacher | null; // If provided, we're editing
}

// Common subjects for quick selection
const COMMON_SUBJECTS = [
  'Arabic Language',
  'Arabic Grammar',
  'Arabic Literature',
  'Quran Studies',
  'Tajweed',
  'Islamic Studies',
  'Arabic Conversation',
  'Modern Standard Arabic',
];

export function TeacherDialog({
  open,
  onOpenChange,
  onSuccess,
  teacher,
}: TeacherDialogProps) {
  const isEditing = !!teacher;

  const { mutate: createTeacher, isLoading: createLoading } = useCreateTeacher();
  const { mutate: updateTeacher, isLoading: updateLoading } = useUpdateTeacher();
  const isLoading = createLoading || updateLoading;

  // Availability state
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [editingException, setEditingException] = useState<AvailabilityException | undefined>();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      subjects: [],
      maxHours: 25,
      status: 'active',
    },
  });

  const selectedSubjects = watch('subjects') || [];

  // Reset form when dialog opens/closes or teacher changes
  useEffect(() => {
    if (open) {
      if (teacher) {
        reset({
          fullName: teacher.fullName,
          email: teacher.email,
          phone: teacher.phone || '',
          subjects: teacher.subjects,
          maxHours: teacher.maxHours || 25,
          status: teacher.status,
        });
        setAvailability(teacher.weeklyAvailability || []);
        setExceptions(teacher.availabilityExceptions || []);
      } else {
        reset({
          fullName: '',
          email: '',
          phone: '',
          subjects: [],
          maxHours: 25,
          status: 'active',
        });
        setAvailability([]);
        setExceptions([]);
      }
    }
  }, [open, teacher, reset]);

  const handleAddSubject = (subject: string) => {
    if (!selectedSubjects.includes(subject)) {
      setValue('subjects', [...selectedSubjects, subject]);
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setValue('subjects', selectedSubjects.filter((s) => s !== subject));
  };

  const onSubmit = async (data: CreateTeacherFormData) => {
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        subjects: data.subjects,
        maxHours: data.maxHours,
        status: data.status,
        weeklyAvailability: availability,
        availabilityExceptions: exceptions,
      };

      if (isEditing && teacher) {
        await updateTeacher({
          id: teacher.id,
          input: payload,
        });
        toast.success('Teacher updated successfully');
      } else {
        await createTeacher(payload);
        toast.success('Teacher created successfully');
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} teacher`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {isEditing
              ? 'Update the teacher information below.'
              : 'Fill in the details to add a new teacher to your school.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="e.g., Ahmed Hassan"
              {...register('fullName')}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
            />
            {errors.fullName && (
              <p className="text-xs text-red-400">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="teacher@school.com"
              {...register('email')}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
            />
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              placeholder="+1 234 567 8900"
              {...register('phone')}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
            />
            {errors.phone && (
              <p className="text-xs text-red-400">{errors.phone.message}</p>
            )}
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <Label>Subjects</Label>
            <Select onValueChange={handleAddSubject}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                <SelectValue placeholder="Add a subject" />
              </SelectTrigger>
              <SelectContent className="bg-[#14171C] border-white/10">
                {COMMON_SUBJECTS.filter((s) => !selectedSubjects.includes(s)).map((subject) => (
                  <SelectItem
                    key={subject}
                    value={subject}
                    className="text-white/80 focus:bg-white/5 focus:text-white"
                  >
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedSubjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant="secondary"
                    className="bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30 px-2 py-1"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(subject)}
                      className="ml-1.5 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.subjects && (
              <p className="text-xs text-red-400">{errors.subjects.message}</p>
            )}
          </div>

          {/* Max Hours and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxHours">Max Hours/Week</Label>
              <Input
                id="maxHours"
                type="number"
                min={1}
                max={60}
                {...register('maxHours', { valueAsNumber: true })}
                className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50"
              />
              {errors.maxHours && (
                <p className="text-xs text-red-400">{errors.maxHours.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#14171C] border-white/10">
                      <SelectItem value="active" className="text-white/80 focus:bg-white/5 focus:text-white">
                        Active
                      </SelectItem>
                      <SelectItem value="inactive" className="text-white/80 focus:bg-white/5 focus:text-white">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Availability Section */}
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Weekly Availability</Label>
            </div>
            <AvailabilityEditor value={availability} onChange={setAvailability} />
          </div>

          {/* Exceptions Section */}
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Exceptions</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingException(undefined);
                  setExceptionDialogOpen(true);
                }}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Exception
              </Button>
            </div>

            {exceptions.length === 0 ? (
              <p className="text-xs text-white/40">No exceptions</p>
            ) : (
              <div className="space-y-2">
                {exceptions.map((exc) => (
                  <div
                    key={exc.id}
                    className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {exc.type === 'unavailable' ? '🚫' : '✅'} {exc.startDate === exc.endDate ? exc.startDate : `${exc.startDate} - ${exc.endDate}`}
                      </p>
                      {exc.reason && (
                        <p className="text-xs text-white/60">{exc.reason}</p>
                      )}
                      {!exc.allDay && (
                        <p className="text-xs text-white/40">{exc.startTime} - {exc.endTime}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingException(exc);
                          setExceptionDialogOpen(true);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setExceptions(exceptions.filter(e => e.id !== exc.id))}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              {isEditing ? 'Save Changes' : 'Add Teacher'}
            </Button>
          </DialogFooter>
        </form>

        {/* Exception Dialog */}
        <AvailabilityExceptionDialog
          open={exceptionDialogOpen}
          onOpenChange={setExceptionDialogOpen}
          exception={editingException}
          onSave={(newException) => {
            if (editingException) {
              setExceptions(exceptions.map(e => e.id === newException.id ? newException : e));
            } else {
              setExceptions([...exceptions, newException]);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
