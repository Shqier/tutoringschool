'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Users,
  MapPin,
  Clock,
  Calendar,
  Edit,
  XCircle,
  CheckCircle,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  StatusBadge,
  SkeletonCard,
} from '@/components/app';
import { useLesson } from '@/lib/api/hooks';

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const { data: lesson, isLoading, error } = useLesson(lessonId);

  const duration = useMemo(() => {
    if (!lesson) return '';
    const start = new Date(lesson.startAt);
    const end = new Date(lesson.endAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, [lesson]);

  const formattedDate = useMemo(() => {
    if (!lesson) return '';
    return new Date(lesson.startAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [lesson]);

  const formattedStartTime = useMemo(() => {
    if (!lesson) return '';
    return new Date(lesson.startAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [lesson]);

  const formattedEndTime = useMemo(() => {
    if (!lesson) return '';
    return new Date(lesson.endAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [lesson]);

  const lessonTypeLabel = useMemo(() => {
    if (!lesson) return '';
    return lesson.type === 'group' ? 'Group Lesson' : 'One-on-One';
  }, [lesson]);

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

  if (error || !lesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-busala-text-primary">Lesson Not Found</h1>
        </div>
        <div className="busala-card p-8 text-center">
          <p className="text-busala-text-muted mb-4">This lesson could not be found or you don&apos;t have access.</p>
          <Button onClick={() => router.push('/lessons')} className="busala-gradient-gold text-[#0B0D10]">
            Back to Lessons
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
            onClick={() => router.push('/lessons')}
            className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{lesson.title}</h1>
            <p className="text-sm text-busala-text-subtle">Lesson Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg"
            onClick={() => router.push('/lessons')}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Lesson Info Card */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-[#F5A623]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-busala-text-primary">{lesson.title}</h2>
                  <StatusBadge status={lesson.status === 'in_progress' ? 'in-progress' : lesson.status as 'upcoming' | 'completed' | 'cancelled'} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-busala-text-muted">
                  <Badge className="bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 text-xs">
                    {lessonTypeLabel}
                  </Badge>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-busala-text-subtle" />
                    {duration}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Time Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-sm font-semibold text-[#F5A623]">{formattedStartTime}</p>
                <p className="text-xs text-busala-text-subtle">Start Time</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-sm font-semibold text-blue-400">{formattedEndTime}</p>
                <p className="text-xs text-busala-text-subtle">End Time</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-sm font-semibold text-emerald-400">{duration}</p>
                <p className="text-xs text-busala-text-subtle">Duration</p>
              </div>
              <div className="p-3 rounded-lg bg-busala-hover-bg text-center">
                <p className="text-sm font-semibold text-busala-text-primary">{formattedDate.split(',')[0]}</p>
                <p className="text-xs text-busala-text-subtle">Day</p>
              </div>
            </div>
          </div>

          {/* Teacher Info */}
          <div className="busala-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-[#F5A623]" />
              <h3 className="text-base font-semibold text-busala-text-primary">Teacher</h3>
            </div>
            <div
              className="flex items-center justify-between p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors cursor-pointer"
              onClick={() => router.push(`/teachers/${lesson.teacherId}`)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#F5A623]/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-busala-text-primary">{lesson.teacherName || 'Unknown Teacher'}</p>
                  <p className="text-xs text-busala-text-muted">Click to view profile</p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 text-busala-text-subtle rotate-180" />
            </div>
          </div>

          {/* Room Info */}
          {lesson.roomId && (
            <div className="busala-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-[#F5A623]" />
                <h3 className="text-base font-semibold text-busala-text-primary">Room</h3>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors cursor-pointer"
                onClick={() => router.push(`/rooms/${lesson.roomId}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-busala-text-primary">{lesson.roomName || 'Unknown Room'}</p>
                    <p className="text-xs text-busala-text-muted">Click to view room</p>
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 text-busala-text-subtle rotate-180" />
              </div>
            </div>
          )}

          {/* Group / Student Info */}
          {lesson.type === 'group' && lesson.groupId && (
            <div className="busala-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[#F5A623]" />
                <h3 className="text-base font-semibold text-busala-text-primary">Group</h3>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors cursor-pointer"
                onClick={() => router.push(`/groups/${lesson.groupId}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-busala-text-primary">{lesson.groupName || 'Unknown Group'}</p>
                    <p className="text-xs text-busala-text-muted">Click to view group</p>
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 text-busala-text-subtle rotate-180" />
              </div>
            </div>
          )}

          {lesson.type === 'one_on_one' && lesson.studentId && (
            <div className="busala-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-[#F5A623]" />
                <h3 className="text-base font-semibold text-busala-text-primary">Student</h3>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors cursor-pointer"
                onClick={() => router.push(`/students/${lesson.studentId}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-busala-text-primary">{lesson.studentName || 'Unknown Student'}</p>
                    <p className="text-xs text-busala-text-muted">Click to view student</p>
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 text-busala-text-subtle rotate-180" />
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Lesson Details */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Lesson Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Date</span>
                <span className="text-sm font-medium text-busala-text-primary">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Time</span>
                <span className="text-sm font-medium text-busala-text-primary">
                  {formattedStartTime} - {formattedEndTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Duration</span>
                <span className="text-sm font-medium text-busala-text-primary">{duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Type</span>
                <Badge className="bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 text-xs">
                  {lessonTypeLabel}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Status</span>
                <StatusBadge status={lesson.status === 'in_progress' ? 'in-progress' : lesson.status as 'upcoming' | 'completed' | 'cancelled'} />
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="busala-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-[#F5A623]" />
              <h3 className="text-sm font-medium text-busala-text-muted">Participants</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-busala-text-muted">Teacher</span>
                <span className="text-sm font-medium text-busala-text-primary">{lesson.teacherName || 'Unknown'}</span>
              </div>
              {lesson.roomName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-busala-text-muted">Room</span>
                  <span className="text-sm font-medium text-busala-text-primary">{lesson.roomName}</span>
                </div>
              )}
              {lesson.groupName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-busala-text-muted">Group</span>
                  <span className="text-sm font-medium text-busala-text-primary">{lesson.groupName}</span>
                </div>
              )}
              {lesson.studentName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-busala-text-muted">Student</span>
                  <span className="text-sm font-medium text-busala-text-primary">{lesson.studentName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="busala-card p-4">
            <h3 className="text-sm font-medium text-busala-text-muted mb-3">Actions</h3>
            <div className="space-y-2">
              {lesson.status === 'upcoming' && (
                <Button
                  variant="outline"
                  className="w-full justify-start bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              {(lesson.status === 'upcoming' || lesson.status === 'in_progress') && (
                <Button
                  variant="outline"
                  className="w-full justify-start bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-400"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Lesson
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                onClick={() => router.push('/scheduling')}
              >
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                View Schedule
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
