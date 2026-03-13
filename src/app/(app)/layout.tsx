import { AppShell } from '@/components/app';
import { getTenantFromRequest } from '@/lib/tenant/server';
import { headers } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get tenant info from headers/subdomain
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const tenant = await getTenantFromRequest(host);

  return (
    <AppShell 
      tenantName={tenant?.name || 'ClassHub'}
      tenantLogo={tenant?.logoUrl}
    >
      {children}
    </AppShell>
  );
}
