'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { StatMiniCard } from './StatMiniCard';
import { dashboardStats, currentUser } from '@/data/mock-data';

export function AdminOverviewCard() {
  const [showInfo, setShowInfo] = React.useState(true);

  return (
    <div className="busala-card p-6">
      <div className="flex items-start justify-between mb-6">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="bg-muted text-foreground text-lg">
              {currentUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold text-busala-text-primary">
              Hello, {currentUser.name}
            </h2>
            <p className="text-sm text-busala-text-subtle">
              Welcome back to your dashboard
            </p>
          </div>
        </div>

        {/* Hide Info Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-busala-text-subtle">Hide info</span>
          <Switch
            checked={!showInfo}
            onCheckedChange={(checked) => setShowInfo(!checked)}
            className="data-[state=checked]:bg-busala-gold"
          />
        </div>
      </div>

      {/* Stats Grid */}
      {showInfo && (
        <div className="grid grid-cols-5 gap-4">
          {dashboardStats.map((stat) => (
            <StatMiniCard key={stat.id} stat={stat} />
          ))}
        </div>
      )}
    </div>
  );
}
