'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  MapPin,
  BookOpen,
  Edit,
  Calendar,
  Clock,
  UserPlus,
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
import { useGroup, useLessons } from '@/lib/api/hooks';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { data: group, isLoading, error } = useGroup(groupId);

  const weekRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, []);

  const { data: lessonsData } = useLessons({
    groupId,
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  });

  const lessons = useMemo(() => lessonsData?.lessons || [], [lessonsData]);

  const upcomingLessons = useMemo(() => {
    const now = new Date();
    return lessons
      .filter(l => new Date(l.startAt) > now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);
  }, [lessons]);

  const scheduleDescription = useMemo(() => {
    if (!group?.scheduleRule) return null;
    const rule = group.scheduleRule;
    const days = rule.daysOfWeek?.map((d: number) => DAY_NAMES[d]).join(', ') || 'No days set';
    return `${days} ${rule.startTime || ''} - ${rule.endTime || ''}`;
  }, [group]);

  const studentCount = useMemo(() => {
    if (group?.students) return group.students.length;
    return group?.studentCount || 0;
  }, [group]);

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

  if (error || !group) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-busala-text-primary">Group Not Found</h1>
        </div>
        <div className="busala-card p-8 text-center">
          <p className="text-busala-text-muted mb-4">This group could not be found or you don&apos;t have access.</p>
          <Button onClick={() => router.push('/groups')} className="busala-gradient-gold text-[#0B0D10]">
            Back to Groups
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
            onClick={() => router.push('/groups')}
            className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{group.name}</h1>
            <p className="text-sm text-busala-text-subtle">Group Details</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/groups')}
          className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Group
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Group Info Card */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="h-16 w-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${group.color || '#F5A623'}20` }}
              >
                <Users className="h-8 w-8" style={{ color: group.color || '#F5A623' }} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-busala-text-primary">{group.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-busala-text-muted">
                  {(group.teacherName || group.teacher?.fullName) && (
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-busala-text-subtle" />
                      {group.teacherName || group.teacher?.fullName}
                    </span>
                  )}
                  {(group.roomName || group.room?.name) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-busala-text-subtle" />
                      {group.roomName || group.room?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-[#F5A623]">{studentCount}</p>
                <p className="text-xs text-busala-text-subtle">Students</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-blue-400">{lessons.length}</p>
                <p className="text-xs text-busala-text-subtle">Lessons This Week</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-emerald-400">{upcomingLessons.length}</p>
                <p className="text-xs text-busala-text-subtle">Upcoming</p>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="busala-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#F5A623]" />
                <h3 className="text-base font-semibold text-busala-text-primary">Students</h3>
              </div>
              <Badge className="bg-busala-active-bg text-busala-text-muted text-xs">
                {studentCount} total
              </Badge>
            </div>
            {!group.students || group.students.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-4">No students assigned to this group</p>
            ) : (
              <div className="space-y-3">
                {group.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors cursor-pointer"
                    onClick={() => router.push(`/students/${student.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#F5A623]/20 text-[#F5A623] text-xs font-semibold">
                          {student.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-busala-text-primary">{student.fullName}</p>
                        {student.email && (
                          <p className="text-xs text-busala-text-muted">{student.email}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={student.status === 'at_risk' ? 'at-risk' : student.status as 'active' | 'inactive'} />
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
              <button
                className="text-xs text-[#F5A623] hover:underline"
                onClick={() => router.push(`/lessons?groupId=${groupId}`)}
              >
                View all
              </button>
            </div>

            {upcomingLessons.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-6">No upcoming lessons this week</p>
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
                      <div className="flex items-center gap-3 mt-1 text-xs text-busala-text-muted">
                        {lesson.teacherName && (
                          <span>{lesson.teacherName}</span>
                        )}
                        {lesson.roomName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lesson.roomName}
                          </span>
                        )}
                      </div>
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
          {/* Group Details */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Group Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Teacher</span>
                <span className="text-sm font-medium text-busala-text-primary">
                  {group.teacherName || group.teacher?.fullName || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Room</span>
                <span className="text-sm font-medium text-busala-text-primary">
                  {group.roomName || group.room?.name || 'No room'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Students</span>
                <span className="text-sm font-medium text-busala-text-primary">{studentCount}</span>
              </div>
              {group.color && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-busala-text-muted">Color</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-sm text-busala-text-primary">{group.color}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Schedule</h3>
            </div>
            {scheduleDescription ? (
              <p className="text-sm text-busala-text-primary">{scheduleDescription}</p>
            ) : (
              <p className="text-sm text-busala-text-muted text-center py-4">No recurring schedule set</p>
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
                <Edit className="h-4 w-4 mr-2 text-[#F5A623]" />
                Edit Group
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/groups')}
              >
                <UserPlus className="h-4 w-4 mr-2 text-emerald-400" />
                Manage Students
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/lessons')}
              >
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                Schedule Lesson
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
