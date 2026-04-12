// ============================================
// NAVIGATION CONFIG
// Static nav items – not from API
// ============================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number;
  isActive?: boolean;
}

export const topNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { id: 'teachers', label: 'Teachers', href: '/teachers', icon: 'Users' },
  { id: 'students', label: 'Students', href: '/students', icon: 'GraduationCap' },
  { id: 'groups', label: 'Groups', href: '/groups', icon: 'Users2' },
  { id: 'rooms', label: 'Rooms', href: '/rooms', icon: 'DoorOpen' },
  { id: 'scheduling', label: 'Scheduling', href: '/scheduling', icon: 'Calendar' },
];

export const sidebarNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { id: 'groups', label: 'Groups', href: '/groups', icon: 'Users2' },
  { id: 'lessons', label: 'Lessons', href: '/lessons', icon: 'BookOpen' },
  { id: 'attendance', label: 'Attendance', href: '/attendance', icon: 'ClipboardCheck' },
  { id: 'teachers', label: 'Teachers', href: '/teachers', icon: 'Users' },
  { id: 'teacher-availability', label: 'Availability', href: '/teacher-availability', icon: 'Clock' },
  { id: 'students', label: 'Students', href: '/students', icon: 'GraduationCap' },
  { id: 'payments', label: 'Payments', href: '/payments', icon: 'CreditCard' },
  { id: 'contacts', label: 'Contacts', href: '/contacts', icon: 'UserRound' },
  { id: 'companies', label: 'Companies', href: '/companies', icon: 'Building2' },
  { id: 'deals', label: 'Deals', href: '/deals', icon: 'Kanban' },
  { id: 'rooms', label: 'Rooms', href: '/rooms', icon: 'DoorOpen' },
  { id: 'approvals', label: 'Approvals', href: '/approvals', icon: 'ClipboardCheck' },
];

export const sidebarBottomItems: NavItem[] = [
  { id: 'profile', label: 'My Profile', href: '/profile', icon: 'User' },
  { id: 'team', label: 'Team', href: '/settings/team', icon: 'Users' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings' },
];
