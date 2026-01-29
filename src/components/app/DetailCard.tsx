'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, Mail, Phone, Edit, Trash2 } from 'lucide-react';

interface DetailItem {
  label: string;
  value: string | React.ReactNode;
  icon?: LucideIcon;
}

interface DetailCardProps {
  title?: string;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  status?: {
    label: string;
    variant: 'active' | 'inactive' | 'warning';
  };
  details?: DetailItem[];
  email?: string;
  phone?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const statusStyles = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-busala-hover-bg text-busala-text-muted border-border',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function DetailCard({
  title,
  name,
  subtitle,
  avatarUrl,
  status,
  details = [],
  email,
  phone,
  onEdit,
  onDelete,
  children,
  className = '',
}: DetailCardProps) {
  return (
    <div className={`busala-card p-4 ${className}`}>
      {title && (
        <h3 className="text-sm font-medium text-busala-text-muted mb-4">{title}</h3>
      )}

      {/* Avatar & Name */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-muted text-foreground text-base">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-busala-text-primary truncate">{name}</p>
          {subtitle && (
            <p className="text-sm text-busala-text-muted truncate">{subtitle}</p>
          )}
        </div>
        {status && (
          <Badge
            className={`${statusStyles[status.variant]} border text-xs px-2 py-0.5`}
          >
            {status.label}
          </Badge>
        )}
      </div>

      {/* Contact Info */}
      {(email || phone) && (
        <div
          className="space-y-2 py-3 border-t border-b my-3"
          style={{ borderColor: 'var(--busala-border-divider)' }}
        >
          {email && (
            <div className="flex items-center gap-2 text-sm text-busala-text-muted">
              <Mail className="h-4 w-4 text-busala-text-subtle" />
              <span className="truncate">{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-sm text-busala-text-muted">
              <Phone className="h-4 w-4 text-busala-text-subtle" />
              <span>{phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Detail Items */}
      {details.length > 0 && (
        <div className="space-y-3 py-3">
          {details.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-busala-text-muted flex items-center gap-2">
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </span>
              <span className="text-sm text-busala-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom Content */}
      {children}

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-3 mt-3 border-t" style={{ borderColor: 'var(--busala-border-divider)' }}>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 bg-busala-hover-bg border-border text-busala-text-primary hover:bg-busala-active-bg hover:text-busala-text-primary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex-1 bg-busala-hover-bg border-border text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
