import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/marketing/LandingPage';

/**
 * Root page - acts as entry point
 * - Authenticated users → redirect to dashboard
 * - Visitors → show landing page
 */
export default async function RootPage() {
  // Check for session cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('appSession');
  
  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session.user) {
        // User is authenticated, redirect to dashboard
        redirect('/dashboard');
      }
    } catch {
      // Invalid session, show landing page
    }
  }
  
  // Show landing page for visitors
  return <LandingPage />;
}
