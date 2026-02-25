'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  Save,
  Camera,
  Key,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/app';

export default function ProfilePage() {
  const [name, setName] = useState('Sarah Admin');
  const [email, setEmail] = useState('sarah@busala.com');
  const [phone, setPhone] = useState('+1 234 567 8900');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSave = () => {
    toast.success('Profile updated successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Profile"
        subtitle="Manage your personal information"
        actionLabel="Save Changes"
        actionIcon={Save}
        onAction={handleSave}
      />

      {/* Profile Header Card */}
      <div className="busala-card p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-[#F5A623]/20 text-[#F5A623] text-2xl font-semibold">
                S
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#F5A623] flex items-center justify-center hover:opacity-90 transition-opacity">
              <Camera className="h-3.5 w-3.5 text-[#0B0D10]" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-busala-text-primary">{name}</h2>
            <p className="text-sm text-busala-text-muted">{email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                Active
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-busala-text-subtle flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" />
              Member since Jan 2026
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="busala-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
            <User className="h-5 w-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-busala-text-primary">Personal Information</h2>
            <p className="text-sm text-busala-text-muted">Update your personal details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-busala-text-muted">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-busala-hover-bg border-border text-busala-text-primary focus:border-[#F5A623]/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-busala-text-muted">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-busala-hover-bg border-border text-busala-text-primary focus:border-[#F5A623]/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-busala-text-muted">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 bg-busala-hover-bg border-border text-busala-text-primary focus:border-[#F5A623]/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-busala-text-muted">Role</label>
            <Input
              value="Admin"
              disabled
              className="bg-busala-hover-bg border-border text-busala-text-subtle cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="busala-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-busala-text-primary">Security</h2>
            <p className="text-sm text-busala-text-muted">Manage your password and security settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-busala-hover-bg">
            <div>
              <p className="text-sm font-medium text-busala-text-primary">Password</p>
              <p className="text-xs text-busala-text-muted">Last changed 30 days ago</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-busala-active-bg border-border text-busala-text-primary hover:bg-busala-hover-bg hover:text-busala-text-primary"
            >
              Change Password
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-busala-hover-bg">
            <div>
              <p className="text-sm font-medium text-busala-text-primary">Two-Factor Authentication</p>
              <p className="text-xs text-busala-text-muted">Add an extra layer of security</p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
              Not Enabled
            </Badge>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="busala-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-busala-text-primary">Notification Preferences</h2>
            <p className="text-sm text-busala-text-muted">Choose how you want to be notified</p>
          </div>
        </div>

        <div className="space-y-1">
          <div
            className="flex items-center justify-between py-4 border-b"
            style={{ borderColor: 'var(--busala-border-divider)' }}
          >
            <div>
              <p className="text-sm font-medium text-busala-text-primary">Email Notifications</p>
              <p className="text-xs text-busala-text-muted">Receive updates via email</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div
            className="flex items-center justify-between py-4 border-b"
            style={{ borderColor: 'var(--busala-border-divider)' }}
          >
            <div>
              <p className="text-sm font-medium text-busala-text-primary">Push Notifications</p>
              <p className="text-xs text-busala-text-muted">Receive browser push notifications</p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-busala-text-primary">Weekly Digest</p>
              <p className="text-xs text-busala-text-muted">Get a weekly summary of activity</p>
            </div>
            <Switch
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
            />
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="busala-card p-6">
        <h2 className="text-base font-semibold text-busala-text-primary mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { action: 'Updated teacher availability', time: '2 hours ago', icon: '📝' },
            { action: 'Created new lesson: Arabic Intermediate B2', time: '5 hours ago', icon: '📚' },
            { action: 'Approved room change request', time: '1 day ago', icon: '✅' },
            { action: 'Added new student: Fatima Hassan', time: '2 days ago', icon: '👤' },
            { action: 'Updated school profile settings', time: '3 days ago', icon: '⚙️' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 py-2"
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm text-busala-text-primary">{item.action}</p>
              </div>
              <span className="text-xs text-busala-text-subtle">{item.time}</span>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <button className="text-sm text-[#F5A623] hover:underline">
          View full activity log
        </button>
      </div>
    </div>
  );
}
