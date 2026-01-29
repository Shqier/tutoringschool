'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { createGroupSchema, type CreateGroupFormData } from '@/lib/validations';
import { useCreateGroup, useUpdateGroup } from '@/lib/api/hooks';
import type { Group, Teacher, Room } from '@/lib/api/types';

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  group?: Group | null;
  teachers: Teacher[];
  rooms: Room[];
}

export function GroupDialog({
  open,
  onOpenChange,
  onSuccess,
  group,
  teachers,
  rooms,
}: GroupDialogProps) {
  const isEditing = !!group;

  const { mutate: createGroup, isLoading: createLoading } = useCreateGroup();
  const { mutate: updateGroup, isLoading: updateLoading } = useUpdateGroup();
  const isLoading = createLoading || updateLoading;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      teacherId: '',
      roomId: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (group) {
        reset({
          name: group.name,
          teacherId: group.teacherId,
          roomId: group.roomId || '',
        });
      } else {
        reset({
          name: '',
          teacherId: '',
          roomId: '',
        });
      }
    }
  }, [open, group, reset]);

  const onSubmit = async (data: CreateGroupFormData) => {
    try {
      if (isEditing && group) {
        await updateGroup({
          id: group.id,
          input: {
            name: data.name,
            teacherId: data.teacherId,
            roomId: data.roomId || undefined,
          },
        });
        toast.success('Group updated successfully');
      } else {
        await createGroup({
          name: data.name,
          teacherId: data.teacherId,
          roomId: data.roomId || undefined,
        });
        toast.success('Group created successfully');
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} group`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Edit Group' : 'Create New Group'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {isEditing
              ? 'Update the group information below.'
              : 'Create a new group for your school.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Arabic Beginners A1"
              {...register('name')}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
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
                    {teachers
                      .filter((t) => t.status === 'active')
                      .map((teacher) => (
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
                    {rooms.map((room) => (
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
              {isEditing ? 'Save Changes' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
