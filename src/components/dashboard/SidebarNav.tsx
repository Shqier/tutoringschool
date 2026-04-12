'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Clock,
  User,
  UserRound,
  Building2,
  CreditCard,
  LogOut,
  Kanban,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { sidebarNavItems, sidebarBottomItems } from '@/config/navigation';
import type { NavItem } from '@/config/navigation';

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
  Clock,
  User,
  UserRound,
  Building2,
  CreditCard,
  Kanban,
};

interface SidebarNavProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function SidebarNav({ isOpen = false, onClose }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Proceed with redirect even if the API call fails
    }
    // Clear any client-side cookies
    document.cookie = 'session=; Max-Age=0; path=/';
    document.cookie = 'auth-token=; Max-Age=0; path=/';
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 top-[72px] bottom-0 w-[240px] bg-sidebar border-r border-sidebar-border p-4 flex flex-col z-40 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
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
              onClick={onClose}
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
      <nav className="pt-4 border-t border-sidebar-border space-y-1">
        {sidebarBottomItems.map((item: NavItem) => {
          const Icon = iconMap[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
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

        {/* Logout Button */}
        <button
          onClick={() => setLogoutDialogOpen(true)}
          className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-all text-busala-text-muted hover:text-red-400 hover:bg-busala-hover-bg"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </nav>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to log out? You will need to sign in again to access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={isLoggingOut}
              className="border-border hover:bg-busala-hover-bg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
