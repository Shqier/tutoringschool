'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClipboardCheck, ChevronRight, User, MapPin, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/app';
import { useLessons, useLessonAttendance } from '@/lib/api/hooks';
import type { Lesson } from '@/lib/api/types';

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

type FilterRange = 'today' | 'yesterday' | 'week';

export default function AttendancePage() {
  const [range, setRange] = useState<FilterRange>('today');

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (range === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (range === 'yesterday') {
      start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [range]);

  const { data, isLoading, error } = useLessons({
    startDate,
    endDate,
  });

  const lessons = useMemo(() => {
    const list = data?.lessons ?? [];
    return list
      .filter((l) => l.status !== 'cancelled')
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Mark and view attendance for lessons"
      />

      <div className="flex flex-wrap gap-2">
        {(['today', 'yesterday', 'week'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${range === r
                ? 'busala-gradient-gold text-[#0B0D10]'
                : 'bg-busala-card border border-busala-border text-busala-text-muted hover:text-busala-text-primary'
              }
            `}
          >
            {r === 'today' ? 'Today' : r === 'yesterday' ? 'Yesterday' : 'This Week'}
          </button>
        ))}
      </div>

      {error && (
        <div className="busala-card p-6 text-center">
          <p className="text-red-400">Failed to load lessons.</p>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="busala-card rounded-2xl p-4 animate-pulse">
              <div className="h-5 bg-busala-hover-bg rounded w-1/3 mb-3" />
              <div className="h-4 bg-busala-hover-bg rounded w-2/3 mb-2" />
              <div className="h-4 bg-busala-hover-bg rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && lessons.length === 0 && (
        <div className="busala-card rounded-2xl p-8 text-center">
          <ClipboardCheck className="h-12 w-12 text-busala-text-muted mx-auto mb-3" />
          <p className="text-busala-text-primary font-medium">No lessons in this range</p>
          <p className="text-sm text-busala-text-muted mt-1">Select Today, Yesterday, or This Week to see lessons.</p>
        </div>
      )}

      {!isLoading && !error && lessons.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonAttendanceCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonAttendanceCard({ lesson }: { lesson: Lesson }) {
  const { data: attendanceData } = useLessonAttendance(lesson.id);
  const hasBeenSaved = (attendanceData?.attendances?.some((a) => a.id !== '') ?? false);
  const statusLabel = hasBeenSaved ? 'Marked' : 'Unmarked';

  return (
    <Link href={`/lessons/${lesson.id}/attendance`}>
      <div className="busala-card border border-busala-border rounded-2xl p-4 hover:border-busala-gold/40 transition-colors group">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-busala-text-primary group-hover:text-busala-gold">
              {formatTime(lesson.startAt)}
            </p>
            <p className="text-busala-text-primary font-medium mt-0.5 truncate">{lesson.title}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-busala-text-muted">
              {lesson.groupName && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {lesson.groupName}
                </span>
              )}
              {lesson.teacherName && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {lesson.teacherName}
                </span>
              )}
              {lesson.roomName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {lesson.roomName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`
                text-xs font-medium px-2 py-1 rounded-lg
                ${statusLabel === 'Marked'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-amber-500/20 text-amber-400'
                }
              `}
            >
              {statusLabel}
            </span>
            <ChevronRight className="h-4 w-4 text-busala-text-muted group-hover:text-busala-gold" />
          </div>
        </div>
      </div>
    </Link>
  );
}
