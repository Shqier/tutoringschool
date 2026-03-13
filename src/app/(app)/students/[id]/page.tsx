'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/app';
import { StudentAttendanceHistory } from '@/components/attendance/StudentAttendanceHistory';
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import {
  useStudent,
  useStudentAttendance,
  useUpdateStudentNotes,
  useGroups,
} from '@/lib/api/hooks';
import { StudentPaymentsTab } from '@/components/students/StudentPaymentsTab';

export default function StudentDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const { data: student, isLoading: studentLoading, error: studentError, refetch: refetchStudent } = useStudent(id);

  const sixMonthsAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  }, []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const { data: attendanceData } = useStudentAttendance(id, { from: sixMonthsAgo, to: today });

  const updateNotes = useUpdateStudentNotes();
  const [notesValue, setNotesValue] = useState(student?.notes ?? '');
  const [notesSaving, setNotesSaving] = useState(false);

  const { data: groupsData } = useGroups();
  const groupsMap = useMemo(() => {
    const map: Record<string, { name: string; id: string }> = {};
    (groupsData?.groups ?? []).forEach((g) => { map[g.id] = { name: g.name, id: g.id }; });
    return map;
  }, [groupsData]);

  React.useEffect(() => {
    setNotesValue(student?.notes ?? '');
  }, [student?.notes]);

  const handleSaveNotes = async () => {
    if (!id) return;
    setNotesSaving(true);
    try {
      await updateNotes.mutate({ id, notes: notesValue || null });
      refetchStudent();
    } finally {
      setNotesSaving(false);
    }
  };

  const attendanceRecords = attendanceData?.records ?? [];
  const attendanceByDate = useMemo(() => {
    const map: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
    attendanceRecords.forEach((r) => {
      const date = r.lessonDate.slice(0, 10);
      map[date] = r.status;
    });
    return map;
  }, [attendanceRecords]);

  const now = new Date();
  const trendData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      byMonth[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
    }
    attendanceRecords.forEach((r) => {
      const month = r.lessonDate.slice(0, 7);
      if (byMonth[month] !== undefined) {
        if (r.status === 'present') byMonth[month]++;
      }
    });
    return Object.entries(byMonth).map(([month, count]) => ({ month, count }));
  }, [attendanceRecords, now]);

  if (studentLoading && !student) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-busala-hover-bg rounded animate-pulse" />
        <div className="h-24 w-full bg-busala-hover-bg rounded-xl animate-pulse" />
      </div>
    );
  }

  if (studentError || !id) {
    return (
      <div className="busala-card p-8 text-center">
        <p className="text-red-400">{studentError ? 'Failed to load student' : 'Invalid student ID'}</p>
        <Link href="/students" className="text-busala-gold hover:underline mt-2 inline-block">
          Back to Students
        </Link>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="busala-card p-8 text-center">
        <p className="text-busala-text-muted">Student not found</p>
        <Link href="/students" className="text-busala-gold hover:underline mt-2 inline-block">
          Back to Students
        </Link>
      </div>
    );
  }

  const currentGroups = (student.groupIds ?? []).map((gid) => groupsMap[gid]).filter(Boolean);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-busala-text-muted">
        <Link href="/students" className="hover:text-busala-gold transition-colors">
          Students
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-busala-text-primary truncate">{student.fullName}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarFallback className="rounded-xl bg-busala-gold/20 text-busala-gold text-xl">
              {student.fullName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{student.fullName}</h1>
            <p className="text-sm text-busala-text-muted">{student.email ?? '—'}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={student.status === 'at_risk' ? 'at-risk' : student.status} />
              <span className="text-sm text-busala-text-muted">
                {student.grade != null ? `Grade ${student.grade}` : ''} • {student.plan?.name ?? 'No plan'}
              </span>
              <span className={`text-sm capitalize ${
                student.paymentStatus === 'overdue' ? 'text-red-400' :
                student.paymentStatus === 'active' ? 'text-emerald-400' :
                'text-busala-text-muted'
              }`}>
                {student.paymentStatus ?? ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-busala-hover-bg border border-busala-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-busala-text-muted">Email:</span> {student.email ?? '—'}</p>
                <p><span className="text-busala-text-muted">Phone:</span> {student.phone ?? '—'}</p>
                <p><span className="text-busala-text-muted">Enrolled:</span> {student.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString() : '—'}</p>
              </CardContent>
            </Card>
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Quick stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Attendance: <span className="font-medium text-busala-text-primary">{student.attendancePercent ?? 0}%</span></p>
                <p>Grade: <span className="font-medium text-busala-text-primary">{student.grade ?? '—'}</span></p>
                <p>Plan: <span className="font-medium text-busala-text-primary">{student.plan?.name ?? '—'}</span></p>
                <p>Payment: <span className={`font-medium capitalize ${student.paymentStatus === 'overdue' ? 'text-red-400' : ''}`}>{student.paymentStatus ?? '—'}</span></p>
              </CardContent>
            </Card>
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Current groups</CardTitle>
              </CardHeader>
              <CardContent>
                {currentGroups.length === 0 ? (
                  <p className="text-sm text-busala-text-muted">No groups</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentGroups.map((g) => (
                      <Link key={g.id} href={`/groups/${g.id}`}>
                        <Badge variant="secondary" className="bg-busala-hover-bg text-busala-gold hover:underline">
                          {g.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="busala-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-busala-text-muted">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add notes about this student..."
                className="min-h-[100px] bg-busala-hover-bg border-border text-busala-text-primary"
              />
              <Button size="sm" onClick={handleSaveNotes} disabled={notesSaving} className="busala-gradient-gold text-[#0B0D10]">
                {notesSaving ? 'Saving…' : 'Save notes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <StudentAttendanceHistory studentId={id} />
          {trendData.length > 0 && (
            <Card className="busala-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-busala-text-muted">Attendance trend (last 6 months)</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={trendData} xKey="month" yKey="count" color="var(--busala-gold)" height={200} />
              </CardContent>
            </Card>
          )}
          <Card className="busala-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-busala-text-muted">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceCalendar
                attendanceRecords={attendanceByDate}
                month={now.getMonth()}
                year={now.getFullYear()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <StudentPaymentsTab studentId={id} student={student} onRefetch={refetchStudent} />
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          {currentGroups.length === 0 ? (
            <p className="text-sm text-busala-text-muted">Not enrolled in any groups.</p>
          ) : (
            <ul className="space-y-4">
              {currentGroups.map((g) => (
                <Card key={g.id} className="busala-card">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/groups/${g.id}`} className="text-busala-gold hover:underline font-medium">
                        {g.name}
                      </Link>
                      <Link href={`/groups/${g.id}`}>
                        <Button variant="outline" size="sm">View group</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
