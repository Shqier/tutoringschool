'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  MapPin,
  User,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PageHeader,
  FiltersBar,
  DataTableShell,
  DataTableRow,
  StatusBadge,
  SkeletonTable,
  EmptyState,
  ConfirmDialog,
} from '@/components/app';
import { AddLessonDialog } from '@/components/lessons/AddLessonDialog';
import { useLessons, useTeachers, useGroups, useRooms, useDeleteLesson } from '@/lib/api/hooks';
import type { Lesson } from '@/lib/api/types';

// Helper to format time from ISO string
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Helper to format date for display
function _formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Helper to calculate duration
function calculateDuration(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${diffMins} min`;
}

// Helper to format date for input (YYYY-MM-DD)
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Map API status to StatusBadge status
function mapStatus(status: Lesson['status']): 'upcoming' | 'in-progress' | 'completed' | 'cancelled' {
  if (status === 'in_progress') return 'in-progress';
  return status as 'upcoming' | 'completed' | 'cancelled';
}

export default function LessonsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Date range state (default to today)
  const [startDate, setStartDate] = useState<string>(() => toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState<string>(() => toDateInputValue(new Date()));

  // Convert date strings to ISO for API
  const startDateISO = useMemo(() => {
    if (!startDate) return undefined;
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [startDate]);

  const endDateISO = useMemo(() => {
    if (!endDate) return undefined;
    const d = new Date(endDate);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [endDate]);

  // Fetch data with filters
  const apiQuery = useMemo(() => ({
    startDate: startDateISO,
    endDate: endDateISO,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    teacherId: teacherFilter !== 'all' ? teacherFilter : undefined,
    roomId: roomFilter !== 'all' ? roomFilter : undefined,
  }), [startDateISO, endDateISO, statusFilter, teacherFilter, roomFilter]);

  const { data: lessonsData, isLoading: lessonsLoading, error: lessonsError, refetch: refetchLessons } = useLessons(apiQuery);
  const { data: teachersData } = useTeachers();
  const { data: groupsData } = useGroups();
  const { data: roomsData } = useRooms();

  const { mutate: deleteLesson, isLoading: deleteLoading } = useDeleteLesson();

  const lessons = useMemo(() => lessonsData?.lessons || [], [lessonsData]);
  const teachers = useMemo(() => teachersData?.teachers || [], [teachersData]);
  const groups = useMemo(() => groupsData?.groups || [], [groupsData]);
  const rooms = useMemo(() => roomsData?.rooms || [], [roomsData]);

  // Create lookup maps for displaying names
  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach((t) => {
      map[t.id] = t.fullName;
    });
    return map;
  }, [teachers]);

  const roomMap = useMemo(() => {
    const map: Record<string, string> = {};
    rooms.forEach((r) => {
      map[r.id] = r.name;
    });
    return map;
  }, [rooms]);

  // Filter lessons by search
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const teacherName = lesson.teacherName || teacherMap[lesson.teacherId] || '';
      const groupName = lesson.groupName || '';

      const matchesSearch =
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        groupName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [lessons, searchQuery, teacherMap]);

  // Sort lessons by time
  const sortedLessons = useMemo(() => {
    return [...filteredLessons].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [filteredLessons]);

  // Timeline lessons (all in range, not filtered)
  const timelineLessons = useMemo(() => {
    return [...lessons].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [lessons]);

  const handleDeleteClick = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLessonId) return;
    try {
      await deleteLesson(selectedLessonId);
      toast.success('Lesson cancelled successfully');
      setDeleteDialogOpen(false);
      setSelectedLessonId(null);
      refetchLessons();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel lesson');
    }
  };

  const getStatusColor = (status: Lesson['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'in_progress':
        return 'bg-[#F5A623]';
      case 'upcoming':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
    }
  };

  const columns = [
    { key: 'time', label: 'Time', width: 'w-20' },
    { key: 'lesson', label: 'Lesson / Group', width: 'flex-1' },
    { key: 'teacher', label: 'Teacher', width: 'w-40', hideOnMobile: true },
    { key: 'room', label: 'Room', width: 'w-28', hideOnTablet: true },
    { key: 'status', label: 'Status', width: 'w-28' },
    { key: 'actions', label: '', width: 'w-12' },
  ];

  // Render content
  const renderContent = () => {
    if (lessonsLoading) {
      return <SkeletonTable rows={6} />;
    }

    if (lessonsError) {
      return (
        <div className="busala-card p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load lessons</p>
          <Button
            onClick={() => refetchLessons()}
            className="busala-gradient-gold text-[#0B0D10]"
          >
            Retry
          </Button>
        </div>
      );
    }

    if (filteredLessons.length === 0) {
      return (
        <div className="busala-card">
          <EmptyState
            title="No lessons found"
            description={lessons.length === 0 ? "No lessons scheduled for this date range. Add your first lesson." : "No lessons match your current filters."}
            actionLabel={lessons.length === 0 ? "Add Lesson" : undefined}
            onAction={lessons.length === 0 ? () => setAddDialogOpen(true) : undefined}
          />
        </div>
      );
    }

    return (
      <DataTableShell
        title="Lessons"
        subtitle={`${filteredLessons.length} results`}
        columns={columns}
      >
        {sortedLessons.map((lesson) => {
          const teacherName = lesson.teacherName || teacherMap[lesson.teacherId] || 'Unknown';
          const roomName = lesson.roomName || (lesson.roomId ? roomMap[lesson.roomId] : 'No room');
          const groupName = lesson.groupName || '';

          return (
            <DataTableRow key={lesson.id}>
              {/* Time */}
              <div className="w-20">
                <p className="text-sm font-medium text-busala-text-primary">{formatTime(lesson.startAt)}</p>
                <p className="text-xs text-busala-text-subtle">{calculateDuration(lesson.startAt, lesson.endAt)}</p>
              </div>

              {/* Lesson & Group */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-busala-text-primary truncate">{lesson.title}</p>
                <p className="text-xs text-busala-text-muted truncate">{groupName}</p>
              </div>

              {/* Teacher */}
              <div className="w-40 hidden md:flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-muted text-foreground text-xs">
                    {teacherName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-busala-text-secondary truncate">{teacherName}</span>
              </div>

              {/* Room */}
              <div className="w-28 hidden lg:flex items-center gap-1.5 text-busala-text-muted">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs">{roomName}</span>
              </div>

              {/* Status */}
              <div className="w-28">
                <StatusBadge status={mapStatus(lesson.status)} />
              </div>

              {/* Actions */}
              <div className="w-12 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-busala-text-subtle hover:text-busala-text-primary hover:bg-busala-hover-bg"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground">
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground">
                      Edit Lesson
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground">
                      Mark Attendance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      onClick={() => handleDeleteClick(lesson.id)}
                    >
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </DataTableRow>
          );
        })}
      </DataTableShell>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lessons"
        subtitle={`${lessons.length} lessons in selected range`}
        actionLabel="Add Lesson"
        actionIcon={Plus}
        onAction={() => setAddDialogOpen(true)}
      />

      {/* Date Range Filters */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FiltersBar
            searchPlaceholder="Search lessons..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                id: 'status',
                placeholder: 'All Statuses',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'all', label: 'All Statuses' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ],
              },
              {
                id: 'teacher',
                placeholder: 'All Teachers',
                value: teacherFilter,
                onChange: setTeacherFilter,
                options: [
                  { value: 'all', label: 'All Teachers' },
                  ...teachers.map((t) => ({ value: t.id, label: t.fullName })),
                ],
              },
              {
                id: 'room',
                placeholder: 'All Rooms',
                value: roomFilter,
                onChange: setRoomFilter,
                options: [
                  { value: 'all', label: 'All Rooms' },
                  ...rooms.map((r) => ({ value: r.id, label: r.name })),
                ],
              },
            ]}
          />
        </div>
        <div className="flex gap-2 items-center">
          <div className="space-y-1">
            <Label htmlFor="startDate" className="text-xs text-busala-text-subtle">From</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 w-36 bg-busala-hover-bg border-busala-border-glass text-busala-text-primary"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate" className="text-xs text-busala-text-subtle">To</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 w-36 bg-busala-hover-bg border-busala-border-glass text-busala-text-primary"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Lessons Table - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          {renderContent()}
        </div>

        {/* Right Column - 4 columns */}
        <div className="col-span-12 lg:col-span-4">
          {/* Today Timeline */}
          <div className="busala-card p-4">
            <h3 className="text-sm font-medium text-busala-text-muted mb-4">Timeline</h3>
            {lessonsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-6 h-6 rounded-full bg-busala-hover-bg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-busala-hover-bg rounded w-20" />
                      <div className="h-3 bg-busala-hover-bg rounded w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timelineLessons.length === 0 ? (
              <p className="text-sm text-busala-text-muted text-center py-4">No lessons scheduled</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-busala-border-divider" />

                {/* Timeline items */}
                <div className="space-y-4">
                  {timelineLessons.map((lesson) => {
                    const isActive = lesson.status === 'in_progress';
                    const teacherName = lesson.teacherName || teacherMap[lesson.teacherId] || 'Unknown';
                    const roomName = lesson.roomName || (lesson.roomId ? roomMap[lesson.roomId] : 'No room');

                    return (
                      <div
                        key={lesson.id}
                        className={`flex gap-3 relative ${isActive ? 'opacity-100' : 'opacity-70'}`}
                      >
                        {/* Dot */}
                        <div
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center z-10
                            ${isActive ? 'bg-[#F5A623]/20 ring-2 ring-[#F5A623]' : 'bg-card'}
                          `}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${getStatusColor(lesson.status)}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-busala-text-primary">{formatTime(lesson.startAt)}</span>
                            {isActive && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-[#F5A623]/20 text-[#F5A623]">
                                Now
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-busala-text-secondary truncate">{lesson.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-busala-text-muted">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {teacherName.split(' ')[0]}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {roomName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Lesson Dialog */}
      <AddLessonDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={refetchLessons}
        teachers={teachers}
        groups={groups}
        rooms={rooms}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Cancel Lesson"
        description="Are you sure you want to cancel this lesson? This action cannot be undone."
        confirmLabel="Cancel Lesson"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
