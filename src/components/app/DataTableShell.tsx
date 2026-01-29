'use client';

import React from 'react';

interface Column {
  key: string;
  label: string;
  width?: string;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
}

interface DataTableShellProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export function DataTableShell({
  title,
  subtitle,
  columns,
  children,
  headerAction,
  className = '',
}: DataTableShellProps) {
  return (
    <div className={`busala-card flex flex-col h-full ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-busala-border-glass"
      >
        <div>
          <h3 className="text-base font-semibold text-busala-text-primary">{title}</h3>
          {subtitle && (
            <p className="text-xs text-busala-text-subtle">{subtitle}</p>
          )}
        </div>
        {headerAction}
      </div>

      {/* Table Header */}
      <div
        className="flex items-center gap-4 h-10 px-4 text-xs font-medium text-busala-text-subtle border-b border-busala-border-glass"
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className={`
              ${col.width || 'flex-1'}
              ${col.hideOnMobile ? 'hidden md:block' : ''}
              ${col.hideOnTablet ? 'hidden lg:block' : ''}
              ${col.className || ''}
            `}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

// Reusable table row component
interface DataTableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataTableRow({
  children,
  onClick,
  className = '',
}: DataTableRowProps) {
  return (
    <div
      className={`
        flex items-center gap-4 h-14 px-4 border-b border-busala-border-glass transition-colors
        hover:bg-busala-hover-bg cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
