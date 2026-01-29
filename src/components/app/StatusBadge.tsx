'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

type StatusType =
  | 'active'
  | 'inactive'
  | 'at-risk'
  | 'available'
  | 'occupied'
  | 'maintenance'
  | 'upcoming'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'high'
  | 'medium'
  | 'low';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Entity statuses
  active: {
    label: 'Active',
    className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-white/10 text-white/60 border border-white/20',
  },
  'at-risk': {
    label: 'At Risk',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  // Room statuses
  available: {
    label: 'Available',
    className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  occupied: {
    label: 'Occupied',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  },
  // Lesson statuses
  upcoming: {
    label: 'Upcoming',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  // Approval statuses
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  // Priority levels
  high: {
    label: 'High',
    className: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  },
  low: {
    label: 'Low',
    className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      className={`${config.className} text-xs px-2 py-0.5 ${className}`}
    >
      {config.label}
    </Badge>
  );
}
