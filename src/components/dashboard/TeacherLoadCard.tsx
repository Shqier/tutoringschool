// ============================================
// TEACHER LOAD CARD - Wired to Live API
// Updated: Phase 3 - Frontend-Backend Integration
// Shows teacher workload with real-time data
// ============================================

'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users } from 'lucide-react';
import { useTeachers } from '@/lib/api/hooks';
import type { Teacher as ApiTeacher } from '@/lib/api/types';

interface TeacherProgressRowProps {
  teacher: ApiTeacher;
}

function TeacherProgressRow({ teacher }: TeacherProgressRowProps) {
  const hoursThisWeek = teacher.hoursThisWeek || 0;
  const maxHours = teacher.maxHours || 25;
  const utilizationPercent = Math.round((hoursThisWeek / maxHours) * 100);

  const getBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-400';
    if (percent >= 75) return 'bg-busala-gold';
    return 'bg-emerald-400';
  };

  // Generate initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={undefined} alt={teacher.fullName} />
        <AvatarFallback className="bg-muted text-foreground text-xs">
          {getInitials(teacher.fullName)}
        </AvatarFallback>
      </Avatar>

      {/* Info & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-busala-text-primary truncate">{teacher.fullName}</p>
          <span className="text-xs text-busala-text-subtle">
            {hoursThisWeek}/{maxHours}h
          </span>
        </div>
        <div className="h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getBarColor(utilizationPercent)}`}
            style={{ width: `${utilizationPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1 divide-y divide-busala-border-subtle">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="py-3">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-3" />
      <p className="text-sm text-red-400 mb-2">Failed to load teachers</p>
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
      <p className="text-sm text-busala-text-muted">No active teachers</p>
      <p className="text-xs text-busala-text-subtle mt-1">Add teachers to see their workload</p>
    </div>
  );
}

export function TeacherLoadCard() {
  // Fetch active teachers
  const { data, isLoading, error, refetch } = useTeachers({ status: 'active' });

  // Sort teachers by hours this week (descending)
  const teachers = React.useMemo(() => {
    if (!data?.teachers) return [];
    return [...data.teachers]
      .sort((a, b) => (b.hoursThisWeek || 0) - (a.hoursThisWeek || 0))
      .slice(0, 6); // Show top 6 teachers
  }, [data?.teachers]);

  return (
    <div className="busala-card p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-busala-text-primary">Teacher Load</h3>
        <button className="text-xs text-busala-gold hover:underline">
          View all
        </button>
      </div>

      {/* Teacher List */}
      {isLoading && <LoadingSkeleton />}

      {error && (
        <ErrorState
          error={error.message || 'Unable to connect. Please check your connection.'}
          onRetry={refetch}
        />
      )}

      {!isLoading && !error && teachers.length === 0 && <EmptyState />}

      {!isLoading && !error && teachers.length > 0 && (
        <div className="space-y-1 divide-y divide-busala-border-subtle">
          {teachers.map((teacher) => (
            <TeacherProgressRow key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}
    </div>
  );
}
