'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  BookOpen,
  Edit,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  StatusBadge,
  SkeletonCard,
} from '@/components/app';
import { useStudent, useLessons, useGroups } from '@/lib/api/hooks';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: student, isLoading, error } = useStudent(studentId);
  const { data: groupsData } = useGroups();

  const lessonsDateRange = useMemo(() => {
    const now = new Date();
    const past = new Date(now);
    past.setDate(past.getDate() - 30);
    const future = new Date(now);
    future.setDate(future.getDate() + 7);
    return { startDate: past.toISOString(), endDate: future.toISOString() };
  }, []);

  const { data: lessonsData } = useLessons(lessonsDateRange);

  const groups = useMemo(() => groupsData?.groups || [], [groupsData]);
  const lessons = useMemo(() => lessonsData?.lessons || [], [lessonsData]);

  const studentGroups = useMemo(() => {
    if (!student?.groupIds) return [];
    return groups.filter(g => student.groupIds.includes(g.id));
  }, [student, groups]);

  const studentLessons = useMemo(() => {
    if (!student) return [];
    return lessons
      .filter(l => l.studentId === student.id || (l.groupId && student.groupIds?.includes(l.groupId)))
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
      .slice(0, 10);
  }, [student, lessons]);

  const upcomingLessons = useMemo(() => {
    const now = new Date();
    return studentLessons
      .filter(l => new Date(l.startAt) > now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);
  }, [studentLessons]);

  const recentLessons = useMemo(() => {
    const now = new Date();
    return studentLessons
      .filter(l => new Date(l.startAt) <= now)
      .slice(0, 5);
  }, [studentLessons]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusVariant = (status: string) => {
    if (status === 'at_risk') return 'at-risk';
    return status as 'active' | 'inactive';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-6 w-48 bg-busala-hover-bg rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8"><SkeletonCard /></div>
          <div className="col-span-12 lg:col-span-4"><SkeletonCard /></div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-busala-text-primary">Student Not Found</h1>
        </div>
        <div className="busala-card p-8 text-center">
          <p className="text-busala-text-muted mb-4">This student could not be found or you don&apos;t have access.</p>
          <Button onClick={() => router.push('/students')} className="busala-gradient-gold text-[#0B0D10]">
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/students')}
            className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{student.fullName}</h1>
            <p className="text-sm text-busala-text-subtle">Student Profile</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/students')}
          className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Student
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Profile Card */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-[#F5A623]/20 text-[#F5A623] text-xl font-semibold">
                  {student.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-busala-text-primary">{student.fullName}</h2>
                  <StatusBadge status={getStatusVariant(student.status)} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-busala-text-muted">
                  {student.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-busala-text-subtle" />
                      {student.email}
                    </span>
                  )}
                  {student.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-busala-text-subtle" />
                      {student.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className={`text-2xl font-semibold ${
                  (student.attendancePercent || 0) >= 80 ? 'text-emerald-400' :
                  (student.attendancePercent || 0) >= 70 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {student.attendancePercent || 0}%
                </p>
                <p className="text-xs text-busala-text-subtle">Attendance</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className={`text-2xl font-semibold ${
                  (student.balance || 0) < 0 ? 'text-red-400' :
                  (student.balance || 0) === 0 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {formatCurrency(student.balance || 0)}
                </p>
                <p className="text-xs text-busala-text-subtle">Balance</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-blue-400">{studentGroups.length}</p>
                <p className="text-xs text-busala-text-subtle">Groups</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-[#F5A623]">{studentLessons.length}</p>
                <p className="text-xs text-busala-text-subtle">Total Lessons</p>
              </div>
            </div>
          </div>

          {/* Groups */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#F5A623]" />
              <h3 className="text-base font-semibold text-busala-text-primary">Groups</h3>
            </div>
            {studentGroups.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-4">Not assigned to any groups</p>
            ) : (
              <div className="space-y-3">
                {studentGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors cursor-pointer"
                    onClick={() => router.push('/groups')}
                  >
                    <div>
                      <p className="text-sm font-medium text-busala-text-primary">{group.name}</p>
                      <p className="text-xs text-busala-text-muted">{group.teacherName || 'No teacher assigned'}</p>
                    </div>
                    <Badge className="bg-busala-active-bg text-busala-text-muted text-xs">
                      {group.studentCount || 0} students
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Lessons */}
          <div className="busala-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#F5A623]" />
                <h3 className="text-base font-semibold text-busala-text-primary">Upcoming Lessons</h3>
              </div>
            </div>
            {upcomingLessons.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-6">No upcoming lessons</p>
            ) : (
              <div className="space-y-3">
                {upcomingLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors"
                  >
                    <div className="w-14 h-14 rounded-lg bg-busala-active-bg flex flex-col items-center justify-center">
                      <span className="text-[10px] text-busala-text-subtle uppercase">
                        {new Date(lesson.startAt).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-sm font-semibold text-busala-text-primary">
                        {new Date(lesson.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-busala-text-primary truncate">{lesson.title}</p>
                      <p className="text-xs text-busala-text-muted">{lesson.teacherName || 'Unknown teacher'}</p>
                    </div>
                    <StatusBadge status={lesson.status === 'in_progress' ? 'in-progress' : lesson.status as 'upcoming' | 'completed' | 'cancelled'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Plan & Billing */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Plan & Billing</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Plan</span>
                <span className="text-sm font-medium text-busala-text-primary">{student.plan || 'Monthly Basic'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Balance</span>
                <span className={`text-sm font-medium ${
                  (student.balance || 0) < 0 ? 'text-red-400' :
                  (student.balance || 0) === 0 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {formatCurrency(student.balance || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Enrolled</span>
                <span className="text-sm text-busala-text-primary">
                  {student.enrolledDate
                    ? new Date(student.enrolledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Trend */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Attendance</h3>
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--busala-hover-bg)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={
                      (student.attendancePercent || 0) >= 80 ? '#10b981' :
                      (student.attendancePercent || 0) >= 70 ? '#f59e0b' :
                      '#ef4444'
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${((student.attendancePercent || 0) / 100) * 264} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-semibold text-busala-text-primary">
                    {student.attendancePercent || 0}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-busala-text-muted text-center">
              {(student.attendancePercent || 0) >= 80
                ? 'Great attendance record'
                : (student.attendancePercent || 0) >= 70
                ? 'Attendance needs improvement'
                : 'Critical - attendance too low'}
            </p>
          </div>

          {/* Recent Activity */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Recent Lessons</h3>
            </div>
            {recentLessons.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-4">No recent lessons</p>
            ) : (
              <div className="space-y-2">
                {recentLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between py-1.5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-busala-text-primary truncate">{lesson.title}</p>
                      <p className="text-[10px] text-busala-text-subtle">
                        {new Date(lesson.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <StatusBadge status={lesson.status === 'in_progress' ? 'in-progress' : lesson.status as 'upcoming' | 'completed' | 'cancelled'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="busala-card p-4">
            <h3 className="text-sm font-medium text-busala-text-muted mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/groups')}
              >
                <Users className="h-4 w-4 mr-2 text-[#F5A623]" />
                Manage Groups
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/lessons')}
              >
                <BookOpen className="h-4 w-4 mr-2 text-blue-400" />
                View All Lessons
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
