'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-busala-hover-bg flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-busala-text-subtle" />
      </div>
      <h3 className="text-base font-medium text-busala-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-busala-text-muted text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {actionLabel && (
        <Button
          onClick={onAction}
          className="h-[38px] px-4 text-sm font-medium text-[#0B0D10] rounded-full busala-gradient-gold hover:opacity-90 transition-opacity"
          style={{
            boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
          }}
        >
          {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
