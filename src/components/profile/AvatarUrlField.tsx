'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AvatarUrlFieldProps {
  currentUrl?: string | null;
  onSave: (url: string) => Promise<void> | void;
  loading?: boolean;
  className?: string;
}

export function AvatarUrlField({ currentUrl, onSave, loading = false, className = '' }: AvatarUrlFieldProps) {
  const [url, setUrl] = useState(currentUrl ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(url.trim());
    } finally {
      setSaving(false);
    }
  };

  const displayUrl = currentUrl ?? url;
  const initial = displayUrl ? undefined : '?';

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 rounded-xl border-2 border-busala-border">
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt="Avatar" className="object-cover" />
          ) : null}
          <AvatarFallback className="rounded-xl bg-busala-hover-bg text-busala-text-muted text-2xl">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-2">
          <Label className="text-sm text-busala-text-muted">Avatar URL</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="bg-busala-hover-bg border-border text-busala-text-primary"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 rounded-lg bg-busala-gold text-[#0B0D10] text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {saving || loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
