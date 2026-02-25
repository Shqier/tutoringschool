'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  StatusBadge,
  SkeletonTable,
  EmptyState,
  ConfirmDialog,
} from '@/components/app';
import { StudentDialog } from '@/components/students/StudentDialog';
import { useEntityDialog } from '@/hooks/useEntityDialog';
import { useStudents, useDeleteStudent } from '@/lib/api/hooks';
import type { Student } from '@/lib/api/types';

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [_groupFilter, _setGroupFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const router = useRouter();

  // Entity dialog state
  const dialog = useEntityDialog<Student>();

  // Fetch students
  const { data: studentsData, isLoading, error, refetch } = useStudents();
  const { mutate: deleteStudent, isLoading: deleteLoading } = useDeleteStudent();

  const students = useMemo(() => studentsData?.students || [], [studentsData]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      // Note: groupFilter would need group names to be populated in the API response
      // For now, we'll skip group filtering or match by groupIds
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const atRiskCount = students.filter(s => s.status === 'at_risk').length;

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.id);
      toast.success('Student archived successfully');
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive student');
    }
  };

  const handleDialogSuccess = () => {
    refetch();
  };

  const columns = [
    { key: 'name', label: 'Student', width: 'flex-1' },
    { key: 'groups', label: 'Groups', width: 'w-44', hideOnMobile: true },
    { key: 'attendance', label: 'Attendance', width: 'w-28' },
    { key: 'lastSession', label: 'Last Session', width: 'w-32', hideOnTablet: true },
    { key: 'balance', label: 'Balance', width: 'w-28', hideOnTablet: true },
    { key: 'status', label: 'Status', width: 'w-24' },
    { key: 'actions', label: '', width: 'w-12' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Render content
  const renderContent = () => {
    if (isLoading) {
      return <SkeletonTable rows={6} />;
    }

    if (error) {
      return (
        <div className="busala-card p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load students</p>
          <Button onClick={() => refetch()} className="busala-gradient-gold text-[#0B0D10]">
            Retry
          </Button>
        </div>
      );
    }

    if (filteredStudents.length === 0) {
      return (
        <div className="busala-card">
          <EmptyState
            title="No students found"
            description={students.length === 0 ? "Add your first student to get started." : "No students match your current filters."}
            actionLabel={students.length === 0 ? "Add Student" : undefined}
            onAction={students.length === 0 ? dialog.openCreate : undefined}
          />
        </div>
      );
    }

    return (
      <DataTableShell
        title="All Students"
        subtitle={`${filteredStudents.length} results`}
        columns={columns}
        headerAction={
          <button className="text-xs text-busala-gold hover:underline">
            Export
          </button>
        }
        className="min-h-[500px]"
      >
        {filteredStudents.map((student) => (
          <DataTableRow
            key={student.id}
            onClick={() => dialog.openView(student)}
            className="cursor-pointer hover:bg-busala-hover-bg"
          >
            {/* Name & Avatar */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={undefined} alt={student.fullName} />
                <AvatarFallback className="bg-muted text-foreground text-sm">
                  {student.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-busala-text-primary truncate">{student.fullName}</p>
                <p className="text-xs text-busala-text-subtle truncate">{student.email || 'No email'}</p>
              </div>
            </div>

            {/* Groups */}
            <div className="w-44 hidden md:flex flex-wrap gap-1">
              {student.groupIds && student.groupIds.length > 0 ? (
                <>
                  {student.groupIds.slice(0, 2).map((groupId, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-busala-hover-bg text-busala-text-muted text-xs px-2 py-0"
                    >
                      Group {idx + 1}
                    </Badge>
                  ))}
                  {student.groupIds.length > 2 && (
                    <Badge
                      variant="secondary"
                      className="bg-busala-hover-bg text-busala-text-subtle text-xs px-2 py-0"
                    >
                      +{student.groupIds.length - 2}
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-xs text-busala-text-subtle">No groups</span>
              )}
            </div>

            {/* Attendance */}
            <div className="w-28">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (student.attendancePercent || 0) >= 80
                        ? 'bg-emerald-500'
                        : (student.attendancePercent || 0) >= 70
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${student.attendancePercent || 0}%` }}
                  />
                </div>
                <span className="text-xs text-busala-text-muted w-8">{student.attendancePercent || 0}%</span>
              </div>
            </div>

            {/* Last Session */}
            <div className="w-32 hidden lg:block">
              <p className="text-xs text-busala-text-muted">
                {student.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            {/* Balance */}
            <div className="w-28 hidden lg:block">
              <p className={`text-sm font-medium ${
                (student.balance || 0) < 0
                  ? 'text-red-400'
                  : (student.balance || 0) === 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {formatCurrency(student.balance || 0)}
              </p>
              <p className="text-xs text-busala-text-subtle">{student.plan || 'No plan'}</p>
            </div>

            {/* Status */}
            <div className="w-24">
              <StatusBadge status={student.status === 'at_risk' ? 'at-risk' : student.status as string} />
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
                      router.push(`/students/${student.id}`);
                    }}
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      dialog.openEdit(student);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(student);
                    }}
                  >
                    Archive
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
        title="Students"
        subtitle={`${students.length} students enrolled`}
        actionLabel="Add Student"
        actionIcon={Plus}
        onAction={dialog.openCreate}
      >
        {atRiskCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-400">{atRiskCount} at risk</span>
          </div>
        )}
      </PageHeader>

      <FiltersBar
        searchPlaceholder="Search students..."
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
              { value: 'at_risk', label: 'At Risk' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
        ]}
      />

      {renderContent()}

      {/* Student Dialog (Add/View/Edit) */}
      <StudentDialog
        isOpen={dialog.isOpen}
        onClose={dialog.close}
        mode={dialog.mode}
        entity={dialog.entity}
        switchToEdit={dialog.switchToEdit}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive Student"
        description={`Are you sure you want to archive ${studentToDelete?.fullName}? This will set their status to inactive.`}
        confirmLabel="Archive"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
