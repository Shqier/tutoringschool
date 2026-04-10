'use client';

import React from 'react';
import { TopNav, SidebarNav } from '@/components/dashboard';
import { BottomNav } from '@/components/app/BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen busala-bg-gradient">
      {/* Top Navigation */}
      <TopNav onMenuToggle={() => setSidebarOpen((v) => !v)} />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <SidebarNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="md:ml-[240px] pt-[72px] pb-16 md:pb-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (mobile only) */}
      <BottomNav />
    </div>
  );
}
