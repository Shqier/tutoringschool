'use client';

import React from 'react';
import { TopNav, SidebarNav } from '@/components/dashboard';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen busala-bg-gradient">
      {/* Top Navigation */}
      <TopNav />

      {/* Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <main className="ml-[240px] pt-[72px]">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
