'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  id: string;
  placeholder: string;
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
}

interface FiltersBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  className?: string;
}

export function FiltersBar({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  className = '',
}: FiltersBarProps) {
  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-busala-text-subtle" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-9 h-10 bg-busala-hover-bg border-busala-border-glass text-busala-text-primary placeholder:text-busala-text-subtle focus:border-busala-gold/50 focus:ring-busala-gold/20"
        />
      </div>

      {/* Filter Selects */}
      {filters.map((filter) => (
        <Select
          key={filter.id}
          value={filter.value}
          onValueChange={filter.onChange}
        >
          <SelectTrigger className="w-[160px] h-10 bg-busala-hover-bg border-busala-border-glass text-busala-text-primary focus:border-busala-gold/50 focus:ring-busala-gold/20">
            <SelectValue placeholder={filter.placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {filter.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-card-foreground hover:text-card-foreground focus:bg-busala-hover-bg focus:text-card-foreground"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
