'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  SkeletonTable,
  SkeletonCard,
  EmptyState,
  ConfirmDialog,
} from '@/components/app';
import { GroupDialog } from '@/components/groups/GroupDialog';
import { AssignStudentsDialog } from '@/components/groups/AssignStudentsDialog';
import { useGroups, useTeachers, useRooms, useLessons, useDeleteGroup } from '@/lib/api/hooks';
import type { Group } from '@/lib/api/types';

export default function GroupsPage() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  // Calculate today's date range for lessons query
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, []);

  // Fetch data
  const { data: groupsData, isLoading, error, refetch } = useGroups();
  const { data: teachersData } = useTeachers();
  const { data: roomsData } = useRooms();
  const { data: lessonsData } = useLessons({ startDate: todayStart, endDate: todayEnd });

  const { mutate: deleteGroup, isLoading: deleteLoading } = useDeleteGroup();

  const groups = groupsData?.groups || [];
  const teachers = teachersData?.teachers || [];
  const rooms = roomsData?.rooms || [];
  const lessons = lessonsData?.lessons || [];

  // Create teacher lookup
  const teacherMap = useMemo(() => {
    const map: Record<string, string> = {};
    teachers.forEach((t) => {
      map[t.id] = t.fullName;
    });
    return map;
  }, [teachers]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeacher = teacherFilter === 'all' || group.teacherId === teacherFilter;
      return matchesSearch && matchesTeacher;
    });
  }, [groups, searchQuery, teacherFilter]);

  // Select first group if none selected
  React.useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  // Get upcoming lessons for selected group
  const groupLessons = useMemo(() => {
    if (!selectedGroup) return [];
    return lessons.filter((l) => l.groupId === selectedGroup.id).slice(0, 4);
  }, [lessons, selectedGroup]);

  const handleAddClick = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleManageStudents = (group: Group) => {
    setSelectedGroup(group);
    setAssignDialogOpen(true);
  };

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      await deleteGroup(groupToDelete.id);
      toast.success('Group archived successfully');
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      if (selectedGroup?.id === groupToDelete.id) {
        setSelectedGroup(null);
      }
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive group');
    }
  };

  const columns = [
    { key: 'name', label: 'Group / Teacher', width: 'flex-1' },
    { key: 'students', label: 'Students', width: 'w-24' },
    { key: 'schedule', label: 'Schedule', width: 'w-40', hideOnMobile: true },
    { key: 'progress', label: 'Progress', width: 'w-28' },
    { key: 'nextLesson', label: 'Next Lesson', width: 'w-32', hideOnTablet: true },
    { key: 'actions', label: '', width: 'w-12' },
  ];

  // Render content
  const renderContent = () => {
    if (isLoading) {
      return <SkeletonTable rows={5} />;
    }

    if (error) {
      return (
        <div className="busala-card p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load groups</p>
          <Button onClick={() => refetch()} className="busala-gradient-gold text-[#0B0D10]">
            Retry
          </Button>
        </div>
      );
    }

    if (filteredGroups.length === 0) {
      return (
        <div className="busala-card">
          <EmptyState
            title="No groups found"
            description={groups.length === 0 ? "Create your first group to get started." : "No groups match your current filters."}
            actionLabel={groups.length === 0 ? "Create Group" : undefined}
            onAction={groups.length === 0 ? handleAddClick : undefined}
          />
        </div>
      );
    }

    return (
      <DataTableShell
        title="All Groups"
        subtitle={`${filteredGroups.length} results`}
        columns={columns}
        headerAction={
          <button className="text-xs text-[#F5A623] hover:underline">
            View all
          </button>
        }
      >
        {filteredGroups.map((group) => {
          const teacherName = group.teacherName || teacherMap[group.teacherId] || 'Unassigned';

          return (
            <DataTableRow
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={selectedGroup?.id === group.id ? 'bg-busala-hover-bg' : ''}
            >
              {/* Group Name & Teacher */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-busala-text-primary truncate">{group.name}</p>
                <p className="text-xs text-busala-text-subtle">{teacherName}</p>
              </div>

              {/* Students Count */}
              <div className="flex items-center gap-1.5 text-busala-text-muted w-24">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">{group.studentsCount || group.studentIds?.length || 0} students</span>
              </div>

              {/* Schedule */}
              <div className="hidden md:flex items-center gap-1.5 text-busala-text-muted w-40">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs truncate">{group.schedule || 'Not scheduled'}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-28">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F5A623] rounded-full transition-all"
                      style={{ width: `${group.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-busala-text-muted w-8">{group.progress || 0}%</span>
                </div>
              </div>

              {/* Next Lesson */}
              <div className="hidden lg:flex items-center gap-1.5 text-busala-text-muted w-32">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">{group.nextLesson || 'No upcoming'}</span>
              </div>

              {/* Actions */}
              <div className="w-12 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-busala-text-subtle hover:text-busala-text-primary hover:bg-busala-hover-bg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem
                      className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGroup(group);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(group);
                      }}
                    >
                      Edit Group
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManageStudents(group);
                      }}
                    >
                      Manage Students
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(group);
                      }}
                    >
                      Archive
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
        title="Groups"
        subtitle={`${groups.length} active groups`}
        actionLabel="Create Group"
        actionIcon={Plus}
        onAction={handleAddClick}
      />

      <FiltersBar
        searchPlaceholder="Search groups..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
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
        ]}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Groups Table - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          {renderContent()}
        </div>

        {/* Right Column - 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Group Summary Card */}
          {isLoading ? (
            <SkeletonCard />
          ) : selectedGroup ? (
            <>
              <div className="busala-card p-4">
                <h3 className="text-sm font-medium text-busala-text-muted mb-4">Group Summary</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-busala-text-primary">{selectedGroup.name}</p>
                    <p className="text-sm text-busala-text-muted">
                      {selectedGroup.teacherName || teacherMap[selectedGroup.teacherId] || 'Unassigned'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-busala-hover-bg">
                      <p className="text-xs text-busala-text-subtle mb-1">Students</p>
                      <p className="text-xl font-semibold text-busala-text-primary">
                        {selectedGroup.studentsCount || selectedGroup.studentIds?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-busala-hover-bg">
                      <p className="text-xs text-busala-text-subtle mb-1">Progress</p>
                      <p className="text-xl font-semibold text-[#F5A623]">{selectedGroup.progress || 0}%</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t" style={{ borderColor: 'var(--busala-border-divider)' }}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-busala-text-muted">Schedule</span>
                      <span className="text-busala-text-primary">{selectedGroup.schedule || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-busala-text-muted">Next Lesson</span>
                      <span className="text-busala-text-primary">{selectedGroup.nextLesson || 'None'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
                      onClick={() => handleManageStudents(selectedGroup)}
                    >
                      Manage Students
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 busala-gradient-gold text-[#0B0D10] hover:opacity-90"
                    >
                      Schedule Lesson
                    </Button>
                  </div>
                </div>
              </div>

              {/* Next Lessons Card */}
              <div className="busala-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-busala-text-muted">Upcoming Lessons</h3>
                  <button className="text-xs text-[#F5A623] hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {groupLessons.length > 0 ? (
                    groupLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-busala-hover-bg transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-lg bg-busala-hover-bg flex flex-col items-center justify-center">
                          <span className="text-xs text-busala-text-subtle">Today</span>
                          <span className="text-sm font-medium text-busala-text-primary">
                            {new Date(lesson.startAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-busala-text-primary truncate">{lesson.title}</p>
                          <p className="text-xs text-busala-text-muted">
                            {lesson.roomName || 'No room'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-busala-text-subtle" />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-busala-text-muted text-center py-4">No upcoming lessons</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Group Dialog (Add/Edit) */}
      <GroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
        group={editingGroup}
        teachers={teachers}
        rooms={rooms}
      />

      {/* Assign Students Dialog */}
      <AssignStudentsDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={refetch}
        group={selectedGroup}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive Group"
        description={`Are you sure you want to archive "${groupToDelete?.name}"? The group will be hidden but data will be preserved.`}
        confirmLabel="Archive"
        variant="warning"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
