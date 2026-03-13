'use client';

import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Shield } from 'lucide-react';

interface SuperAdminHeaderProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function SuperAdminHeader({ user }: SuperAdminHeaderProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/superadmin/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-slate-950 font-bold text-lg">B</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">ClassHub</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Super Admin
            </span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border border-slate-700">
                  <AvatarFallback className="bg-slate-800 text-slate-300 text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800" align="end">
              <div className="flex items-center gap-2 p-2">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <Shield className="mr-2 h-4 w-4" />
                {user.role}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem 
                className="text-red-400 focus:bg-slate-800 focus:text-red-400"
                onClick={() => {
                  fetch('/api/superadmin/auth/logout', { method: 'POST' })
                    .then(() => window.location.href = '/superadmin/login');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
