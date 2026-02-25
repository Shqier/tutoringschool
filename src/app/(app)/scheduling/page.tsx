'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PageHeader,
  SkeletonCard,
} from '@/components/app';
import { useLessons, useScheduling } from '@/lib/api/hooks';
import type { ScheduleConflict } from '@/lib/api/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

// Generate a color based on group name (deterministic)
function getGroupColor(groupName: string | undefined): string {
  const colors = ['#F5A623', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];
  if (!groupName) return colors[0];
  const hash = groupName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function SchedulingPage() {
  const [currentWeek, setCurrentWeek] = useState(0);

  // Calculate week start
  const weekStart = useMemo(() => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday
    const monday = new Date(date.setDate(diff));
    monday.setDate(monday.getDate() + currentWeek * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [currentWeek]);

  const weekEnd = useMemo(() => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + 6);
    date.setHours(23, 59, 59, 999);
    return date;
  }, [weekStart]);

  // Fetch lessons for the week
  const { data: lessonsData, isLoading: lessonsLoading } = useLessons({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
  });

  // Fetch scheduling conflicts
  const { data: schedulingData, isLoading: schedulingLoading } = useScheduling({
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
  });

  const lessons = useMemo(() => lessonsData?.lessons || [], [lessonsData]);
  const conflicts = schedulingData?.conflicts || [];

  const formatDateRange = () => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 4);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${start.getFullYear()}`;
  };

  // Convert lessons to schedule slots
  const scheduleSlots = useMemo(() => {
    return lessons.map((lesson) => {
      const startDate = new Date(lesson.startAt);
      const dayIndex = startDate.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return {
        id: lesson.id,
        day: dayNames[dayIndex],
        startTime: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        endTime: new Date(lesson.endAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        lessonTitle: lesson.title,
        teacher: lesson.teacherName || 'Unknown',
        room: lesson.roomName || 'No room',
        group: lesson.groupName || '',
        color: getGroupColor(lesson.groupName),
      };
    });
  }, [lessons]);

  const getSlotForDayAndHour = (day: string, hour: number) => {
    return scheduleSlots.find((slot) => {
      const slotHour = parseInt(slot.startTime.split(':')[0]);
      return slot.day === day && slotHour === hour;
    });
  };

  const getSeverityColor = (severity: ScheduleConflict['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduling"
        subtitle="Manage your weekly schedule"
        actionLabel="Generate Schedule"
        actionIcon={Sparkles}
        onAction={() => toast.info('Auto-schedule generation coming soon')}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Main Calendar Grid - 9 columns */}
        <div className="col-span-12 xl:col-span-9">
          <div className="busala-card overflow-hidden">
            {/* Week Selector */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--busala-border-divider)' }}
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentWeek((w) => w - 1)}
                  className="h-8 w-8 text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-busala-text-primary min-w-[180px] text-center">
                  {formatDateRange()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentWeek((w) => w + 1)}
                  className="h-8 w-8 text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentWeek(0)}
                className="text-xs text-[#F5A623] hover:text-[#F5A623] hover:bg-[#F5A623]/10"
              >
                Today
              </Button>
            </div>

            {/* Grid */}
            {lessonsLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-busala-hover-bg rounded" />
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="h-16 bg-busala-hover-bg rounded" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Day Headers */}
                  <div
                    className="grid grid-cols-[60px_repeat(5,1fr)] border-b"
                    style={{ borderColor: 'var(--busala-border-divider)' }}
                  >
                    <div className="p-3" />
                    {DAYS.map((day, idx) => {
                      const date = new Date(weekStart);
                      date.setDate(date.getDate() + idx);
                      const isToday = new Date().toDateString() === date.toDateString();
                      return (
                        <div
                          key={day}
                          className={`
                            p-3 text-center border-l
                            ${isToday ? 'bg-[#F5A623]/5' : ''}
                          `}
                          style={{ borderColor: 'var(--busala-border-divider)' }}
                        >
                          <p className={`text-xs ${isToday ? 'text-[#F5A623]' : 'text-busala-text-muted'}`}>
                            {day.slice(0, 3)}
                          </p>
                          <p className={`text-lg font-semibold ${isToday ? 'text-[#F5A623]' : 'text-busala-text-primary'}`}>
                            {date.getDate()}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time Slots */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="grid grid-cols-[60px_repeat(5,1fr)] border-b"
                      style={{ borderColor: 'var(--busala-border-divider)' }}
                    >
                      {/* Time Label */}
                      <div className="p-2 text-xs text-busala-text-subtle text-right pr-3">{hour}:00</div>

                      {/* Day Cells */}
                      {DAYS.map((day, dayIdx) => {
                        const slot = getSlotForDayAndHour(day, hour);
                        const date = new Date(weekStart);
                        date.setDate(date.getDate() + dayIdx);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                          <div
                            key={`${day}-${hour}`}
                            className={`
                              min-h-[60px] p-1 border-l
                              ${isToday ? 'bg-[#F5A623]/5' : ''}
                            `}
                            style={{ borderColor: 'var(--busala-border-divider)' }}
                          >
                            {slot && (
                              <div
                                className="h-full rounded-lg p-2 cursor-pointer hover:opacity-90 transition-opacity"
                                style={{
                                  backgroundColor: `${slot.color}20`,
                                  borderLeft: `3px solid ${slot.color}`,
                                }}
                              >
                                <p className="text-xs font-medium text-busala-text-primary truncate">
                                  {slot.lessonTitle}
                                </p>
                                <p className="text-[10px] text-busala-text-muted truncate">
                                  {slot.teacher.split(' ')[0]} - {slot.room}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - 3 columns */}
        <div className="col-span-12 xl:col-span-3 space-y-6">
          {/* Conflicts Card */}
          {schedulingLoading ? (
            <SkeletonCard />
          ) : (
            <div className="busala-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-busala-text-primary">Conflicts</h3>
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs ml-auto">
                  {conflicts.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {conflicts.length > 0 ? (
                  conflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className={`p-3 rounded-lg border ${getSeverityColor(conflict.severity)}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${getSeverityColor(conflict.severity)} text-xs px-1.5 py-0`}>
                          {conflict.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-busala-text-secondary">{conflict.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-busala-text-muted text-center py-2">No conflicts found</p>
                )}
              </div>
            </div>
          )}

          {/* Week Summary */}
          <div className="busala-card p-4">
            <h3 className="text-sm font-medium text-busala-text-muted mb-4">Week Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Total Lessons</span>
                <span className="text-sm font-medium text-busala-text-primary">{lessons.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Conflicts</span>
                <span className={`text-sm font-medium ${conflicts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {conflicts.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Teachers Active</span>
                <span className="text-sm font-medium text-busala-text-primary">
                  {new Set(lessons.map((l) => l.teacherId)).size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Rooms Used</span>
                <span className="text-sm font-medium text-busala-text-primary">
                  {new Set(lessons.filter((l) => l.roomId).map((l) => l.roomId)).size}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
