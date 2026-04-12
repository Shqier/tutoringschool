'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MoreVertical, Mail, Shield, UserMinus, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog, PageHeader, DataTableShell, DataTableRow, EmptyState } from '@/components/app';

// ---- Types ----

interface TeamMember {
  id: string;
  orgId: string;
  userId?: string | null;
  role: 'admin' | 'manager' | 'user';
  inviteEmail?: string | null;
  status: 'active' | 'pending';
  createdAt: string;
}

// ---- API helpers ----

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'x-user-role': 'admin',
  'x-user-id': 'user_001',
  'x-org-id': 'org_busala_default',
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { ...DEFAULT_HEADERS, ...(init?.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed');
  return data;
}

async function getMembers(): Promise<{ data: TeamMember[] }> {
  return apiFetch('/api/org/members?limit=100');
}

async function inviteMember(body: { inviteEmail: string; role: string }): Promise<TeamMember> {
  return apiFetch('/api/org/members', { method: 'POST', body: JSON.stringify(body) });
}

async function updateMemberRole(id: string, role: string): Promise<TeamMember> {
  return apiFetch(`/api/org/members/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

async function removeMember(id: string): Promise<void> {
  await apiFetch(`/api/org/members/${id}`, { method: 'DELETE' });
}

// ---- Invite form schema ----

const inviteSchema = z.object({
  inviteEmail: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'manager', 'user']),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

// ---- Role badge ----

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-busala-gold/15 text-busala-gold border-busala-gold/30',
  manager: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  user: 'bg-busala-hover-bg text-busala-text-muted border-border',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border capitalize ${ROLE_STYLES[role] || ROLE_STYLES.user}`}>
      {role}
    </span>
  );
}

// ---- Page ----

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { inviteEmail: '', role: 'user' },
  });

  const roleValue = watch('role');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMembers();
      setMembers(res.data);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onInvite = async (values: InviteFormValues) => {
    try {
      await inviteMember(values);
      toast.success(`Invite sent to ${values.inviteEmail}`);
      reset();
      setShowInviteForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite');
    }
  };

  const handleRoleChange = async (member: TeamMember, newRole: string) => {
    if (newRole === member.role) return;
    setRoleUpdating(member.id);
    try {
      await updateMemberRole(member.id, newRole);
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: newRole as TeamMember['role'] } : m));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setRoleUpdating(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await removeMember(removeTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      toast.success('Member removed');
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const columns = [
    { key: 'member', label: 'Member', width: 'flex-1' },
    { key: 'role', label: 'Role', width: 'w-36' },
    { key: 'status', label: 'Status', width: 'w-24' },
    { key: 'actions', label: '', width: 'w-12' },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 busala-card rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    if (members.length === 0) {
      return (
        <div className="busala-card">
          <EmptyState
            title="No team members yet"
            description="Invite people to join your organization."
            actionLabel="Invite Member"
            onAction={() => setShowInviteForm(true)}
          />
        </div>
      );
    }

    return (
      <DataTableShell
        title="Team Members"
        subtitle={`${members.length} member${members.length !== 1 ? 's' : ''}`}
        columns={columns}
      >
        {members.map((member) => (
          <DataTableRow key={member.id}>
            {/* Member info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-full bg-busala-hover-bg flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-busala-text-muted">
                  {(member.inviteEmail || member.userId || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-busala-text-primary truncate">
                  {member.inviteEmail || member.userId || `Member ${member.id.slice(0, 6)}`}
                </p>
                {member.inviteEmail && (
                  <p className="text-xs text-busala-text-subtle flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Invited via email
                  </p>
                )}
              </div>
            </div>

            {/* Role selector */}
            <div className="w-36">
              <Select
                value={member.role}
                onValueChange={(v) => handleRoleChange(member, v)}
                disabled={roleUpdating === member.id}
              >
                <SelectTrigger className="h-8 text-xs bg-busala-hover-bg border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {(['admin', 'manager', 'user'] as const).map((r) => (
                    <SelectItem key={r} value={r} className="text-xs text-card-foreground focus:bg-busala-hover-bg capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="w-24">
              <Badge
                variant="secondary"
                className={`text-xs capitalize ${
                  member.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {member.status}
              </Badge>
            </div>

            {/* Actions */}
            <div className="w-12 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-busala-text-subtle hover:text-busala-text-primary hover:bg-busala-hover-bg">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400 gap-2"
                    onClick={() => setRemoveTarget(member)}
                  >
                    <UserMinus className="h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DataTableRow>
        ))}
      </DataTableShell>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Team"
        subtitle="Manage team members and their roles"
        actionLabel="Invite Member"
        actionIcon={Plus}
        onAction={() => setShowInviteForm((v) => !v)}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-busala-text-muted hover:text-busala-text-primary hover:bg-busala-hover-bg"
          onClick={load}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </PageHeader>

      {/* Invite form */}
      {showInviteForm && (
        <div className="busala-card p-4 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-busala-gold" />
            <h3 className="text-sm font-semibold text-busala-text-primary">Invite a Team Member</h3>
          </div>
          <form onSubmit={handleSubmit(onInvite)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="inviteEmail" className="text-xs text-busala-text-muted sr-only">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                {...register('inviteEmail')}
                placeholder="colleague@example.com"
                className="bg-busala-hover-bg border-border h-9 text-sm"
              />
              {errors.inviteEmail && (
                <p className="text-xs text-red-400">{errors.inviteEmail.message}</p>
              )}
            </div>
            <Select value={roleValue} onValueChange={(v) => setValue('role', v as InviteFormValues['role'])}>
              <SelectTrigger className="w-32 h-9 bg-busala-hover-bg border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="admin" className="text-sm text-card-foreground focus:bg-busala-hover-bg">Admin</SelectItem>
                <SelectItem value="manager" className="text-sm text-card-foreground focus:bg-busala-hover-bg">Manager</SelectItem>
                <SelectItem value="user" className="text-sm text-card-foreground focus:bg-busala-hover-bg">User</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border h-9"
                onClick={() => { setShowInviteForm(false); reset(); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="busala-gradient-gold text-[#0B0D10] font-semibold h-9"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 text-xs text-busala-text-subtle">
        <span className="flex items-center gap-1.5"><RoleBadge role="admin" /> Full access — can manage team, billing, settings</span>
        <span className="flex items-center gap-1.5"><RoleBadge role="manager" /> Can manage data, cannot manage team</span>
        <span className="flex items-center gap-1.5"><RoleBadge role="user" /> Read + create access only</span>
      </div>

      {renderContent()}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(v) => { if (!v) setRemoveTarget(null); }}
        title="Remove Team Member"
        description={`Remove ${removeTarget?.inviteEmail || removeTarget?.userId || 'this member'} from your organization? They will lose access immediately.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleRemove}
      />
    </div>
  );
}
