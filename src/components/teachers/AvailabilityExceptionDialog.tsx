'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { v4 as uuidv4 } from 'uuid';
import type { AvailabilityException } from '@/lib/db/types';

interface AvailabilityExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exception: AvailabilityException) => void;
  exception?: AvailabilityException;
}

export function AvailabilityExceptionDialog({
  open,
  onOpenChange,
  onSave,
  exception,
}: AvailabilityExceptionDialogProps) {
  const [type, setType] = useState<'unavailable' | 'available'>(exception?.type || 'unavailable');
  const [startDate, setStartDate] = useState(exception?.startDate || '');
  const [endDate, setEndDate] = useState(exception?.endDate || '');
  const [reason, setReason] = useState(exception?.reason || '');
  const [allDay, setAllDay] = useState(exception?.allDay ?? true);
  const [startTime, setStartTime] = useState(exception?.startTime || '09:00');
  const [endTime, setEndTime] = useState(exception?.endTime || '17:00');

  const handleSave = () => {
    const newException: AvailabilityException = {
      id: exception?.id || uuidv4(),
      type,
      startDate,
      endDate,
      reason: reason || undefined,
      allDay,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
    };
    onSave(newException);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B0D10] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{exception ? 'Edit' : 'Add'} Exception</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(val: 'unavailable' | 'available') => setType(val)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unavailable" id="unavailable" />
                <Label htmlFor="unavailable" className="font-normal cursor-pointer">
                  Unavailable (block time)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="available" />
                <Label htmlFor="available" className="font-normal cursor-pointer">
                  Available (override schedule)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="allDay" className="font-normal cursor-pointer">
              All day
            </Label>
          </div>

          {/* Time Range (if not all day) */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Vacation, Sick day, Meeting"
              className="bg-white/5 border-white/10 resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!startDate || !endDate}
            className="busala-gradient-gold text-[#0B0D10]"
          >
            Save Exception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
