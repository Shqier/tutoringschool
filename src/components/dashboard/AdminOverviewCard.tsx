// ============================================
// ADMIN OVERVIEW CARD - Wired to Live API
// Updated: Phase 3 - Frontend-Backend Integration
// Shows real-time stats from multiple API endpoints
// ============================================

'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { StatMiniCard } from './StatMiniCard';
import { currentUser } from '@/data/mock-data';
import { useTeachers, useStudents, useGroups, useLessons, useApprovals } from '@/lib/api/hooks';
import type { StatCard } from '@/types/dashboard';

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function AdminOverviewCard() {
  const [showInfo, setShowInfo] = React.useState(true);

  // Get today's date for lessons filter
  const today = new Date().toISOString().split('T')[0];

  // Fetch data from all endpoints
  const { data: teachersData, isLoading: loadingTeachers } = useTeachers({ status: 'active' });
  const { data: studentsData, isLoading: loadingStudents } = useStudents();
  const { data: groupsData, isLoading: loadingGroups } = useGroups();
  const { data: lessonsData, isLoading: loadingLessons } = useLessons({ date: today });
  const { data: approvalsData, isLoading: loadingApprovals } = useApprovals({ status: 'pending' });

  // Calculate stats from API responses
  const isLoading = loadingTeachers || loadingStudents || loadingGroups || loadingLessons || loadingApprovals;

  // Create stat cards
  const stats: StatCard[] = [
    {
      id: 'teachers',
      label: 'Teachers',
      value: teachersData?.total || 0,
      icon: 'Users',
      trend: { direction: 'neutral', value: '0' },
    },
    {
      id: 'students',
      label: 'Students',
      value: studentsData?.total || 0,
      icon: 'GraduationCap',
      trend: { direction: 'neutral', value: '0' },
    },
    {
      id: 'active-groups',
      label: 'Active Groups',
      value: groupsData?.total || 0,
      icon: 'Users2',
      trend: { direction: 'neutral', value: '0' },
    },
    {
      id: 'classes-today',
      label: 'Classes Today',
      value: lessonsData?.lessons.length || 0,
      icon: 'Calendar',
      trend: { direction: 'neutral', value: '0' },
    },
    {
      id: 'pending-approvals',
      label: 'Pending Approvals',
      value: approvalsData?.total || 0,
      icon: 'ClipboardCheck',
      trend: { direction: 'neutral', value: '0' },
    },
  ];

  return (
    <div className="busala-card p-6">
      <div className="flex items-start justify-between mb-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="bg-muted text-foreground text-lg">
              {currentUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-busala-text-primary">
              Hello, {currentUser.name}
            </h2>
            <p className="text-sm text-busala-text-subtle">
              Welcome back to your dashboard
            </p>
          </div>
        </div>

        {/* Hide Info Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-busala-text-subtle">Hide info</span>
          <Switch
            checked={!showInfo}
            onCheckedChange={(checked) => setShowInfo(!checked)}
            className="data-[state=checked]:bg-busala-gold"
          />
        </div>
      </div>

      {/* Stats Grid */}
      {showInfo && (
        <>
          {isLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {stats.map((stat) => (
                <StatMiniCard key={stat.id} stat={stat} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
