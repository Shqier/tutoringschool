'use client';

import React from 'react';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Alert not in ui - use card styling for error
import {
  useTeacherAvailability,
  useConfirmTeacherAvailability,
} from '@/lib/api/hooks';

interface MonthlyConfirmationProps {
  teacherId: string;
  month?: number; // 1-12, defaults to next month
  year?: number;
  onEdit?: () => void;
}

export function MonthlyConfirmation({
  teacherId,
  month,
  year,
  onEdit,
}: MonthlyConfirmationProps) {
  const { data, isLoading, error } = useTeacherAvailability(teacherId);
  const confirmMutation = useConfirmTeacherAvailability();

  const now = new Date();
  const targetMonth = month || now.getMonth() + 2; // Default to next month
  const targetYear = year || (targetMonth > 12 ? now.getFullYear() + 1 : now.getFullYear());
  const adjustedMonth = targetMonth > 12 ? targetMonth - 12 : targetMonth;

  const monthName = new Date(targetYear, adjustedMonth - 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync({
        teacherId,
        month: adjustedMonth,
        year: targetYear,
      });
    } catch (err) {
      console.error('Failed to confirm availability:', err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-20 bg-gray-100 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            Failed to load availability status
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConfirmedForTargetMonth =
    data?.confirmedForMonth === adjustedMonth && data?.confirmedForYear === targetYear;

  const isPending = data?.status === 'pending' || !isConfirmedForTargetMonth;
  const isConfirmed = isConfirmedForTargetMonth;

  // Calculate days until auto-confirm
  const monthStart = new Date(targetYear, adjustedMonth - 1, 1);
  const autoConfirmDate = new Date(monthStart);
  autoConfirmDate.setDate(autoConfirmDate.getDate() + 3);
  const daysUntilAutoConfirm = Math.max(
    0,
    Math.ceil((autoConfirmDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (isConfirmed) {
    return (
      <Card className="border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Availability Confirmed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Your availability for <strong>{monthName}</strong> has been confirmed.
          </p>
          {data?.confirmedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Confirmed on {new Date(data.confirmedAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isPending ? 'border-amber-200' : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Confirm Availability
          </div>
          <Badge variant={isPending ? 'secondary' : 'outline'}>{data?.status || 'pending'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            Please confirm your availability for <strong>{monthName}</strong>.
            {!isConfirmed && daysUntilAutoConfirm > 0 && (
              <>
                <br />
                Auto-confirms in {daysUntilAutoConfirm} day
                {daysUntilAutoConfirm !== 1 ? 's' : ''}.
              </>
            )}
          </div>
        </div>

        {data?.availability && data.availability.length > 0 ? (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Current Schedule:</p>
            <div className="space-y-1">
              {data.availability
                .filter((day) => day.slots.length > 0)
                .map((day) => (
                  <div key={day.day} className="text-sm">
                    <span className="font-medium capitalize">{day.day}:</span>{' '}
                    {day.slots.map((slot, i) => (
                      <span key={i} className="text-gray-600">
                        {slot.start}-{slot.end}
                        {i < day.slots.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              No availability set. Please set your schedule first.
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleConfirm}
            disabled={
              confirmMutation.isLoading ||
              !data?.availability ||
              data.availability.length === 0
            }
            className="flex-1"
          >
            {confirmMutation.isLoading ? 'Confirming...' : '✓ Confirm for ' + monthName}
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={onEdit} className="flex-1">
              Edit Schedule
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
