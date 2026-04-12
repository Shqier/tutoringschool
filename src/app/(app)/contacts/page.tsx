'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, Building2, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/app';
import { EmptyState } from '@/components/app';
import { SkeletonTable } from '@/components/app';
import { ContactDrawer } from '@/components/contacts/ContactDrawer';
import { getContacts } from '@/components/contacts/api';
import type { Contact } from '@/components/contacts/types';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'fullName', label: 'Name A–Z' },
  { value: 'company', label: 'Company' },
  { value: 'updatedAt', label: 'Recently Updated' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');

  const limit = 20;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getContacts({ q: search || undefined, sortBy, page, limit });
      setContacts(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, [search, sortBy, page]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setSelectedContact(null);
    setDrawerMode('create');
    setDrawerOpen(true);
  };

  const openView = (contact: Contact) => {
    setSelectedContact(contact);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        subtitle={total > 0 ? `${total} contact${total !== 1 ? 's' : ''}` : undefined}
        actionLabel="New Contact"
        actionIcon={Plus}
        onAction={openCreate}
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="busala-input pl-9"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="busala-input h-11 px-3 text-sm text-busala-text-primary bg-transparent border rounded-lg cursor-pointer appearance-none min-w-[140px]"
          style={{ borderColor: 'var(--busala-border-subtle)', background: 'var(--busala-card-bg)' }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No contacts match your search' : 'No contacts yet'}
          description={
            search
              ? 'Try a different search term'
              : 'Add your first contact to get started'
          }
          actionLabel={!search ? 'Add Contact' : undefined}
          actionIcon={Plus}
          onAction={!search ? openCreate : undefined}
        />
      ) : (
        <div className="busala-card overflow-hidden">
          {/* Table header */}
          <div
            className="hidden md:grid grid-cols-[1fr_180px_180px_100px] gap-4 px-4 h-10 items-center border-b text-xs text-busala-text-subtle font-medium uppercase tracking-wide"
            style={{ borderColor: 'var(--busala-border-divider)' }}
          >
            <span>Name</span>
            <span>Company</span>
            <span>Email</span>
            <span>Activities</span>
          </div>

          {/* Rows */}
          {contacts.map((contact, idx) => (
            <button
              key={contact.id}
              onClick={() => openView(contact)}
              className="w-full text-left flex flex-col md:grid md:grid-cols-[1fr_180px_180px_100px] gap-2 md:gap-4 px-4 py-3 md:h-14 md:items-center hover:bg-busala-hover-bg transition-colors border-b last:border-0 cursor-pointer"
              style={{ borderColor: 'var(--busala-border-divider)' }}
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{
                    background: 'var(--busala-gradient-gold)',
                    color: '#0B0D10',
                  }}
                >
                  {getInitials(contact.fullName)}
                </div>
                <div>
                  <p className="text-sm font-medium text-busala-text-primary leading-tight">
                    {contact.fullName}
                  </p>
                  {contact.title && (
                    <p className="text-xs text-busala-text-subtle">{contact.title}</p>
                  )}
                </div>
              </div>

              {/* Company */}
              <div className="flex items-center gap-1.5 text-sm text-busala-text-muted md:block">
                {contact.company ? (
                  <>
                    <Building2 className="h-3.5 w-3.5 md:hidden shrink-0 text-busala-text-subtle" />
                    <span>{contact.company}</span>
                  </>
                ) : (
                  <span className="text-busala-text-subtle">—</span>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-1.5 text-sm text-busala-text-muted md:block overflow-hidden">
                {contact.email ? (
                  <>
                    <Mail className="h-3.5 w-3.5 md:hidden shrink-0 text-busala-text-subtle" />
                    <span className="truncate">{contact.email}</span>
                  </>
                ) : (
                  <span className="text-busala-text-subtle">—</span>
                )}
              </div>

              {/* Activity count */}
              <div className="text-sm text-busala-text-muted">
                {contact._count?.activities ?? 0}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-busala-border-divider text-busala-text-muted"
          >
            Previous
          </Button>
          <span className="text-sm text-busala-text-subtle">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-busala-border-divider text-busala-text-muted"
          >
            Next
          </Button>
        </div>
      )}

      <ContactDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        contact={selectedContact}
        onSuccess={load}
      />
    </div>
  );
}
