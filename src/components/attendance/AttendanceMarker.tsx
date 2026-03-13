'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Check, X, Clock, FileQuestion, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useSaveLessonAttendance } from '@/lib/api/hooks';
import type { AttendanceWithStudent, AttendanceStatusType } from '@/lib/api/types';

const STATUS_OPTIONS: { value: AttendanceStatusType; label: string; icon: React.ElementType }[] = [
  { value: 'present', label: 'Present', icon: Check },
  { value: 'absent', label: 'Absent', icon: X },
  { value: 'late', label: 'Late', icon: Clock },
  { value: 'excused', label: 'Excused', icon: FileQuestion },
];

interface AttendanceMarkerProps {
  lessonId: string;
  students: Array<{ id: string; fullName: string }>;
  initialAttendance: Array<AttendanceWithStudent | { studentId: string; student: { id: string; fullName: string }; status: AttendanceStatusType; note?: string }>;
  onSaved?: () => void;
  lessonStartAt?: string;
}

export function AttendanceMarker({
  lessonId,
  students,
  initialAttendance,
  onSaved,
  lessonStartAt,
}: AttendanceMarkerProps) {
  const saveMutation = useSaveLessonAttendance();

  const [rows, setRows] = useState(() =>
    students.map((s) => {
      const existing = initialAttendance.find((a) => a.studentId === s.id || (a as { student?: { id: string } }).student?.id === s.id);
      return {
        studentId: s.id,
        studentName: s.fullName,
        status: (existing?.status ?? 'absent') as AttendanceStatusType,
        note: existing?.note ?? '',
      };
    })
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setRows(
      students.map((s) => {
        const existing = initialAttendance.find((a) => a.studentId === s.id || (a as { student?: { id: string } }).student?.id === s.id);
        return {
          studentId: s.id,
          studentName: s.fullName,
          status: (existing?.status ?? 'absent') as AttendanceStatusType,
          note: existing?.note ?? '',
        };
      })
    );
  }, [students, initialAttendance]);

  const handleStatusChange = useCallback((studentId: string, status: AttendanceStatusType) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
    setHasChanges(true);
    setValidationError(null);
  }, []);

  const handleNoteChange = useCallback((studentId: string, note: string) => {
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
    setHasChanges(true);
    setValidationError(null);
  }, []);

  const handleMarkAllPresent = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, status: 'present' as AttendanceStatusType })));
    setHasChanges(true);
    setValidationError(null);
  }, []);

  const handleKeyDown = useCallback(
    (studentId: string, e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const map: Record<string, AttendanceStatusType> = {
        p: 'present',
        a: 'absent',
        l: 'late',
        e: 'excused',
      };
      if (map[key]) {
        e.preventDefault();
        handleStatusChange(studentId, map[key]);
      }
    },
    [handleStatusChange]
  );

  const handleSave = useCallback(async () => {
    const excusedWithoutNote = rows.filter((r) => r.status === 'excused' && !r.note?.trim());
    if (excusedWithoutNote.length > 0) {
      setValidationError('Note is required when status is Excused');
      return;
    }
    setValidationError(null);
    try {
      await saveMutation.mutate({
        lessonId,
        input: {
          attendances: rows.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            note: r.note?.trim() || undefined,
          })),
        },
      });
      setHasChanges(false);
      onSaved?.();
    } catch {
      setValidationError('Failed to save attendance');
    }
  }, [lessonId, rows, saveMutation, onSaved]);

  const isFutureLesson = lessonStartAt ? new Date(lessonStartAt) > new Date() : false;

  return (
    <Card className="busala-card border border-busala-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-semibold text-busala-text-primary">Mark Attendance</h3>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-amber-500 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Unsaved changes
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllPresent}
              className="border-busala-border text-busala-text-muted hover:text-busala-text-primary"
            >
              Mark All Present
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isLoading}
              className="busala-gradient-gold text-white hover:opacity-90"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saveMutation.isLoading ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
        {isFutureLesson && (
          <p className="text-amber-500 text-sm mt-1">This lesson has not started yet. You can still mark attendance.</p>
        )}
        {rows.length > 0 && (
          <p className="text-busala-text-muted text-xs mt-1">Shortcuts: P Present, A Absent, L Late, E Excused (focus a row first)</p>
        )}
        {validationError && (
          <p className="text-red-500 text-sm mt-1">{validationError}</p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-busala-border text-busala-text-muted">
                <th className="text-left py-3 px-4 font-medium">Student</th>
                {STATUS_OPTIONS.map((opt) => (
                  <th key={opt.value} className="py-3 px-2 text-center font-medium w-24">
                    {opt.label}
                  </th>
                ))}
                <th className="text-left py-3 px-4 font-medium min-w-[140px]">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.studentId}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(row.studentId, e)}
                  className="border-b border-busala-border/60 hover:bg-busala-hover-bg/50 transition-colors focus:bg-busala-hover-bg/50 outline-none"
                >
                  <td className="py-3 px-4 font-medium text-busala-text-primary">
                    {row.studentName}
                  </td>
                  {STATUS_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = row.status === opt.value;
                    return (
                      <td key={opt.value} className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.studentId, opt.value)}
                          className={`
                            inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all
                            ${isSelected
                              ? opt.value === 'present'
                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                : opt.value === 'absent'
                                  ? 'border-red-500/60 bg-red-500/20 text-red-400'
                                  : opt.value === 'late'
                                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                                    : 'border-blue-500/60 bg-blue-500/20 text-blue-400'
                              : 'border-busala-border bg-transparent text-busala-text-muted hover:border-busala-text-muted'
                            }
                          `}
                          title={`${opt.label} (${opt.value === 'present' ? 'P' : opt.value === 'absent' ? 'A' : opt.value === 'late' ? 'L' : 'E'})`}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-2 px-4">
                    <Input
                      placeholder="Note (required if excused)"
                      value={row.note}
                      onChange={(e) => handleNoteChange(row.studentId, e.target.value)}
                      className="h-9 bg-busala-card border-busala-border text-busala-text-primary placeholder:text-busala-text-muted"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
