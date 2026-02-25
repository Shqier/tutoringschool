'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Calendar,
  BookOpen,
  Edit,
  Users,
  MapPin,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  StatusBadge,
  SkeletonCard,
} from '@/components/app';
import { useTeacher, useLessons } from '@/lib/api/hooks';
import type { AvailabilitySlot } from '@/lib/api/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const { data: teacher, isLoading, error } = useTeacher(teacherId);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const weekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, []);

  const { data: lessonsData } = useLessons({
    teacherId,
    startDate: todayStart,
    endDate: weekEnd,
  });

  const lessons = useMemo(() => lessonsData?.lessons || [], [lessonsData]);

  const todayLessons = useMemo(() => {
    const today = new Date().toDateString();
    return lessons.filter(l => new Date(l.startAt).toDateString() === today);
  }, [lessons]);

  const upcomingLessons = useMemo(() => {
    const now = new Date();
    return lessons
      .filter(l => new Date(l.startAt) > now)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .slice(0, 5);
  }, [lessons]);

  const availability = useMemo(() => {
    if (!teacher?.weeklyAvailability) return [];
    return (teacher.weeklyAvailability as unknown as AvailabilitySlot[])
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }, [teacher]);

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

  if (error || !teacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-busala-text-primary">Teacher Not Found</h1>
        </div>
        <div className="busala-card p-8 text-center">
          <p className="text-busala-text-muted mb-4">This teacher could not be found or you don&apos;t have access.</p>
          <Button onClick={() => router.push('/teachers')} className="busala-gradient-gold text-[#0B0D10]">
            Back to Teachers
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
            onClick={() => router.push('/teachers')}
            className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{teacher.fullName}</h1>
            <p className="text-sm text-busala-text-subtle">Teacher Profile</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/teachers`)}
          className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Teacher
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
                  {teacher.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-busala-text-primary">{teacher.fullName}</h2>
                  <StatusBadge status={teacher.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-busala-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-busala-text-subtle" />
                    {teacher.email}
                  </span>
                  {teacher.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-busala-text-subtle" />
                      {teacher.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-[#F5A623]">{teacher.hoursThisWeek || 0}</p>
                <p className="text-xs text-busala-text-subtle">Hours This Week</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-busala-text-primary">{teacher.maxHours || 25}</p>
                <p className="text-xs text-busala-text-subtle">Max Hours</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-emerald-400">{todayLessons.length}</p>
                <p className="text-xs text-busala-text-subtle">Lessons Today</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-2xl font-semibold text-blue-400">{lessons.length}</p>
                <p className="text-xs text-busala-text-subtle">This Week</p>
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-[#F5A623]" />
              <h3 className="text-base font-semibold text-busala-text-primary">Subjects</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((subject, idx) => (
                <Badge
                  key={idx}
                  className="bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 text-sm px-3 py-1"
                >
                  {subject}
                </Badge>
              ))}
            </div>
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
                onClick={() => router.push(`/lessons?teacherId=${teacherId}`)}
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
                        {lesson.groupName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {lesson.groupName}
                          </span>
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
          {/* Weekly Availability */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Weekly Availability</h3>
            </div>
            {availability.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-4">No availability set</p>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const slots = availability.filter(s => s.dayOfWeek === day);
                  return (
                    <div key={day} className="flex items-center gap-3 py-1.5">
                      <span className="text-xs text-busala-text-subtle w-8 font-medium">
                        {SHORT_DAYS[day]}
                      </span>
                      {slots.length > 0 ? (
                        <div className="flex-1 flex flex-wrap gap-1">
                          {slots.map((slot, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            >
                              {slot.startTime} - {slot.endTime}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-busala-text-subtle italic">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workload Chart */}
          <div className="busala-card p-4">
            <h3 className="text-sm font-medium text-busala-text-muted mb-4">Weekly Workload</h3>
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => {
                const weeklyHours = teacher.hoursThisWeek || 0;
                const dayWeights = [0.25, 0.2, 0.2, 0.2, 0.15];
                const hours = Math.round(weeklyHours * dayWeights[index]);
                const maxHours = 8;
                const percent = Math.min((hours / maxHours) * 100, 100);
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-busala-text-subtle w-8">{day}</span>
                    <div className="flex-1 h-2 bg-busala-hover-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F5A623] rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-busala-text-subtle w-8">{hours}h</span>
                  </div>
                );
              })}
            </div>
            <div
              className="mt-4 pt-4 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--busala-border-divider)' }}
            >
              <span className="text-xs text-busala-text-subtle">Total This Week</span>
              <span className="text-sm font-medium text-busala-text-primary">
                {teacher.hoursThisWeek || 0} / {teacher.maxHours || 25} hours
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="busala-card p-4">
            <h3 className="text-sm font-medium text-busala-text-muted mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/lessons')}
              >
                <Calendar className="h-4 w-4 mr-2 text-[#F5A623]" />
                Schedule Lesson
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/scheduling')}
              >
                <Clock className="h-4 w-4 mr-2 text-blue-400" />
                View Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
