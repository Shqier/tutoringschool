'use client';

import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { todaysLessons } from '@/data/mock-data';
import type { Lesson } from '@/types/dashboard';

interface LessonRowProps {
  lesson: Lesson;
}

function LessonRow({ lesson }: LessonRowProps) {
  const getStatusBadge = (status: Lesson['status']) => {
    switch (status) {
      case 'in-progress':
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
        <span className="text-sm font-medium">{lesson.time}</span>
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-busala-text-primary truncate">{lesson.title}</p>
        <div className="flex items-center gap-3 text-xs text-busala-text-subtle">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {lesson.room}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {lesson.teacher}
          </span>
        </div>
      </div>

      {/* Duration */}
      <div className="text-xs text-busala-text-subtle w-16 text-right">
        {lesson.duration}
      </div>

      {/* Status */}
      <div className="w-24 flex justify-end">
        {getStatusBadge(lesson.status)}
      </div>
    </div>
  );
}

export function LessonsList() {
  return (
    <div className="busala-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-busala-border-glass">
        <div>
          <h3 className="text-base font-semibold text-busala-text-primary">Today&apos;s Lessons</h3>
          <p className="text-xs text-busala-text-subtle">{todaysLessons.length} lessons scheduled</p>
        </div>
        <button className="text-xs text-busala-gold hover:underline">
          View all
        </button>
      </div>

      {/* Lessons List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {todaysLessons.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
