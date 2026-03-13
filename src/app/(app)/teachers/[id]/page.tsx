'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, ConfirmDialog, StatusBadge } from '@/components/app';
import { TeacherDialog } from '@/components/teachers/TeacherDialog';
import { AvailabilityManager } from '@/components/teachers/AvailabilityManager';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import {
  useTeacherProfile,
  useTeacherSchedule,
  useGroups,
  useUpdateTeacher,
  useDeleteTeacher,
} from '@/lib/api/hooks';
import type { TeacherProfile as TeacherProfileType } from '@/lib/api/types';

export default function TeacherProfilePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useTeacherProfile(id);
  const now = useMemo(() => new Date(), []);
  const next30 = useMemo(() => {
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    return { startDate: now.toISOString(), endDate: end.toISOString() };
  }, [now]);
  const last30 = useMemo(() => {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }, [now]);
  const { data: scheduleUpcoming } = useTeacherSchedule(id, next30);
  const { data: schedulePast } = useTeacherSchedule(id, last30);
  const { data: groupsData } = useGroups(id ? { teacherId: id } : undefined);
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const teacher = profile as TeacherProfileType | undefined;
  const groups = groupsData?.groups ?? [];
  const upcomingLessons = scheduleUpcoming?.data ?? [];
  const pastLessons = (schedulePast?.data ?? []).slice(0, 10);

  if (profileLoading && !profile) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-busala-hover-bg rounded animate-pulse" />
        <div className="h-24 w-full bg-busala-hover-bg rounded-xl animate-pulse" />
      </div>
    );
  }

  if (profileError || !id) {
    return (
      <div className="busala-card p-8 text-center">
        <p className="text-red-400">{profileError ? 'Failed to load teacher' : 'Invalid teacher ID'}</p>
        <Link href="/teachers" className="text-busala-gold hover:underline mt-2 inline-block">
          Back to Teachers
        </Link>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="busala-card p-8 text-center">
        <p className="text-busala-text-muted">Teacher not found</p>
        <Link href="/teachers" className="text-busala-gold hover:underline mt-2 inline-block">
          Back to Teachers
        </Link>
      </div>
    );
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteTeacher.mutate(id);
      setDeleteOpen(false);
      window.location.href = '/teachers';
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-busala-text-muted">
        <Link href="/teachers" className="hover:text-busala-gold transition-colors">
          Teachers
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-busala-text-primary truncate">{teacher.fullName}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarFallback className="rounded-xl bg-busala-gold/20 text-busala-gold text-xl">
              {teacher.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{teacher.fullName}</h1>
            <p className="text-sm text-busala-text-muted">{teacher.email}</p>
            <div className="mt-1">
              <StatusBadge status={teacher.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="border-border text-busala-text-primary"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-busala-hover-bg border border-busala-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-busala-text-muted">Email:</span> {teacher.email}</p>
                {teacher.phone && <p><span className="text-busala-text-muted">Phone:</span> {teacher.phone}</p>}
                <p><span className="text-busala-text-muted">Subjects:</span> {(teacher.subjects || []).join(', ') || '—'}</p>
              </CardContent>
            </Card>
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Quick stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Hours this week: <span className="font-medium text-busala-text-primary">{teacher.hoursThisWeek ?? 0}h</span></p>
                <p>Total lessons taught: <span className="font-medium text-busala-text-primary">{teacher.totalLessonsTaught ?? 0}</span></p>
                <p>Students taught: <span className="font-medium text-busala-text-primary">{teacher.totalStudentsTaught ?? 0}</span></p>
              </CardContent>
            </Card>
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Current groups</CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <p className="text-sm text-busala-text-muted">No groups</p>
                ) : (
                  <ul className="space-y-1">
                    {groups.map((g) => (
                      <li key={g.id}>
                        <Link href={`/groups/${g.id}`} className="text-sm text-busala-gold hover:underline">
                          {g.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="busala-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-busala-text-muted">Recent activity (last 5 lessons)</CardTitle>
            </CardHeader>
            <CardContent>
              {!teacher.recentLessons?.length ? (
                <p className="text-sm text-busala-text-muted">No recent lessons</p>
              ) : (
                <ul className="space-y-2">
                  {teacher.recentLessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between text-sm">
                      <Link href={`/lessons/${l.id}`} className="text-busala-gold hover:underline">
                        {l.title}
                      </Link>
                      <span className="text-busala-text-muted">
                        {new Date(l.startAt).toLocaleDateString()} {l.groupName ?? ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityManager teacherId={id} />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-busala-text-muted mb-2">Upcoming (next 30 days)</h3>
            {upcomingLessons.length === 0 ? (
              <p className="text-sm text-busala-text-muted">No upcoming lessons</p>
            ) : (
              <ul className="space-y-2">
                {upcomingLessons.slice(0, 15).map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2 border-b border-busala-border last:border-0">
                    <Link href={`/lessons/${l.id}`} className="text-busala-gold hover:underline">
                      {l.title}
                    </Link>
                    <span className="text-sm text-busala-text-muted">
                      {new Date(l.startAt).toLocaleString()} · {l.groupName ?? l.roomName ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-busala-text-muted mb-2">Past (last 30 days)</h3>
            {pastLessons.length === 0 ? (
              <p className="text-sm text-busala-text-muted">No past lessons</p>
            ) : (
              <ul className="space-y-2">
                {pastLessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2 border-b border-busala-border last:border-0">
                    <Link href={`/lessons/${l.id}`} className="text-busala-gold hover:underline">
                      {l.title}
                    </Link>
                    <span className="text-sm text-busala-text-muted">
                      {new Date(l.startAt).toLocaleString()} · {l.groupName ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {teacher.monthlyHours && teacher.monthlyHours.length > 0 ? (
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Monthly hours (last 12 months)</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={teacher.monthlyHours}
                  xKey="month"
                  yKey="hours"
                  color="var(--busala-gold)"
                  height={220}
                />
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-busala-text-muted">No monthly hours data yet.</p>
          )}
        </TabsContent>
      </Tabs>

      <TeacherDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { refetchProfile(); setEditOpen(false); }}
        teacher={teacher}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Deactivate Teacher"
        description={`Are you sure you want to deactivate ${teacher.fullName}?`}
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deleteTeacher.isLoading}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
