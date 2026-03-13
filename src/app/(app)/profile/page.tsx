'use client';

import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/app';
import { AvatarUrlField } from '@/components/profile';
import { useMe, useUserPreferences, useUpdateMe, useChangePassword, useUpdateUserPreferences } from '@/lib/api/hooks';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'Hebrew' },
  { value: 'ar', label: 'Arabic' },
];

const TIMEZONES = [
  { value: 'Asia/Jerusalem', label: 'Asia/Jerusalem' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Europe/London', label: 'Europe/London' },
];

export default function ProfilePage() {
  const { data: meData, refetch: refetchMe } = useMe();
  const { data: prefsData, refetch: refetchPrefs } = useUserPreferences();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();
  const updatePrefs = useUpdateUserPreferences();

  const user = meData?.user;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Jerusalem');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    lessonReminders: true,
    approvalRequests: true,
  });
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [user]);

  useEffect(() => {
    if (prefsData) {
      setLanguage(prefsData.language ?? 'en');
      setTimezone(prefsData.timezone ?? 'Asia/Jerusalem');
      if (prefsData.notifications && typeof prefsData.notifications === 'object') {
        setNotifications((n) => ({ ...n, ...(prefsData.notifications as Record<string, boolean>) }));
      }
    }
  }, [prefsData]);

  const handleSaveProfile = async () => {
    try {
      await updateMe.mutate({
        body: { name: name || undefined, email: email || undefined, phone: phone || null, avatarUrl: avatarUrl || null },
      });
      refetchMe();
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save profile');
    }
  };

  const handleSaveAvatarUrl = async (url: string) => {
    try {
      await updateMe.mutate({ body: { avatarUrl: url || null } });
      setAvatarUrl(url || null);
      refetchMe();
      toast.success('Avatar URL saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save avatar');
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword.mutate({
        body: { currentPassword: passwordCurrent, newPassword: passwordNew, confirmPassword: passwordConfirm },
      });
      toast.success('Password changed');
    } catch (e: unknown) {
      const err = e as { statusCode?: number };
      if (err?.statusCode === 501) {
        toast.error('Password change is not available in dev mode.');
      } else {
        toast.error(e instanceof Error ? e.message : 'Failed to change password');
      }
    }
  };

  const handleSavePreferences = async () => {
    try {
      await updatePrefs.mutate({
        body: { language, timezone, notifications },
      });
      refetchPrefs();
      toast.success('Preferences saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save preferences');
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 bg-busala-hover-bg rounded animate-pulse" />
        <div className="h-64 w-full bg-busala-hover-bg rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your account"
        actionLabel="Save changes"
        actionIcon={Save}
        onAction={handleSaveProfile}
      />

      <Card className="busala-card">
        <CardHeader>
          <CardTitle className="text-base">Personal info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUrlField currentUrl={avatarUrl} onSave={handleSaveAvatarUrl} loading={updateMe.isLoading} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-busala-hover-bg border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-busala-hover-bg border-border" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className="bg-busala-hover-bg border-border" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="busala-card">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <p className="text-sm text-busala-text-muted">Change password (not available in dev mode)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" value={passwordCurrent} onChange={(e) => setPasswordCurrent(e.target.value)} placeholder="••••••••" className="bg-busala-hover-bg border-border" disabled />
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" value={passwordNew} onChange={(e) => setPasswordNew(e.target.value)} placeholder="••••••••" className="bg-busala-hover-bg border-border" disabled />
          </div>
          <div className="space-y-2">
            <Label>Confirm new password</Label>
            <Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="••••••••" className="bg-busala-hover-bg border-border" disabled />
          </div>
          <Button variant="outline" onClick={handleChangePassword} disabled>
            Change password (dev mode)
          </Button>
        </CardContent>
      </Card>

      <Card className="busala-card">
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-busala-hover-bg border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-busala-hover-bg border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSavePreferences} disabled={updatePrefs.isLoading} className="busala-gradient-gold text-[#0B0D10]">
            Save preferences
          </Button>
        </CardContent>
      </Card>

      <Card className="busala-card">
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email notifications</p>
              <p className="text-sm text-busala-text-muted">Receive updates by email</p>
            </div>
            <Switch checked={notifications.email} onCheckedChange={(v) => setNotifications((n) => ({ ...n, email: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS notifications</p>
              <p className="text-sm text-busala-text-muted">Receive SMS alerts</p>
            </div>
            <Switch checked={notifications.sms} onCheckedChange={(v) => setNotifications((n) => ({ ...n, sms: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Lesson reminders</p>
              <p className="text-sm text-busala-text-muted">Remind before lessons</p>
            </div>
            <Switch checked={notifications.lessonReminders} onCheckedChange={(v) => setNotifications((n) => ({ ...n, lessonReminders: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Approval requests</p>
              <p className="text-sm text-busala-text-muted">Notify on approval requests</p>
            </div>
            <Switch checked={notifications.approvalRequests} onCheckedChange={(v) => setNotifications((n) => ({ ...n, approvalRequests: v }))} />
          </div>
          <Button variant="outline" onClick={handleSavePreferences} disabled={updatePrefs.isLoading}>
            Save notification settings
          </Button>
        </CardContent>
      </Card>

      <Card className="busala-card border-red-500/20">
        <CardHeader>
          <CardTitle className="text-base text-red-400">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" disabled>
            Delete account (not implemented)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
