'use client';

import React from 'react';
import type { AttendanceStatusType } from '@/lib/api/types';

export interface AttendanceCalendarProps {
  attendanceRecords: Array<{ date: string; status: AttendanceStatusType }> | Record<string, AttendanceStatusType>;
  month: number;
  year: number;
  className?: string;
}

const STATUS_COLORS: Record<AttendanceStatusType, string> = {
  present: 'bg-green-500/80',
  absent: 'bg-red-500/80',
  late: 'bg-amber-500/80',
  excused: 'bg-blue-500/80',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AttendanceCalendar({ attendanceRecords, month, year, className = '' }: AttendanceCalendarProps) {
  const recordMap = Array.isArray(attendanceRecords)
    ? Object.fromEntries(attendanceRecords.map((r) => [r.date, r.status]))
    : attendanceRecords;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) {
    week.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const dateKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className={`inline-block ${className}`}>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-[10px] font-medium text-busala-text-muted py-1">
            {label}
          </div>
        ))}
        {weeks.flatMap((w) =>
          w.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="w-8 h-8" />;
            }
            const key = dateKey(day);
            const status = recordMap[key];
            const colorClass = status ? STATUS_COLORS[status] : 'bg-busala-hover-bg';
            return (
              <div
                key={key}
                className={`w-8 h-8 rounded flex items-center justify-center text-xs ${colorClass} text-busala-text-primary`}
                title={status ? `${key}: ${status}` : key}
              >
                {day}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
