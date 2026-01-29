'use client';

import React from 'react';
import { Users, Calendar, Clock, ChevronRight } from 'lucide-react';
import { groups } from '@/data/mock-data';
import type { Group } from '@/types/dashboard';

interface GroupRowProps {
  group: Group;
}

function GroupRow({ group }: GroupRowProps) {
  return (
    <div
      className="flex items-center gap-4 h-14 px-4 border-b border-busala-border-glass transition-colors hover:bg-busala-hover-bg cursor-pointer"
    >
      {/* Group Name & Teacher */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-busala-text-primary truncate">{group.name}</p>
        <p className="text-xs text-busala-text-subtle">{group.teacherName}</p>
      </div>

      {/* Students Count */}
      <div className="flex items-center gap-1.5 text-busala-text-subtle w-20">
        <Users className="h-3.5 w-3.5" />
        <span className="text-xs">{group.studentsCount} students</span>
      </div>

      {/* Schedule */}
      <div className="hidden lg:flex items-center gap-1.5 text-busala-text-subtle w-40">
        <Calendar className="h-3.5 w-3.5" />
        <span className="text-xs truncate">{group.schedule}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-24">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-busala-gold rounded-full transition-all"
              style={{ width: `${group.progress}%` }}
            />
          </div>
          <span className="text-xs text-busala-text-subtle w-8">{group.progress}%</span>
        </div>
      </div>

      {/* Next Lesson */}
      <div className="hidden xl:flex items-center gap-1.5 text-busala-text-subtle w-32">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs">{group.nextLesson}</span>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 text-busala-text-subtle" />
    </div>
  );
}

export function GroupsLessonsTable() {
  return (
    <div className="busala-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-busala-border-glass">
        <div>
          <h3 className="text-base font-semibold text-busala-text-primary">Groups & Lessons</h3>
          <p className="text-xs text-busala-text-subtle">{groups.length} active groups</p>
        </div>
        <button className="text-xs text-busala-gold hover:underline">
          View all
        </button>
      </div>

      {/* Table Header */}
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

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {groups.map((group) => (
          <GroupRow key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
