'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
} from 'lucide-react';

const bottomNavItems = [
  { id: 'dashboard', label: 'Home', href: '/', icon: LayoutDashboard },
  { id: 'students', label: 'Students', href: '/students', icon: GraduationCap },
  { id: 'teachers', label: 'Teachers', href: '/teachers', icon: Users },
  { id: 'attendance', label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { id: 'payments', label: 'Payments', href: '/payments', icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar border-t border-sidebar-border">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 transition-colors ${
                active ? 'text-busala-gold' : 'text-busala-text-muted'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
