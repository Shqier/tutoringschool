'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { AvailabilitySlot } from '@/lib/db/types';

interface AvailabilityEditorProps {
  value: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityEditor({ value, onChange }: AvailabilityEditorProps) {
  const addSlot = (dayOfWeek: number) => {
    onChange([
      ...value,
      { dayOfWeek, startTime: '09:00', endTime: '17:00' },
    ]);
  };

  const removeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, val: string | number) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  // Group slots by day
  const slotsByDay = DAYS.map((_, dayOfWeek) => ({
    day: DAYS[dayOfWeek],
    dayOfWeek,
    slots: value
      .map((slot, idx) => ({ ...slot, originalIndex: idx }))
      .filter(slot => slot.dayOfWeek === dayOfWeek),
  }));

  return (
    <div className="space-y-4">
      {slotsByDay.map(({ day, dayOfWeek, slots }) => (
        <div key={dayOfWeek} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{day}</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => addSlot(dayOfWeek)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Time
            </Button>
          </div>

          {slots.length === 0 ? (
            <p className="text-xs text-white/40">Not available</p>
          ) : (
            <div className="space-y-2">
              {slots.map(slot => (
                <div key={slot.originalIndex} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(slot.originalIndex, 'startTime', e.target.value)}
                    className="flex-1 h-8 text-xs bg-white/5 border-white/10"
                  />
                  <span className="text-white/60 text-xs">to</span>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(slot.originalIndex, 'endTime', e.target.value)}
                    className="flex-1 h-8 text-xs bg-white/5 border-white/10"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSlot(slot.originalIndex)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
