'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-busala-hover-bg',
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('busala-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="busala-card">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--busala-border-divider)' }}>
        <Skeleton className="h-5 w-40" />
      </div>
      {/* Column Headers */}
      <div className="flex items-center gap-4 h-10 px-4 border-b" style={{ borderColor: 'var(--busala-border-divider)' }}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16 hidden md:block" />
        <Skeleton className="h-3 w-20 hidden lg:block" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 h-14 px-4 border-b"
          style={{ borderColor: 'var(--busala-border-divider)' }}
        >
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12 hidden md:block" />
          <Skeleton className="h-6 w-16 rounded-full hidden lg:block" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetailCard({ className }: SkeletonProps) {
  return (
    <div className={cn('busala-card p-4 space-y-4', className)}>
      {/* Avatar & Name */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {/* Details */}
      <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--busala-border-divider)' }}>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
