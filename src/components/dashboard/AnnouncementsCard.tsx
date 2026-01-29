'use client';

import React from 'react';
import { AlertCircle, Bell, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { announcements } from '@/data/mock-data';
import type { Announcement } from '@/types/dashboard';

interface AnnouncementItemProps {
  announcement: Announcement;
}

function AnnouncementItem({ announcement }: AnnouncementItemProps) {
  const getPriorityIcon = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'medium':
        return <Bell className="h-4 w-4 text-busala-gold" />;
      default:
        return <Info className="h-4 w-4 text-busala-text-subtle" />;
    }
  };

  const getPriorityBadge = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] px-1.5 py-0">
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-busala-gold/10 text-busala-gold hover:bg-busala-gold/20 text-[10px] px-1.5 py-0">
            Medium
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-3 border-b border-busala-border-subtle last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-busala-hover-bg flex items-center justify-center shrink-0 mt-0.5">
          {getPriorityIcon(announcement.priority)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-busala-text-primary truncate">{announcement.title}</p>
            {getPriorityBadge(announcement.priority)}
          </div>
          <p className="text-xs text-busala-text-subtle line-clamp-2">{announcement.content}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-busala-text-subtle">{announcement.date}</span>
            <span className="text-[10px] text-busala-text-subtle">by {announcement.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementsCard() {
  return (
    <div className="busala-card p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-busala-text-primary">Announcements</h3>
        <button className="text-xs text-busala-gold hover:underline">
          View all
        </button>
      </div>

      {/* Announcements List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {announcements.map((announcement) => (
          <AnnouncementItem key={announcement.id} announcement={announcement} />
        ))}
      </div>
    </div>
  );
}
