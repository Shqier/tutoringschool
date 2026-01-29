'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PageHeader,
  StatusBadge,
  SkeletonTable,
  EmptyState,
  ConfirmDialog,
} from '@/components/app';
import { useApprovals, useApproveApproval, useRejectApproval } from '@/lib/api/hooks';
import type { Approval } from '@/lib/api/types';

// Map API type to display type
function mapApprovalType(type: Approval['type']): 'teacher-change' | 'student-request' | 'room-change' {
  return type.replace('_', '-') as 'teacher-change' | 'student-request' | 'room-change';
}

// Format timestamp
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function ApprovalsPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject'>('approve');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  // Fetch approvals
  const { data: approvalsData, isLoading, error, refetch } = useApprovals();

  const { mutate: approveApproval, isLoading: approving } = useApproveApproval();
  const { mutate: rejectApproval, isLoading: rejecting } = useRejectApproval();

  const approvals = approvalsData?.approvals || [];
  const counts = approvalsData?.counts;

  // Filter approvals based on tab
  const filteredApprovals = useMemo(() => {
    if (selectedTab === 'all') return approvals;
    // Convert tab value to API type format
    const apiType = selectedTab.replace('-', '_');
    return approvals.filter((a) => a.type === apiType);
  }, [approvals, selectedTab]);

  // Counts for tabs
  const pendingCount = counts?.pending || approvals.filter((a) => a.status === 'pending').length;
  const teacherChanges = counts?.byType?.teacher_change || approvals.filter((a) => a.type === 'teacher_change').length;
  const studentRequests = counts?.byType?.student_request || approvals.filter((a) => a.type === 'student_request').length;
  const roomChanges = counts?.byType?.room_change || approvals.filter((a) => a.type === 'room_change').length;

  const handleApproveClick = (approval: Approval) => {
    setSelectedApproval(approval);
    setConfirmAction('approve');
    setConfirmDialogOpen(true);
  };

  const handleRejectClick = (approval: Approval) => {
    setSelectedApproval(approval);
    setConfirmAction('reject');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedApproval) return;

    try {
      if (confirmAction === 'approve') {
        await approveApproval({ id: selectedApproval.id });
        toast.success('Approval request approved');
      } else {
        await rejectApproval({ id: selectedApproval.id });
        toast.success('Approval request rejected');
      }
      setConfirmDialogOpen(false);
      setSelectedApproval(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${confirmAction} request`);
    }
  };

  const getTypeIcon = (type: Approval['type']) => {
    switch (type) {
      case 'teacher_change':
        return 'T';
      case 'student_request':
        return 'S';
      case 'room_change':
        return 'R';
    }
  };

  const getTypeColor = (type: Approval['type']) => {
    switch (type) {
      case 'teacher_change':
        return 'bg-blue-500/20 text-blue-400';
      case 'student_request':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'room_change':
        return 'bg-purple-500/20 text-purple-400';
    }
  };

  // Render content
  const renderContent = () => {
    if (isLoading) {
      return <SkeletonTable rows={5} />;
    }

    if (error) {
      return (
        <div className="p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load approvals</p>
          <Button onClick={() => refetch()} className="busala-gradient-gold text-[#0B0D10]">
            Retry
          </Button>
        </div>
      );
    }

    if (filteredApprovals.length === 0) {
      return (
        <EmptyState
          icon={CheckCircle}
          title="No approvals"
          description={selectedTab === 'all' ? "No pending approvals at this time." : "No approvals in this category."}
        />
      );
    }

    return (
      <div className="divide-y" style={{ borderColor: 'var(--busala-border-divider)' }}>
        {filteredApprovals.map((approval) => (
          <div
            key={approval.id}
            className="flex items-center gap-4 p-4 hover:bg-busala-hover-bg transition-colors"
          >
            {/* Avatar / Type Icon */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={approval.requesterAvatar} alt={approval.requesterName} />
              <AvatarFallback className={`${getTypeColor(approval.type)} text-sm font-medium`}>
                {getTypeIcon(approval.type)}
              </AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-busala-text-primary">{approval.title}</p>
                {approval.priority && (
                  <StatusBadge status={approval.priority} />
                )}
              </div>
              <p className="text-sm text-busala-text-muted truncate">{approval.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-busala-text-subtle">by {approval.requesterName}</span>
                <span className="text-xs text-busala-text-subtle flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(approval.createdAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            {approval.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApproveClick(approval)}
                  disabled={approving || rejecting}
                  className="h-9 px-4 busala-gradient-gold text-[#0B0D10] hover:opacity-90"
                >
                  {approving && selectedApproval?.id === approval.id && (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  )}
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectClick(approval)}
                  disabled={approving || rejecting}
                  className="h-9 px-4 bg-busala-hover-bg border-border text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                >
                  {rejecting && selectedApproval?.id === approval.id && (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  )}
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <StatusBadge status={approval.status} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        subtitle={`${pendingCount} pending approvals`}
      >
        {pendingCount > 0 && (
          <Button
            variant="outline"
            className="bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Bulk Approve
          </Button>
        )}
      </PageHeader>

      <div className="busala-card overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="border-b" style={{ borderColor: 'var(--busala-border-divider)' }}>
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F5A623] rounded-none px-6 py-4"
              >
                All
                <Badge className="ml-2 bg-busala-hover-bg text-busala-text-muted text-xs">
                  {approvals.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="teacher-change"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F5A623] rounded-none px-6 py-4"
              >
                Teacher Changes
                <Badge className="ml-2 bg-blue-500/20 text-blue-400 text-xs">
                  {teacherChanges}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="student-request"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F5A623] rounded-none px-6 py-4"
              >
                Student Requests
                <Badge className="ml-2 bg-emerald-500/20 text-emerald-400 text-xs">
                  {studentRequests}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="room-change"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#F5A623] rounded-none px-6 py-4"
              >
                Room Changes
                <Badge className="ml-2 bg-purple-500/20 text-purple-400 text-xs">
                  {roomChanges}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={selectedTab} className="m-0">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={confirmAction === 'approve' ? 'Approve Request' : 'Reject Request'}
        description={
          confirmAction === 'approve'
            ? `Are you sure you want to approve "${selectedApproval?.title}"?`
            : `Are you sure you want to reject "${selectedApproval?.title}"? This action cannot be undone.`
        }
        confirmLabel={confirmAction === 'approve' ? 'Approve' : 'Reject'}
        variant={confirmAction === 'reject' ? 'danger' : 'default'}
        isLoading={approving || rejecting}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
