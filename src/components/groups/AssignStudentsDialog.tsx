'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Loader2, Check, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStudents, useAssignStudents } from '@/lib/api/hooks';
import type { Group, Student } from '@/lib/api/types';

interface AssignStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  group: Group | null;
}

export function AssignStudentsDialog({
  open,
  onOpenChange,
  onSuccess,
  group,
}: AssignStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const { mutate: assignStudents, isLoading: assigning } = useAssignStudents();

  const students = studentsData?.students || [];

  // Initialize selected IDs when dialog opens
  useEffect(() => {
    if (open && group) {
      setSelectedIds(group.studentIds || []);
      setSearchQuery('');
    }
  }, [open, group]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter((s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [students, searchQuery]);

  const toggleStudent = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    if (!group) return;
    try {
      await assignStudents({ id: group.id, studentIds: selectedIds });
      toast.success('Students updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update students');
    }
  };

  // Compute change summary
  const originalIds = group?.studentIds || [];
  const addedCount = selectedIds.filter((id) => !originalIds.includes(id)).length;
  const removedCount = originalIds.filter((id) => !selectedIds.includes(id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#F5A623]" />
            Manage Students
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {group ? `Assign or remove students from "${group.name}"` : 'Select students for this group'}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
          />
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between text-xs text-white/60 py-2">
          <span>{selectedIds.length} students selected</span>
          {(addedCount > 0 || removedCount > 0) && (
            <span>
              {addedCount > 0 && <span className="text-emerald-400">+{addedCount} new</span>}
              {addedCount > 0 && removedCount > 0 && ' / '}
              {removedCount > 0 && <span className="text-red-400">-{removedCount} removed</span>}
            </span>
          )}
        </div>

        {/* Student List */}
        <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
          {studentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-white/50 text-sm">
              {students.length === 0 ? 'No students available' : 'No students match your search'}
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedIds.includes(student.id);
              const wasOriginal = originalIds.includes(student.id);
              const isNew = isSelected && !wasOriginal;
              const isRemoved = !isSelected && wasOriginal;

              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => toggleStudent(student.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                    ${isSelected
                      ? 'bg-[#F5A623]/10 border border-[#F5A623]/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/[0.07]'
                    }
                  `}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#1A1D24] text-white text-xs">
                      {student.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {student.fullName}
                    </p>
                    <p className="text-xs text-white/50 truncate">{student.email || 'No email'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNew && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        New
                      </span>
                    )}
                    {isRemoved && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                        Remove
                      </span>
                    )}
                    <div
                      className={`
                        w-5 h-5 rounded-full flex items-center justify-center
                        ${isSelected
                          ? 'bg-[#F5A623] text-[#0B0D10]'
                          : 'border border-white/20'
                        }
                      `}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assigning}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={assigning}
            className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
          >
            {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
