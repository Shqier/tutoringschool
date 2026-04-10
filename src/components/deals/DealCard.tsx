'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DollarSign, User, Calendar, GripVertical } from 'lucide-react';
import type { Deal } from './types';

interface DealCardProps {
  deal: Deal;
  onClick?: (deal: Deal) => void;
  isDragging?: boolean;
}

export function DealCard({ deal, onClick, isDragging }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const formatValue = (value?: number | null, currency = 'USD') => {
    if (value == null) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group busala-card p-3 rounded-xl cursor-pointer border border-transparent hover:border-busala-gold/30 transition-all ${
        isDragging ? 'shadow-2xl ring-1 ring-busala-gold/50' : ''
      }`}
      onClick={() => onClick?.(deal)}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 text-busala-text-subtle opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag deal"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-medium text-busala-text-primary leading-snug">{deal.title}</p>

          <div className="flex flex-wrap gap-2">
            {deal.value != null && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <DollarSign className="h-3 w-3" />
                {formatValue(deal.value, deal.currency)}
              </span>
            )}

            {deal.ownerName && (
              <span className="inline-flex items-center gap-1 text-xs text-busala-text-subtle">
                <User className="h-3 w-3" />
                {deal.ownerName}
              </span>
            )}

            {deal.expectedClose && (
              <span className="inline-flex items-center gap-1 text-xs text-busala-text-subtle">
                <Calendar className="h-3 w-3" />
                {formatDate(deal.expectedClose)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
