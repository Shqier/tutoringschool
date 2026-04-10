'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Plus,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
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
import { topNavItems } from '@/config/navigation';
import { useMe } from '@/lib/api/hooks';
import type { NavItem } from '@/config/navigation';

interface TopNavProps {
  userName?: string;
  userAvatar?: string;
  onMenuToggle?: () => void;
}

export function TopNav({ userName: userNameProp, userAvatar, onMenuToggle }: TopNavProps) {
  const { data: meData } = useMe();
  const userName = userNameProp ?? meData?.user?.name ?? 'User';
  const userEmail = meData?.user?.email ?? '';
  const [isDark, setIsDark] = React.useState(true);
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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-busala-bg-nav border-b border-busala-border-subtle"
    >
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* Left: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="md:hidden h-11 w-11 text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-busala-bg-logo flex items-center justify-center">
              <span className="text-busala-gold font-bold text-lg">B</span>
            </div>
            <span className="text-busala-text-primary text-lg font-semibold">Busala</span>
          </Link>
        </div>

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
          {/* Notification Center */}
          {mounted && <NotificationCenter />}

          {/* Add Lesson Button */}
          <Button
            onClick={handleAddLesson}
            className="h-[44px] w-[44px] md:h-[38px] md:w-auto md:px-4 text-sm font-medium text-white rounded-full busala-gradient-gold hover:opacity-90 transition-opacity"
            style={{
              boxShadow: '0 4px 12px rgba(245, 166, 35, 0.3)',
            }}
          >
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Add Lesson</span>
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
                  <span className="text-xs text-muted-foreground">{userEmail || '—'}</span>
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
