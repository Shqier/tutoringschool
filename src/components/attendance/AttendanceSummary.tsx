'use client';

import React from 'react';
import { Check, X, Clock, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { AttendanceStatusType } from '@/lib/api/types';

interface AttendanceSummaryProps {
  records: Array<{ status: AttendanceStatusType }> | { total: number; present: number; absent: number; late: number; excused: number };
}

export function AttendanceSummary({ records }: AttendanceSummaryProps) {
  const stats = Array.isArray(records)
    ? {
        total: records.length,
        present: records.filter((r) => r.status === 'present').length,
        absent: records.filter((r) => r.status === 'absent').length,
        late: records.filter((r) => r.status === 'late').length,
        excused: records.filter((r) => r.status === 'excused').length,
      }
    : records;

  const presentPercent = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  const items = [
    { label: 'Present', value: stats.present, color: 'bg-green-500', icon: Check },
    { label: 'Absent', value: stats.absent, color: 'bg-red-500/80', icon: X },
    { label: 'Late', value: stats.late, color: 'bg-amber-500', icon: Clock },
    { label: 'Excused', value: stats.excused, color: 'bg-blue-500/80', icon: FileQuestion },
  ] as const;

  return (
    <Card className="busala-card border border-busala-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <h3 className="text-base font-semibold text-busala-text-primary">Attendance Summary</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-busala-text-muted">Present</span>
              <span className="text-busala-text-primary font-medium">{presentPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-busala-border overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${presentPercent}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-bold text-busala-text-primary tabular-nums">
            {stats.present}/{stats.total}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl bg-busala-card border border-busala-border p-3"
            >
              <div className={`rounded-lg p-1.5 ${color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-busala-text-muted">{label}</p>
                <p className="text-lg font-semibold text-busala-text-primary tabular-nums">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
