'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AttendanceMarker, AttendanceSummary } from '@/components/attendance';
import { useLessonAttendance, useSaveLessonAttendance } from '@/lib/api/hooks';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function LessonAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const { data, isLoading, error, refetch } = useLessonAttendance(lessonId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-busala-hover-bg rounded animate-pulse" />
        <div className="h-64 bg-busala-hover-bg rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="busala-card p-6 text-center">
        <p className="text-red-400 mb-4">Lesson not found or failed to load.</p>
        <Button onClick={() => router.push('/attendance')} className="busala-gradient-gold text-[#0B0D10]">
          Back to Attendance
        </Button>
      </div>
    );
  }

  const students = data.attendances.map((a) => ({
    id: a.student.id,
    fullName: a.student.fullName,
  }));

  const handleSaved = () => {
    refetch();
    router.push('/attendance');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-busala-text-muted">
        <Link href="/lessons" className="hover:text-busala-text-primary transition-colors">
          Lessons
        </Link>
        <span>/</span>
        <Link href="/attendance" className="hover:text-busala-text-primary transition-colors">
          Attendance
        </Link>
        <span>/</span>
        <span className="text-busala-text-primary font-medium truncate max-w-[180px]">
          {data.lesson?.title ?? 'Mark'}
        </span>
      </nav>

      {/* Lesson details */}
      {data.lesson && (
        <div className="busala-card border border-busala-border rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-busala-text-primary">{data.lesson.title}</h2>
              <p className="text-sm text-busala-text-muted mt-0.5">
                {formatDate(data.lesson.startAt)} · {formatTime(data.lesson.startAt)} – {formatTime(data.lesson.endAt)}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-busala-text-muted">
                {data.lesson.groupName && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {data.lesson.groupName}
                  </span>
                )}
                {data.lesson.teacherName && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {data.lesson.teacherName}
                  </span>
                )}
                {data.lesson.roomName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {data.lesson.roomName}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/attendance')}
              className="text-busala-text-muted hover:text-busala-text-primary shrink-0"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Attendance
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceMarker
            lessonId={lessonId}
            students={students}
            initialAttendance={data.attendances}
            onSaved={handleSaved}
            lessonStartAt={data.lesson?.startAt}
          />
        </div>
        <div>
          <AttendanceSummary records={data.stats} />
        </div>
      </div>
    </div>
  );
}
