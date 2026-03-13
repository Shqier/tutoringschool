// ============================================
// SUPER ADMIN LAYOUT
// ============================================

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SuperAdminSidebar } from '@/components/superadmin/Sidebar';
import { SuperAdminHeader } from '@/components/superadmin/Header';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

async function getSuperAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('superadminSession');
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export default async function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const session = await getSuperAdminSession();
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/superadmin/login');
  }
  
  return (
    <div className="min-h-screen bg-slate-950">
      <SuperAdminHeader user={session.user} />
      <div className="flex">
        <SuperAdminSidebar />
        <main className="flex-1 p-6 ml-[240px] mt-16">
          {children}
        </main>
      </div>
    </div>
  );
}
