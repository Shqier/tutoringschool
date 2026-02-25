'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  DetailCard,
  StatusBadge,
  SkeletonTable,
  SkeletonDetailCard,
  EmptyState,
  ConfirmDialog,
} from '@/components/app';
import { TeacherDialog } from '@/components/teachers/TeacherDialog';
import { useTeachers, useDeleteTeacher } from '@/lib/api/hooks';
import type { Teacher } from '@/lib/api/types';

export default function TeachersPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Fetch teachers
  const router = useRouter();
  const { data: teachersData, isLoading, error, refetch } = useTeachers();
  const { mutate: deleteTeacher, isLoading: deleteLoading } = useDeleteTeacher();

  const teachers = useMemo(() => teachersData?.teachers || [], [teachersData]);

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch =
        teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchQuery, statusFilter]);

  // Select first teacher if none selected and we have teachers
  React.useEffect(() => {
    if (!selectedTeacher && teachers.length > 0) {
      setSelectedTeacher(teachers[0]);
    }
  }, [teachers, selectedTeacher]);

  const handleAddClick = () => {
    setEditingTeacher(null);
    setDialogOpen(true);
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setDialogOpen(true);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await deleteTeacher(teacherToDelete.id);
      toast.success('Teacher deactivated successfully');
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
      if (selectedTeacher?.id === teacherToDelete.id) {
        setSelectedTeacher(null);
      }
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate teacher');
    }
  };

  const handleDialogSuccess = () => {
    refetch();
    // If we were editing the selected teacher, refresh the selection
    if (editingTeacher && selectedTeacher?.id === editingTeacher.id) {
      // The data will be refreshed, so we need to update the selected teacher
      // This will happen automatically through the refetch
    }
  };

  const handleExport = () => {
    const header = ['Name', 'Email', 'Phone', 'Subjects', 'Status', 'Hours/Max Hours'];
    const rows = filteredTeachers.map((t) => [
      t.fullName,
      t.email,
      t.phone || '',
      t.subjects.join('; '),
      t.status,
      `${t.hoursThisWeek || 0}/${t.maxHours || 25}`,
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teachers_export.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Teachers exported successfully');
  };

  const columns = [
    { key: 'name', label: 'Teacher', width: 'flex-1' },
    { key: 'subjects', label: 'Subjects', width: 'w-40', hideOnMobile: true },
    { key: 'hours', label: 'Hours', width: 'w-24', hideOnTablet: true },
    { key: 'status', label: 'Status', width: 'w-24' },
    { key: 'actions', label: '', width: 'w-16' },
  ];

  // Render content
  const renderContent = () => {
    if (isLoading) {
      return <SkeletonTable rows={6} />;
    }

    if (error) {
      return (
        <div className="busala-card p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load teachers</p>
          <Button onClick={() => refetch()} className="busala-gradient-gold text-[#0B0D10]">
            Retry
          </Button>
        </div>
      );
    }

    if (filteredTeachers.length === 0) {
      return (
        <div className="busala-card">
          <EmptyState
            title="No teachers found"
            description={teachers.length === 0 ? "Add your first teacher to get started." : "No teachers match your current filters."}
            actionLabel={teachers.length === 0 ? "Add Teacher" : undefined}
            onAction={teachers.length === 0 ? handleAddClick : undefined}
          />
        </div>
      );
    }

    return (
      <DataTableShell
        title="All Teachers"
        subtitle={`${filteredTeachers.length} results`}
        columns={columns}
        headerAction={
          <button className="text-xs text-[#F5A623] hover:underline" onClick={handleExport}>
            Export
          </button>
        }
      >
        {filteredTeachers.map((teacher) => (
          <DataTableRow
            key={teacher.id}
            onClick={() => setSelectedTeacher(teacher)}
            className={selectedTeacher?.id === teacher.id ? 'bg-busala-hover-bg' : ''}
          >
            {/* Name & Avatar */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-muted text-foreground text-sm">
                  {teacher.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-busala-text-primary truncate">{teacher.fullName}</p>
                <p className="text-xs text-busala-text-subtle truncate">{teacher.email}</p>
              </div>
            </div>

            {/* Subjects */}
            <div className="w-40 hidden md:flex flex-wrap gap-1">
              {teacher.subjects.slice(0, 2).map((subject, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-busala-hover-bg text-busala-text-secondary text-xs px-2 py-0"
                >
                  {subject}
                </Badge>
              ))}
              {teacher.subjects.length > 2 && (
                <Badge variant="secondary" className="bg-busala-hover-bg text-busala-text-subtle text-xs px-2 py-0">
                  +{teacher.subjects.length - 2}
                </Badge>
              )}
            </div>

            {/* Hours */}
            <div className="w-24 hidden lg:block">
              <p className="text-xs text-busala-text-muted">
                {teacher.hoursThisWeek || 0}/{teacher.maxHours || 25}h
              </p>
            </div>

            {/* Status */}
            <div className="w-24">
              <StatusBadge status={teacher.status} />
            </div>

            {/* Actions */}
            <div className="w-16 flex justify-end">
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
                      router.push(`/teachers/${teacher.id}`);
                    }}
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(teacher);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(teacher);
                    }}
                  >
                    Deactivate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DataTableRow>
        ))}
      </DataTableShell>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        subtitle={`${teachers.length} teachers in your school`}
        actionLabel="Add Teacher"
        actionIcon={Plus}
        onAction={handleAddClick}
      />

      <FiltersBar
        searchPlaceholder="Search teachers..."
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
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Teachers Table - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          {renderContent()}
        </div>

        {/* Right Column - 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Teacher Detail Card */}
          {isLoading ? (
            <SkeletonDetailCard />
          ) : selectedTeacher ? (
            <>
              <DetailCard
                title="Teacher Details"
                name={selectedTeacher.fullName}
                subtitle={selectedTeacher.subjects.join(', ')}
                email={selectedTeacher.email}
                phone={selectedTeacher.phone}
                status={{
                  label: selectedTeacher.status === 'active' ? 'Active' : 'Inactive',
                  variant: selectedTeacher.status === 'active' ? 'active' : 'inactive',
                }}
                details={[
                  { label: 'Hours This Week', value: `${selectedTeacher.hoursThisWeek || 0}/${selectedTeacher.maxHours || 25}h` },
                  { label: 'Lessons Today', value: `${selectedTeacher.lessonsToday || 0} lessons` },
                ]}
                onEdit={() => handleEditClick(selectedTeacher)}
                onDelete={() => handleDeleteClick(selectedTeacher)}
              />

              {/* Workload Card */}
              <div className="busala-card p-4">
                <h3 className="text-sm font-medium text-busala-text-muted mb-4">Weekly Workload</h3>
                <div className="space-y-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => {
                    const weeklyHours = selectedTeacher.hoursThisWeek || 0;
                    const dayWeights = [0.25, 0.2, 0.2, 0.2, 0.15];
                    const hours = Math.round(weeklyHours * dayWeights[index]);
                    const maxHours = 8;
                    const percent = (hours / maxHours) * 100;
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
                    {selectedTeacher.hoursThisWeek || 0} hours
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Teacher Dialog (Add/Edit) */}
      <TeacherDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        teacher={editingTeacher}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Deactivate Teacher"
        description={`Are you sure you want to deactivate ${teacherToDelete?.fullName}? They will no longer be able to access the system.`}
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
