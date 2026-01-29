'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X, Plus } from 'lucide-react';
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
import { createRoomSchema, type CreateRoomFormData } from '@/lib/validations';
import { useCreateRoom, useUpdateRoom } from '@/lib/api/hooks';
import type { Room } from '@/lib/api/types';

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  room?: Room | null;
}

const COMMON_EQUIPMENT = [
  'Whiteboard',
  'Projector',
  'Smart Board',
  'Audio System',
  'Video Conferencing',
  'AC',
  'Computer',
  'Wi-Fi',
];

export function RoomDialog({
  open,
  onOpenChange,
  onSuccess,
  room,
}: RoomDialogProps) {
  const isEditing = !!room;
  const [newEquipment, setNewEquipment] = useState('');

  const { mutate: createRoom, isLoading: createLoading } = useCreateRoom();
  const { mutate: updateRoom, isLoading: updateLoading } = useUpdateRoom();
  const isLoading = createLoading || updateLoading;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      capacity: 10,
      floor: '',
      equipment: [],
      status: 'available',
    },
  });

  const selectedEquipment = watch('equipment') || [];

  useEffect(() => {
    if (open) {
      if (room) {
        reset({
          name: room.name,
          capacity: room.capacity,
          floor: room.floor || '',
          equipment: room.equipment || [],
          status: room.status,
        });
      } else {
        reset({
          name: '',
          capacity: 10,
          floor: '',
          equipment: [],
          status: 'available',
        });
      }
    }
  }, [open, room, reset]);

  const handleAddEquipment = (item: string) => {
    if (item && !selectedEquipment.includes(item)) {
      setValue('equipment', [...selectedEquipment, item]);
    }
    setNewEquipment('');
  };

  const handleRemoveEquipment = (item: string) => {
    setValue('equipment', selectedEquipment.filter((e) => e !== item));
  };

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      if (isEditing && room) {
        await updateRoom({
          id: room.id,
          input: {
            name: data.name,
            capacity: data.capacity,
            floor: data.floor || undefined,
            equipment: data.equipment,
            status: data.status,
          },
        });
        toast.success('Room updated successfully');
      } else {
        await createRoom({
          name: data.name,
          capacity: data.capacity,
          floor: data.floor || undefined,
          equipment: data.equipment,
          status: data.status,
        });
        toast.success('Room created successfully');
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} room`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Edit Room' : 'Add New Room'}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {isEditing
              ? 'Update the room information below.'
              : 'Add a new room to your facility.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              placeholder="e.g., Room 101"
              {...register('name')}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Capacity and Floor Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={500}
                {...register('capacity', { valueAsNumber: true })}
                className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50"
              />
              {errors.capacity && (
                <p className="text-xs text-red-400">{errors.capacity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                placeholder="e.g., Ground Floor"
                {...register('floor')}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
              />
            </div>
          </div>

          {/* Status */}
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
                    <SelectItem value="available" className="text-white/80 focus:bg-white/5 focus:text-white">
                      Available
                    </SelectItem>
                    <SelectItem value="occupied" className="text-white/80 focus:bg-white/5 focus:text-white">
                      Occupied
                    </SelectItem>
                    <SelectItem value="maintenance" className="text-white/80 focus:bg-white/5 focus:text-white">
                      Maintenance
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <Label>Equipment</Label>
            <div className="flex gap-2">
              <Select onValueChange={handleAddEquipment}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                  <SelectValue placeholder="Add equipment" />
                </SelectTrigger>
                <SelectContent className="bg-[#14171C] border-white/10">
                  {COMMON_EQUIPMENT.filter((e) => !selectedEquipment.includes(e)).map((item) => (
                    <SelectItem
                      key={item}
                      value={item}
                      className="text-white/80 focus:bg-white/5 focus:text-white"
                    >
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom equipment input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom equipment"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEquipment(newEquipment);
                  }
                }}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleAddEquipment(newEquipment)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {selectedEquipment.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedEquipment.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="bg-white/5 text-white/70 border border-white/10 px-2 py-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(item)}
                      className="ml-1.5 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
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
              {isEditing ? 'Save Changes' : 'Add Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
