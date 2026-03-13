'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  FileText,
  Users,
} from 'lucide-react';

const navItems = [
  {
    href: '/superadmin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/superadmin/tenants',
    label: 'Tenants',
    icon: Building2,
  },
  {
    href: '/superadmin/plans',
    label: 'Plans',
    icon: CreditCard,
  },
  {
    href: '/superadmin/users',
    label: 'Users',
    icon: Users,
  },
  {
    href: '/superadmin/audit-logs',
    label: 'Audit Logs',
    icon: FileText,
  },
  {
    href: '/superadmin/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[240px] bg-slate-900 border-r border-slate-800">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
