'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { teachers } from '@/data/mock-data';
import type { Teacher } from '@/types/dashboard';

interface TeacherProgressRowProps {
  teacher: Teacher;
}

function TeacherProgressRow({ teacher }: TeacherProgressRowProps) {
  const utilizationPercent = Math.round((teacher.hoursThisWeek / teacher.maxHours) * 100);

  const getBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-400';
    if (percent >= 75) return 'bg-busala-gold';
    return 'bg-emerald-400';
  };

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Avatar */}
      <Avatar className="h-8 w-8">
        <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
        <AvatarFallback className="bg-muted text-foreground text-xs">
          {teacher.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>

      {/* Info & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-busala-text-primary truncate">{teacher.name}</p>
          <span className="text-xs text-busala-text-subtle">
            {teacher.hoursThisWeek}/{teacher.maxHours}h
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

export function TeacherLoadCard() {
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
      <div className="space-y-1 divide-y divide-busala-border-subtle">
        {teachers.slice(0, 4).map((teacher) => (
          <TeacherProgressRow key={teacher.id} teacher={teacher} />
        ))}
      </div>
    </div>
  );
}
