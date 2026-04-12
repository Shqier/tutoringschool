'use client';

import React, { useState, useEffect, use } from 'react';
import { ArrowLeft, Users, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { SkeletonDetailCard, EmptyState } from '@/components/app';

interface ContactSummary {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  _count?: { activities: number };
}

interface CompanyDetail {
  name: string;
  contactCount: number;
  contacts: ContactSummary[];
}

const DEFAULT_HEADERS = {
  'x-user-role': 'admin',
  'x-user-id': 'user_001',
  'x-org-id': 'org_busala_default',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const companyName = decodeURIComponent(id);

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/companies/${encodeURIComponent(companyName)}`, {
          headers: DEFAULT_HEADERS,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error?.message || 'Not found');
        setCompany(data);
      } catch {
        toast.error('Failed to load company');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [companyName]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <SkeletonDetailCard />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState title="Company not found" description="No contacts are linked to this company" />
        <div className="flex justify-center mt-4">
          <Link href="/companies">
            <button className="text-sm text-busala-text-subtle hover:text-busala-text-primary transition-colors">
              ← Back to Companies
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-busala-text-subtle hover:text-busala-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Companies
      </Link>

      {/* Company card */}
      <div className="busala-card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}
          >
            {company.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-busala-text-primary">{company.name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-busala-text-subtle">
              <Users className="h-4 w-4" />
              <span>{company.contactCount} contact{company.contactCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts list */}
      <div className="busala-card p-5">
        <h2 className="text-sm font-semibold text-busala-text-primary mb-4">
          Contacts at {company.name}
        </h2>

        {company.contacts.length === 0 ? (
          <p className="text-sm text-busala-text-subtle text-center py-6">No contacts found</p>
        ) : (
          <div className="space-y-1">
            {company.contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-busala-hover-bg transition-colors group"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: 'var(--busala-gradient-gold)', color: '#0B0D10' }}
                >
                  {getInitials(contact.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-busala-text-primary group-hover:text-busala-primary transition-colors">
                    {contact.fullName}
                  </p>
                  {contact.title && (
                    <p className="text-xs text-busala-text-subtle">{contact.title}</p>
                  )}
                </div>
                {contact.email && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-busala-text-muted">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[180px]">{contact.email}</span>
                  </div>
                )}
                {contact._count && (
                  <span className="text-xs text-busala-text-subtle shrink-0">
                    {contact._count.activities} act.
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
