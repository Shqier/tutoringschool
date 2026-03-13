import { redirect } from 'next/navigation';

/**
 * App root page - redirect to dashboard
 */
export default function AppRootPage() {
  redirect('/dashboard');
}
