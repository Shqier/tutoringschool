'use client';

import React, { useState, useEffect, use } from 'react';
import { ArrowLeft, Mail, Phone, Building2, Briefcase, StickyNote, Plus, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SkeletonDetailCard, EmptyState } from '@/components/app';
import { ContactDrawer } from '@/components/contacts/ContactDrawer';
import { getContact } from '@/components/contacts/api';
import type { ContactWithActivities, ContactActivity } from '@/components/contacts/types';

const ACTIVITY_ICONS: Record<string, string> = {
  note: '📝',
  call: '📞',
  email: '📧',
  meeting: '🤝',
};

const ACTIVITY_COLORS: Record<string, string> = {
  note: '#6366f1',
  call: '#22c55e',
  email: '#3b82f6',
  meeting: '#F5A623',
};

function ActivityItem({ activity }: { activity: ContactActivity }) {
  const icon = ACTIVITY_ICONS[activity.type] || '📌';
  const color = ACTIVITY_COLORS[activity.type] || '#F5A623';

  return (
    <div className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--busala-border-divider)' }}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
        style={{ background: `${color}22` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-busala-text-primary">{activity.title}</p>
        {activity.notes && (
          <p className="text-sm text-busala-text-muted mt-0.5 whitespace-pre-wrap">{activity.notes}</p>
        )}
        <p className="text-xs text-busala-text-subtle mt-1 capitalize">
          {activity.type} · {new Date(activity.createdAt).toLocaleDateString()}
        </p>
      </div>
      {activity.completedAt && (
        <span className="text-xs text-green-400 shrink-0 mt-1">Done</span>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactWithActivities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getContact(id);
      setContact(data);
    } catch {
      toast.error('Failed to load contact');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <SkeletonDetailCard />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState title="Contact not found" description="This contact may have been deleted" />
        <div className="flex justify-center mt-4">
          <Link href="/contacts">
            <Button variant="outline" className="border-busala-border-divider text-busala-text-muted">
              Back to Contacts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-busala-text-subtle hover:text-busala-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Contacts
      </Link>

      {/* Contact card */}
      <div className="busala-card p-5 space-y-5">
        {/* Avatar + name row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{ background: 'var(--busala-gradient-gold)', color: '#0B0D10' }}
            >
              {getInitials(contact.fullName)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-busala-text-primary">{contact.fullName}</h1>
              {contact.title && (
                <p className="text-sm text-busala-text-subtle mt-0.5">{contact.title}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            className="h-8 px-3 text-xs border-busala-border-divider text-busala-text-muted hover:text-busala-text-primary shrink-0"
          >
            <Edit2 className="h-3 w-3 mr-1.5" />
            Edit
          </Button>
        </div>

        {/* Details */}
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--busala-border-divider)' }}>
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-busala-text-subtle shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-busala-primary hover:underline"
              >
                {contact.email}
              </a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-busala-text-subtle shrink-0" />
              <span className="text-sm text-busala-text-primary">{contact.phone}</span>
            </div>
          )}
          {contact.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-busala-text-subtle shrink-0" />
              <Link
                href={`/companies?q=${encodeURIComponent(contact.company)}`}
                className="text-sm text-busala-primary hover:underline"
              >
                {contact.company}
              </Link>
            </div>
          )}
          {contact.notes && (
            <div className="flex items-start gap-3 pt-1">
              <StickyNote className="h-4 w-4 text-busala-text-subtle shrink-0 mt-0.5" />
              <p className="text-sm text-busala-text-muted whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex gap-6 pt-2 border-t text-xs text-busala-text-subtle" style={{ borderColor: 'var(--busala-border-divider)' }}>
          <span>Added {new Date(contact.createdAt).toLocaleDateString()}</span>
          <span>{contact._count?.activities ?? contact.activities.length} activities</span>
        </div>
      </div>

      {/* Activities */}
      <div className="busala-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-busala-text-primary">Activity History</h2>
          <Link href={`/deals`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-busala-text-subtle hover:text-busala-text-primary"
            >
              <Plus className="h-3 w-3 mr-1" />
              Log activity
            </Button>
          </Link>
        </div>

        {contact.activities.length === 0 ? (
          <p className="text-sm text-busala-text-subtle text-center py-6">
            No activities yet
          </p>
        ) : (
          <div>
            {contact.activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      <ContactDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode="edit"
        contact={contact}
        onSuccess={load}
      />
    </div>
  );
}
