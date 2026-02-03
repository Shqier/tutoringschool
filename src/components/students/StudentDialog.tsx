'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, Edit2 } from 'lucide-react';
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
import { createStudentSchema, type CreateStudentFormData } from '@/lib/validations';
import { useCreateStudent, useUpdateStudent } from '@/lib/api/hooks';
import type { Student } from '@/lib/api/types';
import type { DialogMode } from '@/hooks/useEntityDialog';

interface StudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DialogMode;
  entity: Student | null;
  switchToEdit: () => void;
  onSuccess: () => void;
}

export function StudentDialog({
  isOpen,
  onClose,
  mode,
  entity,
  switchToEdit,
  onSuccess,
}: StudentDialogProps) {
  const isCreating = mode === 'create';
  const isViewing = mode === 'view';
  const isEditing = mode === 'edit';

  const { mutate: createStudent, isLoading: createLoading } = useCreateStudent();
  const { mutate: updateStudent, isLoading: updateLoading } = useUpdateStudent();
  const isLoading = createLoading || updateLoading;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      status: 'active',
      groupIds: [],
      balance: 0,
      plan: 'Monthly Basic',
    },
  });

  // Reset form when dialog opens/closes or entity changes
  useEffect(() => {
    if (isOpen) {
      if (entity) {
        reset({
          fullName: entity.fullName,
          email: entity.email || '',
          phone: entity.phone || '',
          status: entity.status,
          groupIds: entity.groupIds || [],
          balance: entity.balance || 0,
          plan: entity.plan || 'Monthly Basic',
        });
      } else {
        reset({
          fullName: '',
          email: '',
          phone: '',
          status: 'active',
          groupIds: [],
          balance: 0,
          plan: 'Monthly Basic',
        });
      }
    }
  }, [isOpen, entity, reset]);

  const onSubmit = async (data: CreateStudentFormData) => {
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        status: data.status,
        groupIds: data.groupIds || [],
        balance: data.balance,
        plan: data.plan,
      };

      if (isEditing && entity) {
        await updateStudent({
          id: entity.id,
          input: payload,
        });
        toast.success('Student updated successfully');
      } else {
        await createStudent(payload);
        toast.success('Student created successfully');
      }
      reset();
      onClose();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} student`);
    }
  };

  const getTitle = () => {
    if (isCreating) return 'Add New Student';
    if (isViewing) return 'Student Details';
    return 'Edit Student';
  };

  const getDescription = () => {
    if (isCreating) return 'Fill in the details to add a new student to your school.';
    if (isViewing) return 'View student information and details.';
    return 'Update the student information below.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{getTitle()}</DialogTitle>
          <DialogDescription className="text-white/60">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            {isViewing ? (
              <div className="px-3 py-2 rounded-md bg-white/5 text-white">
                {entity?.fullName}
              </div>
            ) : (
              <>
                <Input
                  id="fullName"
                  placeholder="e.g., Ahmed Hassan"
                  {...register('fullName')}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-400">{errors.fullName.message}</p>
                )}
              </>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isViewing ? (
              <div className="px-3 py-2 rounded-md bg-white/5 text-white">
                {entity?.email || 'N/A'}
              </div>
            ) : (
              <>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@email.com"
                  {...register('email')}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            {isViewing ? (
              <div className="px-3 py-2 rounded-md bg-white/5 text-white">
                {entity?.phone || 'N/A'}
              </div>
            ) : (
              <>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  {...register('phone')}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
                />
                {errors.phone && (
                  <p className="text-xs text-red-400">{errors.phone.message}</p>
                )}
              </>
            )}
          </div>

          {/* Status and Balance Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {isViewing ? (
                <div className="px-3 py-2 rounded-md bg-white/5 text-white capitalize">
                  {entity?.status.replace('_', ' ')}
                </div>
              ) : (
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
                        <SelectItem value="at_risk" className="text-white/80 focus:bg-white/5 focus:text-white">
                          At Risk
                        </SelectItem>
                        <SelectItem value="inactive" className="text-white/80 focus:bg-white/5 focus:text-white">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Balance ($)</Label>
              {isViewing ? (
                <div className={`px-3 py-2 rounded-md bg-white/5 ${
                  (entity?.balance || 0) < 0 ? 'text-red-400' :
                  (entity?.balance || 0) === 0 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  ${entity?.balance || 0}
                </div>
              ) : (
                <>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    {...register('balance', { valueAsNumber: true })}
                    className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50"
                  />
                  {errors.balance && (
                    <p className="text-xs text-red-400">{errors.balance.message}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan">Plan</Label>
            {isViewing ? (
              <div className="px-3 py-2 rounded-md bg-white/5 text-white">
                {entity?.plan || 'N/A'}
              </div>
            ) : (
              <>
                <Input
                  id="plan"
                  placeholder="e.g., Monthly Basic"
                  {...register('plan')}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
                />
                {errors.plan && (
                  <p className="text-xs text-red-400">{errors.plan.message}</p>
                )}
              </>
            )}
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            {isViewing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={switchToEdit}
                  className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
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
                  {isCreating ? 'Add Student' : 'Save Changes'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
