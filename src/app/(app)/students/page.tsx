'use client';

import React, { useState } from 'react';
import {
  Plus,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
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
} from '@/components/app';
import { students } from '@/data/mock-data';
import type { Student } from '@/types/dashboard';

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesGroup = groupFilter === 'all' || student.groups.some(g => g.toLowerCase().includes(groupFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesGroup;
  });

  const atRiskCount = students.filter(s => s.status === 'at-risk').length;

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${students.length} students enrolled`}
        actionLabel="Add Student"
        actionIcon={Plus}
        onAction={() => console.log('Add student')}
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
              { value: 'at-risk', label: 'At Risk' },
              { value: 'inactive', label: 'Inactive' },
            ],
          },
          {
            id: 'group',
            placeholder: 'All Groups',
            value: groupFilter,
            onChange: setGroupFilter,
            options: [
              { value: 'all', label: 'All Groups' },
              { value: 'Arabic Beginners', label: 'Arabic Beginners' },
              { value: 'Arabic Intermediate', label: 'Arabic Intermediate' },
              { value: 'Quran', label: 'Quran Studies' },
              { value: 'Islamic Studies', label: 'Islamic Studies' },
            ],
          },
        ]}
      />

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
          <DataTableRow key={student.id}>
            {/* Name & Avatar */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={student.avatarUrl} alt={student.name} />
                <AvatarFallback className="bg-muted text-foreground text-sm">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-busala-text-primary truncate">{student.name}</p>
                <p className="text-xs text-busala-text-subtle truncate">{student.email}</p>
              </div>
            </div>

            {/* Groups */}
            <div className="w-44 hidden md:flex flex-wrap gap-1">
              {student.groups.slice(0, 2).map((group, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-busala-hover-bg text-busala-text-muted text-xs px-2 py-0"
                >
                  {group.length > 15 ? group.substring(0, 15) + '...' : group}
                </Badge>
              ))}
              {student.groups.length > 2 && (
                <Badge
                  variant="secondary"
                  className="bg-busala-hover-bg text-busala-text-subtle text-xs px-2 py-0"
                >
                  +{student.groups.length - 2}
                </Badge>
              )}
            </div>

            {/* Attendance */}
            <div className="w-28">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-busala-hover-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      student.attendancePercent >= 80
                        ? 'bg-emerald-500'
                        : student.attendancePercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${student.attendancePercent}%` }}
                  />
                </div>
                <span className="text-xs text-busala-text-muted w-8">{student.attendancePercent}%</span>
              </div>
            </div>

            {/* Last Session */}
            <div className="w-32 hidden lg:block">
              <p className="text-xs text-busala-text-muted">{student.lastSession}</p>
            </div>

            {/* Balance */}
            <div className="w-28 hidden lg:block">
              <p className={`text-sm font-medium ${
                student.balance < 0
                  ? 'text-red-400'
                  : student.balance === 0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {formatCurrency(student.balance)}
              </p>
              <p className="text-xs text-busala-text-subtle">{student.plan}</p>
            </div>

            {/* Status */}
            <div className="w-24">
              <StatusBadge status={student.status} />
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
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground">
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground">
                    Message
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400">
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DataTableRow>
        ))}
      </DataTableShell>
    </div>
  );
}
