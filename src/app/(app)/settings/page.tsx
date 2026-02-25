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
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PageHeader,
  ConfirmDialog,
} from '@/components/app';
import {
  schoolProfile as initialSchoolProfile,
  preferences as initialPreferences,
  rolePermissions as initialRolePermissions,
  billingInfo as initialBillingInfo,
} from '@/data/mock-data';
import type { RolePermission } from '@/types/dashboard';

const AVAILABLE_PERMISSIONS = [
  'All Access',
  'View Classes',
  'Mark Attendance',
  'View Students',
  'Manage Schedule',
  'View Reports',
  'Manage Rooms',
  'View Schedule',
  'Register Students',
  'Handle Payments',
  'Manage Teachers',
  'Manage Groups',
  'Manage Billing',
  'System Settings',
];

export default function SettingsPage() {
  const [profile, setProfile] = useState(initialSchoolProfile);
  const [prefs, setPrefs] = useState(initialPreferences);
  const [roles, setRoles] = useState(initialRolePermissions);
  const [billing] = useState(initialBillingInfo);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Role dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null);
  const [roleName, setRoleName] = useState('');
  const [rolePermissionsList, setRolePermissionsList] = useState<string[]>([]);
  const [roleUsersCount, setRoleUsersCount] = useState(0);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RolePermission | null>(null);

  // Billing dialog state
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);

  // Permission picker
  const [permissionToAdd, setPermissionToAdd] = useState('');

  const markChanged = () => setHasChanges(true);

  const handlePreferenceToggle = (id: string) => {
    setPrefs(prefs.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
    markChanged();
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaving(false);
    setHasChanges(false);
    toast.success('Settings saved successfully');
  };

  // Role CRUD handlers
  const handleAddRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRolePermissionsList([]);
    setRoleUsersCount(0);
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: RolePermission) => {
    setEditingRole(role);
    setRoleName(role.role);
    setRolePermissionsList([...role.permissions]);
    setRoleUsersCount(role.usersCount);
    setRoleDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }
    if (rolePermissionsList.length === 0) {
      toast.error('At least one permission is required');
      return;
    }

    if (editingRole) {
      setRoles(roles.map(r =>
        r.id === editingRole.id
          ? { ...r, role: roleName.trim(), permissions: rolePermissionsList, usersCount: roleUsersCount }
          : r
      ));
      toast.success(`Role "${roleName}" updated`);
    } else {
      const newRole: RolePermission = {
        id: String(Date.now()),
        role: roleName.trim(),
        permissions: rolePermissionsList,
        usersCount: roleUsersCount,
      };
      setRoles([...roles, newRole]);
      toast.success(`Role "${roleName}" created`);
    }
    setRoleDialogOpen(false);
    markChanged();
  };

  const handleDeleteRole = (role: RolePermission) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteRole = () => {
    if (!roleToDelete) return;
    setRoles(roles.filter(r => r.id !== roleToDelete.id));
    toast.success(`Role "${roleToDelete.role}" deleted`);
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
    markChanged();
  };

  const addPermission = () => {
    if (permissionToAdd && !rolePermissionsList.includes(permissionToAdd)) {
      setRolePermissionsList([...rolePermissionsList, permissionToAdd]);
      setPermissionToAdd('');
    }
  };

  const removePermission = (perm: string) => {
    setRolePermissionsList(rolePermissionsList.filter(p => p !== perm));
  };

  const availablePermsForPicker = AVAILABLE_PERMISSIONS.filter(
    p => !rolePermissionsList.includes(p)
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your school settings"
        actionLabel={saving ? 'Saving...' : 'Save Changes'}
        actionIcon={saving ? Loader2 : Save}
        onAction={handleSave}
      >
        {hasChanges && (
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
            Unsaved changes
          </Badge>
        )}
      </PageHeader>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-busala-text-muted">School Name</label>
            <Input
              value={profile.name}
              onChange={(e) => { setProfile({ ...profile, name: e.target.value }); markChanged(); }}
              className="bg-busala-hover-bg border-border text-busala-text-primary placeholder:text-busala-text-subtle focus:border-[#F5A623]/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-busala-text-muted">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
              <Input
                value={profile.email}
                onChange={(e) => { setProfile({ ...profile, email: e.target.value }); markChanged(); }}
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
                onChange={(e) => { setProfile({ ...profile, phone: e.target.value }); markChanged(); }}
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
                onChange={(e) => { setProfile({ ...profile, timezone: e.target.value }); markChanged(); }}
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
                onChange={(e) => { setProfile({ ...profile, address: e.target.value }); markChanged(); }}
                className="pl-9 bg-busala-hover-bg border-border text-busala-text-primary placeholder:text-busala-text-subtle focus:border-[#F5A623]/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="busala-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-busala-text-primary">Preferences</h2>
            <p className="text-sm text-busala-text-muted">Configure notifications and features</p>
          </div>
        </div>

        <div className="space-y-4">
          {prefs.map((pref) => (
            <div
              key={pref.id}
              className="flex items-center justify-between py-3 border-b last:border-0"
              style={{ borderColor: 'var(--busala-border-divider)' }}
            >
              <div>
                <p className="text-sm font-medium text-busala-text-primary">{pref.label}</p>
                {pref.description && (
                  <p className="text-xs text-busala-text-muted mt-0.5">{pref.description}</p>
                )}
              </div>
              <Switch
                checked={pref.enabled}
                onCheckedChange={() => handlePreferenceToggle(pref.id)}
              />
            </div>
          ))}
        </div>
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
            onClick={handleAddRole}
            className="bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Role
          </Button>
        </div>

        <div className="space-y-3">
          {roles.length === 0 ? (
            <div className="text-center py-8 text-busala-text-muted text-sm">
              No roles defined. Click &quot;Add Role&quot; to create one.
            </div>
          ) : (
            roles.map((role) => (
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
                    onClick={() => handleEditRole(role)}
                    className="text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-active-bg"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRole(role)}
                    className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Billing Card */}
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
            onClick={() => setBillingDialogOpen(true)}
            className="bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
          >
            Manage Billing
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-busala-hover-bg">
            <p className="text-xs text-busala-text-muted mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-busala-text-primary">{billing.plan}</p>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                {billing.status}
              </Badge>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-busala-hover-bg">
            <p className="text-xs text-busala-text-muted mb-1">Monthly Cost</p>
            <p className="text-lg font-semibold text-busala-text-primary">
              ${billing.amount} <span className="text-sm text-busala-text-muted font-normal">/{billing.currency}</span>
            </p>
          </div>
          <div className="p-4 rounded-lg bg-busala-hover-bg">
            <p className="text-xs text-busala-text-muted mb-1">Next Billing</p>
            <p className="text-lg font-semibold text-busala-text-primary">{billing.nextBillingDate}</p>
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
              onClick={() => toast.info('Contact sales@busala.com for Enterprise pricing')}
              className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
            >
              Upgrade
            </Button>
          </div>
        </div>
      </div>

      {/* Role Add/Edit Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {editingRole
                ? `Update permissions for the "${editingRole.role}" role.`
                : 'Define a new role with specific permissions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/80">Role Name</Label>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., Coordinator"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#F5A623]/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Users Count</Label>
              <Input
                type="number"
                min={0}
                value={roleUsersCount}
                onChange={(e) => setRoleUsersCount(parseInt(e.target.value) || 0)}
                className="bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Permissions</Label>
              <div className="flex gap-2">
                <Select value={permissionToAdd} onValueChange={setPermissionToAdd}>
                  <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white focus:border-[#F5A623]/50">
                    <SelectValue placeholder="Select permission..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14171C] border-white/10">
                    {availablePermsForPicker.map((perm) => (
                      <SelectItem
                        key={perm}
                        value={perm}
                        className="text-white/80 focus:bg-white/5 focus:text-white"
                      >
                        {perm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addPermission}
                  disabled={!permissionToAdd}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {rolePermissionsList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {rolePermissionsList.map((perm) => (
                    <Badge
                      key={perm}
                      className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2 py-1 flex items-center gap-1"
                    >
                      {perm}
                      <button
                        type="button"
                        onClick={() => removePermission(perm)}
                        className="hover:text-red-400 transition-colors ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {rolePermissionsList.length === 0 && (
                <p className="text-xs text-white/40 mt-1">No permissions added yet</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              className="busala-gradient-gold text-[#0B0D10] hover:opacity-90"
            >
              <Check className="h-4 w-4 mr-2" />
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Role"
        description={`Are you sure you want to delete the "${roleToDelete?.role}" role? This will remove it from ${roleToDelete?.usersCount || 0} users.`}
        confirmLabel="Delete Role"
        variant="danger"
        onConfirm={handleConfirmDeleteRole}
      />

      {/* Billing Dialog */}
      <Dialog open={billingDialogOpen} onOpenChange={setBillingDialogOpen}>
        <DialogContent className="bg-[#14171C] border-white/10 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Manage Billing
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Your current subscription details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">Plan</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {billing.plan}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">Amount</span>
                <span className="text-sm font-medium text-white">${billing.amount}/{billing.currency}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">Status</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs capitalize">
                  {billing.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Next Billing</span>
                <span className="text-sm font-medium text-white">{billing.nextBillingDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white justify-start"
                onClick={() => { setBillingDialogOpen(false); toast.info('Payment method management coming soon'); }}
              >
                <CreditCard className="h-4 w-4 mr-2 text-blue-400" />
                Update Payment Method
              </Button>
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white justify-start"
                onClick={() => { setBillingDialogOpen(false); toast.info('Invoice history coming soon'); }}
              >
                <Mail className="h-4 w-4 mr-2 text-[#F5A623]" />
                View Invoice History
              </Button>
              <Button
                variant="outline"
                className="w-full bg-white/5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 justify-start"
                onClick={() => { setBillingDialogOpen(false); toast.error('Please contact support to cancel your subscription'); }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBillingDialogOpen(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
