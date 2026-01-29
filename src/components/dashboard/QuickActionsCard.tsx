'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Users,
  CalendarPlus,
  BarChart3,
} from 'lucide-react';
import { quickActions } from '@/data/mock-data';
import type { QuickAction } from '@/types/dashboard';

const iconMap: Record<string, React.ElementType> = {
  UserPlus,
  Users,
  CalendarPlus,
  BarChart3,
};

interface QuickActionButtonProps {
  action: QuickAction;
}

function QuickActionButton({ action }: QuickActionButtonProps) {
  const Icon = iconMap[action.icon];

  return (
    <Link
      href={action.href}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-busala-hover-bg border border-busala-border-glass transition-all hover:bg-busala-active-bg hover:border-busala-gold/20 busala-card-hover group"
    >
      <div className="w-10 h-10 rounded-xl bg-busala-gold/10 flex items-center justify-center group-hover:bg-busala-gold/20 transition-colors">
        {Icon && <Icon className="h-5 w-5 text-busala-gold" />}
      </div>
      <span className="text-xs font-medium text-busala-text-muted text-center">{action.label}</span>
    </Link>
  );
}

export function QuickActionsCard() {
  return (
    <div className="busala-card p-4">
      {/* Header */}
      <h3 className="text-base font-semibold text-busala-text-primary mb-4">Quick Actions</h3>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}
