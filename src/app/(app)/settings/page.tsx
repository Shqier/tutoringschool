'use client';

import React, { useState } from 'react';
import {
  Save,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/app';
import { useSettingsProfile, useUserPreferences, useRoles } from '@/lib/api/hooks';

const BILLING_STATIC = {
  plan: 'Professional',
  status: 'active' as const,
  nextBillingDate: 'March 1, 2025',
  amount: 199,
  currency: 'USD',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', address: '', timezone: '', phone: '', email: '' });

  const { data: profileData, isLoading: profileLoading, error: profileError } = useSettingsProfile();
  const { data: prefsData, isLoading: prefsLoading } = useUserPreferences();
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useRoles();

  React.useEffect(() => {
    if (profileData) {
      setProfile({
        name: profileData.name ?? '',
        address: profileData.address ?? '',
        timezone: profileData.timezone ?? '',
        phone: profileData.phone ?? '',
        email: profileData.email ?? '',
      });
    }
  }, [profileData]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your school settings"
        actionLabel="Save Changes"
        actionIcon={Save}
        onAction={() => console.log('Save settings')}
      />

      {/* School Profile Card */}
      <div className="busala-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-busala-text-primary">School Profile</h2>
            <p className="text-sm text-busala-text-muted">Basic information about your school</p>
          </div>
        </div>

        {profileLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : profileError ? (
          <p className="text-sm text-red-400">Failed to load profile.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-busala-text-muted">School Name</label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-busala-hover-bg border-border text-busala-text-primary placeholder:text-busala-text-subtle focus:border-[#F5A623]/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-busala-text-muted">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
                <Input
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="pl-9 bg-busala-hover-bg border-border text-busala-text-primary placeholder:text-busala-text-subtle focus:border-[#F5A623]/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-busala-text-muted">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="pl-9 bg-busala-hover-bg border-border text-busala-text-primary placeholder:text-busala-text-subtle focus:border-[#F5A623]/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-busala-text-muted">Timezone</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
                <Input
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="pl-9 bg-busala-hover-bg border-border text-busala-text-primary placeholder:text-busala-text-subtle focus:border-[#F5A623]/50"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-busala-text-muted">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
                <Input
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="pl-9 bg-busala-hover-bg border-border text-busala-text-primary placeholder:text-busala-text-subtle focus:border-[#F5A623]/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Card */}
      <div className="busala-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-busala-text-primary">Preferences</h2>
            <p className="text-sm text-busala-text-muted">Language and timezone</p>
          </div>
        </div>

        {prefsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--busala-border-divider)' }}>
              <div>
                <p className="text-sm font-medium text-busala-text-primary">Language</p>
                <p className="text-xs text-busala-text-muted mt-0.5">Interface language</p>
              </div>
              <span className="text-sm text-busala-text-muted">{prefsData?.language ?? 'en'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b-0" style={{ borderColor: 'var(--busala-border-divider)' }}>
              <div>
                <p className="text-sm font-medium text-busala-text-primary">Timezone</p>
                <p className="text-xs text-busala-text-muted mt-0.5">Display and scheduling timezone</p>
              </div>
              <span className="text-sm text-busala-text-muted">{prefsData?.timezone ?? '—'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Roles & Permissions Card */}
      <div className="busala-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-busala-text-primary">Roles & Permissions</h2>
              <p className="text-sm text-busala-text-muted">Manage user roles and access levels</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
          >
            Add Role
          </Button>
        </div>

        {rolesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : rolesError ? (
          <p className="text-sm text-red-400">Failed to load roles.</p>
        ) : (
          <div className="space-y-3">
            {(rolesData?.roles ?? []).map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 rounded-lg bg-busala-hover-bg hover:bg-busala-active-bg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-busala-active-bg flex items-center justify-center">
                    <span className="text-sm font-semibold text-busala-text-primary">
                      {role.role.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-busala-text-primary">{role.role}</p>
                    <p className="text-xs text-busala-text-muted">{role.usersCount} users</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {role.permissions.slice(0, 2).map((perm, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-busala-active-bg text-busala-text-muted text-xs"
                      >
                        {perm}
                      </Badge>
                    ))}
                    {role.permissions.length > 2 && (
                      <Badge
                        variant="secondary"
                        className="bg-busala-active-bg text-busala-text-subtle text-xs"
                      >
                        +{role.permissions.length - 2}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-active-bg"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing Card - static for now */}
      <div className="busala-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-busala-text-primary">Billing & Plan</h2>
              <p className="text-sm text-busala-text-muted">Manage your subscription</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
          >
            Manage Billing
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-busala-hover-bg">
            <p className="text-xs text-busala-text-muted mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-busala-text-primary">{BILLING_STATIC.plan}</p>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                {BILLING_STATIC.status}
              </Badge>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-busala-hover-bg">
            <p className="text-xs text-busala-text-muted mb-1">Monthly Cost</p>
            <p className="text-lg font-semibold text-busala-text-primary">
              ${BILLING_STATIC.amount} <span className="text-sm text-busala-text-muted font-normal">/{BILLING_STATIC.currency}</span>
            </p>
          </div>
          <div className="p-4 rounded-lg bg-busala-hover-bg">
            <p className="text-xs text-busala-text-muted mb-1">Next Billing</p>
            <p className="text-lg font-semibold text-busala-text-primary">{BILLING_STATIC.nextBillingDate}</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg border border-[#F5A623]/20 bg-[#F5A623]/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-busala-text-primary">Upgrade to Enterprise</p>
              <p className="text-xs text-busala-text-muted">Get unlimited users, priority support, and advanced analytics</p>
            </div>
            <Button
              size="sm"
              className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
            >
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
