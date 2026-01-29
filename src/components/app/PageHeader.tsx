'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-busala-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-busala-text-subtle mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {actionLabel && (
          <Button
            onClick={onAction}
            className="h-[38px] px-4 text-sm font-medium text-white rounded-full busala-gradient-gold hover:opacity-90 transition-opacity"
            style={{
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
            }}
          >
            {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
