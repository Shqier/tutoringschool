'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Plus,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { topNavItems } from '@/data/mock-data';
import { useNotifications } from '@/lib/api/hooks';
import type { NavItem } from '@/types/dashboard';

interface TopNavProps {
  userName?: string;
  userAvatar?: string;
}

export function TopNav({ userName = 'Sarah', userAvatar }: TopNavProps) {
  const [isDark, setIsDark] = React.useState(true);
  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [addLessonOpen, setAddLessonOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    // In a real app, this would update the theme context/provider
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddLesson = () => {
    // Option 1: Navigate to lessons page
    router.push('/lessons');
    // Option 2: Show dialog (commented out, can be used instead)
    // setAddLessonOpen(true);
  };

  const handleLogout = () => {
    // In a real app, this would call logout API
    console.log('Logging out...');
    router.push('/login');
  };

  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications();
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-busala-bg-nav border-b border-busala-border-subtle"
    >
      <div className="flex items-center justify-between h-full px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-busala-bg-logo flex items-center justify-center">
            <span className="text-busala-gold font-bold text-lg">B</span>
          </div>
          <span className="text-busala-text-primary text-lg font-semibold">Busala</span>
        </Link>

        {/* Center: Navigation Items */}
        <nav className="hidden md:flex items-center gap-1">
          {topNavItems.map((item: NavItem) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  relative px-4 py-2 text-sm font-medium transition-colors rounded-lg
                  ${active
                    ? 'text-busala-text-primary'
                    : 'text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg'
                  }
                `}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-busala-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell with Dropdown */}
          {mounted ? (
            <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-busala-gold rounded-full" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 bg-card border-border text-card-foreground"
            >
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {unreadCount} unread
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-busala-hover-bg focus:bg-busala-hover-bg"
                  >
                    <div className="flex items-start justify-between w-full">
                      <span className="text-sm font-medium">{notification.title}</span>
                      {notification.unread && (
                        <span className="w-2 h-2 bg-busala-gold rounded-full mt-1" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{notification.message}</span>
                    <span className="text-xs text-busala-text-subtle">{notification.time}</span>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="justify-center text-sm text-busala-gold hover:bg-busala-hover-bg focus:bg-busala-hover-bg cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="relative text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-busala-gold rounded-full" />
              )}
            </Button>
          )}

          {/* Add Lesson Button */}
          <Button
            onClick={handleAddLesson}
            className="h-[38px] px-4 text-sm font-medium text-white rounded-full busala-gradient-gold hover:opacity-90 transition-opacity"
            style={{
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>

          {/* User Avatar with Dropdown */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-busala-hover-bg rounded-lg px-2 py-1 transition-colors">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="bg-muted text-foreground text-sm">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-busala-text-muted" />
                </button>
              </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border-border text-card-foreground"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">sarah@busala.com</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="cursor-pointer hover:bg-busala-hover-bg focus:bg-busala-hover-bg"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer hover:bg-busala-hover-bg focus:bg-busala-hover-bg"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer hover:bg-busala-hover-bg focus:bg-busala-hover-bg text-red-400 focus:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button className="flex items-center gap-2 hover:bg-busala-hover-bg rounded-lg px-2 py-1 transition-colors">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-muted text-foreground text-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-busala-text-muted" />
            </button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Add Lesson Dialog (optional, currently navigating instead) */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new lesson for your students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This dialog would contain a form to add a new lesson. For now, it navigates
              to the lessons page.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddLessonOpen(false)}
              className="border-border hover:bg-busala-hover-bg"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAddLessonOpen(false);
                router.push('/lessons');
              }}
              className="busala-gradient-gold text-white"
            >
              Go to Lessons
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
