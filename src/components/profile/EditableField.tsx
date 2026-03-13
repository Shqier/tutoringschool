'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FieldType = 'text' | 'email' | 'phone';

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void> | void;
  type?: FieldType;
  placeholder?: string;
  className?: string;
}

const validate = (type: FieldType, value: string): string | null => {
  if (type === 'email') {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value.trim() && !emailRe.test(value.trim()) ? 'Invalid email' : null;
  }
  if (type === 'phone') {
    return null;
  }
  return null;
};

export function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  placeholder,
  className = '',
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStart = useCallback(() => {
    setEditValue(value);
    setError(null);
    setEditing(true);
  }, [value]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setError(null);
    setEditing(false);
  }, [value]);

  const handleSave = useCallback(async () => {
    const err = validate(type, editValue);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(editValue.trim());
      setEditing(false);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [editValue, type, onSave]);

  if (editing) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <Label className="text-sm text-busala-text-muted">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type={type === 'phone' ? 'tel' : type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            placeholder={placeholder}
            className="flex-1 bg-busala-hover-bg border-border text-busala-text-primary"
          />
          <Button size="sm" onClick={handleSave} disabled={saving} className="busala-gradient-gold text-[#0B0D10]">
            {saving ? 'Save…' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <Label className="text-sm text-busala-text-muted">{label}</Label>
      <button
        type="button"
        onClick={handleStart}
        className="mt-0.5 block w-full text-left text-sm text-busala-text-primary hover:text-busala-gold hover:underline rounded px-2 py-1 -mx-2 hover:bg-busala-hover-bg"
      >
        {value || placeholder || 'Click to add'}
      </button>
    </div>
  );
}
