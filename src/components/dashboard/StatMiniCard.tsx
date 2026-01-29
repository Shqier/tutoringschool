'use client';

import React from 'react';
import {
  Users,
  GraduationCap,
  Users2,
  DoorOpen,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { StatCard } from '@/types/dashboard';

const iconMap: Record<string, React.ElementType> = {
  Users,
  GraduationCap,
  Users2,
  DoorOpen,
  ClipboardCheck,
};

interface StatMiniCardProps {
  stat: StatCard;
}

export function StatMiniCard({ stat }: StatMiniCardProps) {
  const Icon = iconMap[stat.icon || 'Users'];

  const getTrendIcon = () => {
    if (!stat.trend) return null;
    switch (stat.trend.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-400" />;
      default:
        return <Minus className="h-3 w-3 text-busala-text-subtle" />;
    }
  };

  const getTrendColor = () => {
    if (!stat.trend) return 'text-busala-text-subtle';
    switch (stat.trend.direction) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-busala-text-subtle';
    }
  };

  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-xl bg-busala-hover-bg border border-busala-border-glass transition-all hover:bg-busala-active-bg hover:border-busala-gold/20"
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg bg-busala-gold/10 flex items-center justify-center">
          {Icon && <Icon className="h-4 w-4 text-busala-gold" />}
        </div>
        {stat.trend && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{stat.trend.value}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-busala-text-primary">{stat.value}</p>
        <p className="text-xs text-busala-text-subtle">{stat.label}</p>
      </div>
    </div>
  );
}
