'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Edit, Trash2, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog, StatusBadge } from '@/components/app';
import { GroupDialog } from '@/components/groups/GroupDialog';
import { AssignStudentsDialog } from '@/components/groups/AssignStudentsDialog';
import {
  useGroup,
  useGroupStats,
  useLessons,
  useDeleteGroup,
  useRemoveGroupStudent,
  useTeachers,
  useRooms,
} from '@/lib/api/hooks';
import type { Group, Student } from '@/lib/api/types';

export default function GroupDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const { data: group, isLoading: groupLoading, error: groupError, refetch: refetchGroup } = useGroup(id);
  const { data: stats } = useGroupStats(id);

  const now = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), [now]);
  const monthEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(), [now]);
  const { data: lessonsData } = useLessons(id ? { groupId: id, startDate: monthStart, endDate: monthEnd } : undefined);

  const removeStudent = useRemoveGroupStudent();
  const deleteGroup = useDeleteGroup();
  const { data: teachersData } = useTeachers();
  const { data: roomsData } = useRooms();
  const teachers = teachersData?.teachers ?? [];
  const rooms = roomsData?.rooms ?? [];
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [unenrollStudent, setUnenrollStudent] = useState<Student | null>(null);

  const lessons = lessonsData?.lessons ?? [];
  const students = group?.students ?? [];
  const atRiskStudents = students.filter((s) => (s.attendancePercent ?? 0) < 70);

  const handleUnenrollConfirm = async () => {
    if (!id || !unenrollStudent) return;
    try {
      await removeStudent.mutate({ groupId: id, studentId: unenrollStudent.id });
      setUnenrollStudent(null);
      refetchGroup();
    } catch {
      // error handled by mutation
    }
  };

  if (groupLoading && !group) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-busala-hover-bg rounded animate-pulse" />
        <div className="h-24 w-full bg-busala-hover-bg rounded-xl animate-pulse" />
      </div>
    );
  }

  if (groupError || !id) {
    return (
      <div className="busala-card p-8 text-center">
        <p className="text-red-400">{groupError ? 'Failed to load group' : 'Invalid group ID'}</p>
        <Link href="/groups" className="text-busala-gold hover:underline mt-2 inline-block">
          Back to Groups
        </Link>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="busala-card p-8 text-center">
        <p className="text-busala-text-muted">Group not found</p>
        <Link href="/groups" className="text-busala-gold hover:underline mt-2 inline-block">
          Back to Groups
        </Link>
      </div>
    );
  }

  const scheduleRule = group.scheduleRule as { daysOfWeek?: number[]; startTime?: string; endTime?: string } | undefined;
  const scheduleStr = scheduleRule
    ? `${scheduleRule.daysOfWeek?.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') ?? '—'} ${scheduleRule.startTime ?? ''}-${scheduleRule.endTime ?? ''}`
    : 'Not set';

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-busala-text-muted">
        <Link href="/groups" className="hover:text-busala-gold transition-colors">
          Groups
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-busala-text-primary truncate">{group.name}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-busala-text-primary">{group.name}</h1>
          <p className="text-sm text-busala-text-muted">
            Teacher: <Link href={`/teachers/${group.teacherId}`} className="text-busala-gold hover:underline">{group.teacher?.fullName ?? group.teacherId}</Link>
            {group.roomId && (
              <> · Room: <Link href={`/rooms/${group.roomId}`} className="text-busala-gold hover:underline">{group.room?.name ?? group.roomId}</Link></>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="border-border text-busala-text-primary">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-busala-hover-bg border border-busala-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Total students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-busala-text-primary">{stats?.totalStudents ?? group.students?.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Average attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-busala-text-primary">{stats?.averageAttendance ?? 0}%</p>
              </CardContent>
            </Card>
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Lessons this month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-busala-text-primary">{stats?.lessonsThisMonth ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Next lesson</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.nextLesson ? (
                  <Link href={`/lessons/${stats.nextLesson.id}`} className="text-busala-gold hover:underline">
                    {stats.nextLesson.title}
                  </Link>
                ) : (
                  <p className="text-busala-text-muted">None</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="busala-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-busala-text-muted">Group info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-busala-text-muted">Teacher:</span> <Link href={`/teachers/${group.teacherId}`} className="text-busala-gold hover:underline">{group.teacher?.fullName ?? group.teacherId}</Link></p>
              {group.room && <p><span className="text-busala-text-muted">Room:</span> <Link href={`/rooms/${group.roomId}`} className="text-busala-gold hover:underline">{group.room.name}</Link></p>}
              <p><span className="text-busala-text-muted">Schedule:</span> {scheduleStr}</p>
              <p><span className="text-busala-text-muted">Created:</span> {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : '—'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-busala-text-muted">Student roster</h3>
            <Button size="sm" onClick={() => setAssignOpen(true)} className="busala-gradient-gold text-[#0B0D10]">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-busala-text-muted">No students. Add students to this group.</p>
          ) : (
            <div className="busala-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-busala-border text-busala-text-muted">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Attendance %</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-busala-border/60 hover:bg-busala-hover-bg/50">
                      <td className="py-3 px-4">
                        <Link href={`/students/${s.id}`} className="flex items-center gap-2 text-busala-gold hover:underline">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{s.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {s.fullName}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{s.attendancePercent ?? 0}%</td>
                      <td className="py-3 px-4"><StatusBadge status={s.status === 'at_risk' ? 'at-risk' : s.status} /></td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500" onClick={() => setUnenrollStudent(s)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {atRiskStudents.length > 0 && (
            <Card className="busala-card border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-amber-400">At-risk students (&lt; 70% attendance)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {atRiskStudents.map((s) => (
                    <li key={s.id}>
                      <Link href={`/students/${s.id}`} className="text-busala-gold hover:underline">
                        {s.fullName}
                      </Link>
                      {' '}
                      <span className="text-busala-text-muted">({s.attendancePercent ?? 0}%)</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-busala-text-muted">Lessons this month</h3>
            <Link href={`/lessons/new?groupId=${id}`}>
              <Button size="sm" className="busala-gradient-gold text-[#0B0D10]">Create lesson</Button>
            </Link>
          </div>
          {lessons.length === 0 ? (
            <p className="text-sm text-busala-text-muted">No lessons this month.</p>
          ) : (
            <ul className="space-y-2">
              {lessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 border-b border-busala-border last:border-0">
                  <Link href={`/lessons/${l.id}`} className="text-busala-gold hover:underline">{l.title}</Link>
                  <span className="text-sm text-busala-text-muted">{new Date(l.startAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <p className="text-sm text-busala-text-muted">Progress over time and milestone tracker can be added here. Average attendance: {stats?.averageAttendance ?? 0}%</p>
        </TabsContent>
      </Tabs>

      <GroupDialog open={editOpen} onOpenChange={setEditOpen} onSuccess={() => { refetchGroup(); setEditOpen(false); }} group={group} teachers={teachers} rooms={rooms} />
      <AssignStudentsDialog open={assignOpen} onOpenChange={setAssignOpen} onSuccess={refetchGroup} group={group} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Group"
        description={`Are you sure you want to delete "${group.name}"? This will remove the group and unenroll all students.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteGroup.isLoading}
        onConfirm={async () => {
          try {
            await deleteGroup.mutate(id);
            setDeleteOpen(false);
            window.location.href = '/groups';
          } catch {}
        }}
      />
      <ConfirmDialog
        open={!!unenrollStudent}
        onOpenChange={(open) => !open && setUnenrollStudent(null)}
        title="Remove student"
        description={unenrollStudent ? `Remove ${unenrollStudent.fullName} from this group?` : ''}
        confirmLabel="Remove"
        variant="danger"
        isLoading={removeStudent.isLoading}
        onConfirm={handleUnenrollConfirm}
      />
    </div>
  );
}
