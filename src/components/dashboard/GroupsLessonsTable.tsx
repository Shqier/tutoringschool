// ============================================
// GROUPS & LESSONS TABLE - Wired to Live API
// Updated: Phase 3 - Frontend-Backend Integration
// Shows active groups with real-time data
// ============================================

'use client';

import React from 'react';
import { Users, Calendar, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGroups } from '@/lib/api/hooks';
import type { Group as ApiGroup } from '@/lib/api/types';

interface GroupRowProps {
  group: ApiGroup;
}

function GroupRow({ group }: GroupRowProps) {
  // Format schedule from schedule rule (if available)
  const formatSchedule = () => {
    if (group.schedule) {
      return group.schedule;
    }
    if (group.scheduleRule) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNames = group.scheduleRule.daysOfWeek.map(d => days[d]).join(', ');
      return `${dayNames} - ${group.scheduleRule.startTime}`;
    }
    return 'No schedule';
  };

  return (
    <div
      className="flex items-center gap-4 h-14 px-4 border-b border-busala-border-glass transition-colors hover:bg-busala-hover-bg cursor-pointer"
    >
      {/* Group Name & Teacher */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-busala-text-primary truncate">{group.name}</p>
        <p className="text-xs text-busala-text-subtle">{group.teacherName || 'Unknown Teacher'}</p>
      </div>

      {/* Students Count */}
      <div className="flex items-center gap-1.5 text-busala-text-subtle w-20">
        <Users className="h-3.5 w-3.5" />
        <span className="text-xs">{group.studentsCount || group.studentIds.length} students</span>
      </div>

      {/* Schedule */}
      <div className="hidden lg:flex items-center gap-1.5 text-busala-text-subtle w-40">
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-xs truncate">{formatSchedule()}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-24">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-busala-gold rounded-full transition-all"
              style={{ width: `${group.progress || 0}%` }}
            />
          </div>
          <span className="text-xs text-busala-text-subtle w-8">{group.progress || 0}%</span>
        </div>
      </div>

      {/* Next Lesson */}
      <div className="hidden xl:flex items-center gap-1.5 text-busala-text-subtle w-32">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs">{group.nextLesson || 'Not scheduled'}</span>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-busala-text-subtle" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-none border-b border-busala-border-glass" />
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
      <p className="text-sm text-red-400 mb-2">Failed to load groups</p>
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
      <Users className="h-8 w-8 text-busala-text-subtle mb-3" />
      <p className="text-sm text-busala-text-muted">No groups found</p>
      <p className="text-xs text-busala-text-subtle mt-1">Create your first group to get started</p>
    </div>
  );
}

export function GroupsLessonsTable() {
  // Fetch groups data
  const { data, isLoading, error, refetch } = useGroups();

  const groups = data?.groups || [];

  return (
    <div className="busala-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-busala-border-glass">
        <div>
          <h3 className="text-base font-semibold text-busala-text-primary">Groups & Lessons</h3>
          <p className="text-xs text-busala-text-subtle">
            {isLoading ? 'Loading...' : `${groups.length} active group${groups.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="text-xs text-busala-gold hover:underline">
          View all
        </button>
      </div>

      {/* Table Header */}
      {!isLoading && !error && groups.length > 0 && (
        <div
          className="flex items-center gap-4 h-10 px-4 text-xs font-medium text-busala-text-subtle border-b border-busala-border-glass"
        >
          <div className="flex-1">Group / Teacher</div>
          <div className="w-20">Students</div>
          <div className="hidden lg:block w-40">Schedule</div>
          <div className="w-24">Progress</div>
          <div className="hidden xl:block w-32">Next Lesson</div>
          <div className="w-4" />
        </div>
      )}

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && <LoadingSkeleton />}

        {error && (
          <ErrorState
            error={error.message || 'Unable to connect. Please check your connection.'}
            onRetry={refetch}
          />
        )}

        {!isLoading && !error && groups.length === 0 && <EmptyState />}

        {!isLoading && !error && groups.length > 0 && (
          <>
            {groups.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
