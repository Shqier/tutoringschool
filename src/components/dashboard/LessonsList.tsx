// ============================================
// LESSONS LIST - Wired to Live API
// Updated: Phase 3 - Frontend-Backend Integration
// Shows today's lessons with real-time data
// ============================================

'use client';

import React from 'react';
import { Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLessons } from '@/lib/api/hooks';
import type { Lesson as ApiLesson } from '@/lib/api/types';

interface LessonRowProps {
  lesson: ApiLesson;
}

function LessonRow({ lesson }: LessonRowProps) {
  // Format time from ISO string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Calculate duration in minutes
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    return `${minutes} min`;
  };

  // Map API status to display status (API uses snake_case, component expects kebab-case)
  const getStatusBadge = (status: ApiLesson['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-busala-hover-bg text-busala-text-subtle hover:bg-busala-hover-bg/80 border-busala-border-glass">
            Completed
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-busala-gold/10 text-busala-gold hover:bg-busala-gold/20 border-busala-gold/20">
            Upcoming
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex items-center gap-4 h-14 px-4 rounded-lg transition-colors hover:bg-busala-hover-bg cursor-pointer"
    >
      {/* Time */}
      <div className="w-16 flex items-center gap-2 text-busala-text-muted">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">{formatTime(lesson.startAt)}</span>
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-busala-text-primary truncate">{lesson.title}</p>
        <div className="flex items-center gap-3 text-xs text-busala-text-subtle">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {lesson.roomName || 'No room'}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {lesson.teacherName || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Duration */}
      <div className="text-xs text-busala-text-subtle w-16 text-right">
        {calculateDuration(lesson.startAt, lesson.endAt)}
      </div>

      {/* Status */}
      <div className="w-24 flex justify-end">
        {getStatusBadge(lesson.status)}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
      <p className="text-sm text-red-400 mb-2">Failed to load lessons</p>
      <p className="text-xs text-busala-text-subtle mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="text-xs text-busala-gold hover:underline"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Clock className="h-8 w-8 text-busala-text-subtle mb-3" />
      <p className="text-sm text-busala-text-muted">No lessons scheduled for today</p>
      <p className="text-xs text-busala-text-subtle mt-1">Check back tomorrow or add a new lesson</p>
    </div>
  );
}

export function LessonsList() {
  // Get today's date in YYYY-MM-DD format (UTC)
  const today = new Date().toISOString().split('T')[0];

  // Fetch lessons for today
  const { data, isLoading, error, refetch } = useLessons({
    date: today,
  });

  const lessons = data?.lessons || [];

  return (
    <div className="busala-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-busala-border-glass">
        <div>
          <h3 className="text-base font-semibold text-busala-text-primary">Today&apos;s Lessons</h3>
          <p className="text-xs text-busala-text-subtle">
            {isLoading ? 'Loading...' : `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''} scheduled`}
          </p>
        </div>
        <button className="text-xs text-busala-gold hover:underline">
          View all
        </button>
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && <LoadingSkeleton />}

        {error && (
          <ErrorState
            error={error.message || 'Unable to connect. Please check your connection.'}
            onRetry={refetch}
          />
        )}

        {!isLoading && !error && lessons.length === 0 && <EmptyState />}

        {!isLoading && !error && lessons.length > 0 && (
          <div className="p-2">
            {lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
