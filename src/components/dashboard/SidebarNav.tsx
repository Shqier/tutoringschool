'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Users2,
  BookOpen,
  GraduationCap,
  DoorOpen,
  ClipboardCheck,
  Settings,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { sidebarNavItems, sidebarBottomItems } from '@/data/mock-data';
import type { NavItem } from '@/types/dashboard';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Users2,
  BookOpen,
  GraduationCap,
  DoorOpen,
  ClipboardCheck,
  Settings,
  Calendar,
};

export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-[72px] bottom-0 w-[240px] bg-sidebar border-r border-sidebar-border p-4 flex flex-col"
    >
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {sidebarNavItems.map((item: NavItem) => {
          const Icon = iconMap[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'busala-nav-active text-busala-gold'
                  : 'text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg'
                }
              `}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge
                  className="h-5 min-w-5 px-1.5 text-xs font-medium bg-busala-gold text-white hover:bg-busala-gold"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <nav className="pt-4 border-t border-sidebar-border">
        {sidebarBottomItems.map((item: NavItem) => {
          const Icon = iconMap[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'busala-nav-active text-busala-gold'
                  : 'text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg'
                }
              `}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
