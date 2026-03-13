'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Clock, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTeacherAvailability, useUpdateTeacherAvailability } from '@/lib/api/hooks';
import type { DayAvailability } from '@/lib/api/types';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

interface AvailabilityManagerProps {
  teacherId: string;
  readOnly?: boolean;
}

export function AvailabilityManager({ teacherId, readOnly = false }: AvailabilityManagerProps) {
  const { data, isLoading, error } = useTeacherAvailability(teacherId);
  const updateMutation = useUpdateTeacherAvailability();
  
  const [editedAvailability, setEditedAvailability] = useState<DayAvailability[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize edited availability when data loads
  React.useEffect(() => {
    if (data?.availability) {
      setEditedAvailability(data.availability);
    }
  }, [data]);

  const handleAddSlot = (day: string) => {
    setEditedAvailability((prev) => {
      const dayData = prev.find((d) => d.day === day);
      if (dayData) {
        return prev.map((d) =>
          d.day === day
            ? { ...d, slots: [...d.slots, { start: '09:00', end: '17:00' }] }
            : d
        );
      }
      return [...prev, { day: day as DayAvailability['day'], slots: [{ start: '09:00', end: '17:00' }] }];
    });
    setHasChanges(true);
    setValidationError(null);
  };

  const handleRemoveSlot = (day: string, slotIndex: number) => {
    setEditedAvailability((prev) =>
      prev
        .map((d) =>
          d.day === day ? { ...d, slots: d.slots.filter((_, i) => i !== slotIndex) } : d
        )
        .filter((d) => d.slots.length > 0)
    );
    setHasChanges(true);
    setValidationError(null);
  };

  const handleUpdateSlot = (
    day: string,
    slotIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setEditedAvailability((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              slots: d.slots.map((slot, i) =>
                i === slotIndex ? { ...slot, [field]: value } : slot
              ),
            }
          : d
      )
    );
    setHasChanges(true);
    setValidationError(null);
  };

  const validateAvailability = (): boolean => {
    for (const day of editedAvailability) {
      for (const slot of day.slots) {
        const startMinutes = timeToMinutes(slot.start);
        const endMinutes = timeToMinutes(slot.end);

        if (endMinutes <= startMinutes) {
          setValidationError(`End time must be after start time for ${day.day}`);
          return false;
        }

        if (endMinutes - startMinutes < 30) {
          setValidationError(`Time slot must be at least 30 minutes for ${day.day}`);
          return false;
        }
      }

      // Check overlaps
      const sortedSlots = [...day.slots].sort(
        (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
      );
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        if (timeToMinutes(sortedSlots[i].end) > timeToMinutes(sortedSlots[i + 1].start)) {
          setValidationError(`Overlapping time slots for ${day.day}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateAvailability()) return;

    try {
      await updateMutation.mutateAsync({
        teacherId,
        availability: editedAvailability,
      });
      setHasChanges(false);
      setValidationError(null);
    } catch (err) {
      setValidationError('Failed to save availability. Please try again.');
    }
  };

  const handleReset = () => {
    if (data?.availability) {
      setEditedAvailability(data.availability);
    }
    setHasChanges(false);
    setValidationError(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS.map((day) => (
              <div key={day.key} className="h-16 bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load availability</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDayAvailability = (day: string) => {
    return editedAvailability.find((d) => d.day === day)?.slots || [];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Weekly Availability
        </CardTitle>
        {data?.status && (
          <Badge
            variant={
              data.status === 'confirmed'
                ? 'default'
                : data.status === 'pending'
                ? 'secondary'
                : 'outline'
            }
          >
            {data.status}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{validationError}</span>
          </div>
        )}

        <div className="space-y-4">
          {DAYS.map((day) => {
            const slots = getDayAvailability(day.key);
            return (
              <div key={day.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium capitalize">{day.label}</Label>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddSlot(day.key)}
                      className="h-8 px-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Slot
                    </Button>
                  )}
                </div>

                {slots.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No availability set</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) =>
                            handleUpdateSlot(day.key, index, 'start', e.target.value)
                          }
                          disabled={readOnly}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) =>
                            handleUpdateSlot(day.key, index, 'end', e.target.value)
                          }
                          disabled={readOnly}
                          className="w-32"
                        />
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSlot(day.key, index)}
                            className="h-8 px-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!readOnly && hasChanges && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset
            </Button>
          </div>
        )}

        {data?.lastUpdated && (
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
