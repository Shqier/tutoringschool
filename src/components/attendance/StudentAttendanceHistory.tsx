'use client';

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useStudentAttendance } from '@/lib/api/hooks';
import { AttendanceSummary } from './AttendanceSummary';
import type { StudentAttendanceRecord } from '@/lib/api/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    present: 'bg-green-500/20 text-green-400 border-green-500/40',
    absent: 'bg-red-500/20 text-red-400 border-red-500/40',
    late: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    excused: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border capitalize ${styles[status] ?? 'bg-busala-border text-busala-text-muted'}`}>
      {status}
    </span>
  );
}

interface StudentAttendanceHistoryProps {
  studentId: string;
}

export function StudentAttendanceHistory({ studentId }: StudentAttendanceHistoryProps) {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading, error } = useStudentAttendance(studentId, { from, to });

  const records: StudentAttendanceRecord[] = data?.records ?? [];

  return (
    <div className="space-y-6">
      <Card className="busala-card border border-busala-border rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-busala-text-primary">Attendance History</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-busala-text-muted">
                <Calendar className="h-4 w-4" />
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 px-3 rounded-xl bg-busala-card border border-busala-border text-busala-text-primary text-sm"
              />
              <label className="text-sm text-busala-text-muted">to</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 px-3 rounded-xl bg-busala-card border border-busala-border text-busala-text-primary text-sm"
              />
            </div>
          </div>
          {data && (
            <p className="text-sm text-busala-text-muted mt-1">
              Attendance rate: <span className="font-semibold text-busala-text-primary">{data.attendancePercent.toFixed(1)}%</span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-red-500 text-sm py-4">Failed to load attendance.</p>
          )}
          {isLoading && (
            <p className="text-busala-text-muted text-sm py-8 text-center">Loading…</p>
          )}
          {!isLoading && !error && records.length === 0 && (
            <p className="text-busala-text-muted text-sm py-8 text-center">No attendance records in this range.</p>
          )}
          {!isLoading && !error && records.length > 0 && (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-busala-border text-busala-text-muted">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Lesson</th>
                    <th className="text-left py-3 px-2 font-medium">Group</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-busala-border/60 hover:bg-busala-hover-bg/50">
                      <td className="py-3 px-2 text-busala-text-primary whitespace-nowrap">
                        {formatDate(r.lessonDate)}
                      </td>
                      <td className="py-3 px-2 text-busala-text-primary">{r.lessonTitle}</td>
                      <td className="py-3 px-2 text-busala-text-muted">{r.groupName ?? '—'}</td>
                      <td className="py-3 px-2">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-3 px-2 text-busala-text-muted max-w-[200px] truncate">
                        {r.note ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data && records.length > 0 && (
        <AttendanceSummary records={records} />
      )}
    </div>
  );
}
