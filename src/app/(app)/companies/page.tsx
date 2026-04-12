'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Building2, Users } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/app';
import { EmptyState } from '@/components/app';
import { SkeletonTable } from '@/components/app';

interface CompanyPreviewContact {
  id: string;
  fullName: string;
  email?: string | null;
  title?: string | null;
}

interface CompanySummary {
  name: string;
  contactCount: number;
  contacts: CompanyPreviewContact[];
}

const DEFAULT_HEADERS = {
  'x-user-role': 'admin',
  'x-user-id': 'user_001',
  'x-org-id': 'org_busala_default',
};

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = search ? `?q=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/companies${qs}`, { headers: DEFAULT_HEADERS });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'Failed');
      setCompanies(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        subtitle={total > 0 ? `${total} company${total !== 1 ? 'ies' : ''}` : undefined}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="busala-input pl-9"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'No companies match your search' : 'No companies yet'}
          description={
            search
              ? 'Try a different search term'
              : 'Companies are created automatically when you add contacts with a company name'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.name}
              href={`/companies/${encodeURIComponent(company.name)}`}
              className="busala-card p-4 block hover:bg-busala-hover-bg transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Logo placeholder */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}
                >
                  {getInitials(company.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-busala-text-primary group-hover:text-busala-primary transition-colors truncate">
                    {company.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1 text-xs text-busala-text-subtle">
                    <Users className="h-3 w-3" />
                    <span>
                      {company.contactCount} contact{company.contactCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact previews */}
              {company.contacts.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--busala-border-divider)' }}>
                  {company.contacts.slice(0, 2).map((c) => (
                    <div key={c.id} className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                        style={{ background: 'var(--busala-gradient-gold)', color: '#0B0D10' }}
                      >
                        {c.fullName[0]}
                      </div>
                      <span className="text-xs text-busala-text-muted truncate">
                        {c.fullName}
                        {c.title && ` · ${c.title}`}
                      </span>
                    </div>
                  ))}
                  {company.contactCount > 2 && (
                    <p className="text-xs text-busala-text-subtle pl-7">
                      +{company.contactCount - 2} more
                    </p>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
