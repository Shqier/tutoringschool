# Busala Dashboard - Developer Guide

## Quick Start

```bash
npm run dev     # Start dev server (localhost:3000)
npm run build   # Build for production
npm run lint    # Run linter
```

## Project Overview

School management dashboard built with Next.js App Router, Tailwind CSS, and shadcn/ui.

## Reference Documentation

- **[Architecture](ref/ARCHITECTURE.md)** - Project structure, layout system
- **[Components](ref/COMPONENTS.md)** - Component inventory and usage
- **[Design Tokens](ref/DESIGN_TOKENS.md)** - Colors, spacing, shadows
- **[Data Types](ref/DATA_TYPES.md)** - TypeScript interfaces

## Key Paths

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Dashboard page |
| `src/app/globals.css` | Design tokens |
| `src/components/dashboard/` | Dashboard components |
| `src/components/ui/` | shadcn/ui components |
| `src/types/dashboard.ts` | TypeScript types |
| `src/data/mock-data.ts` | Mock data |

## Layout System

- TopNav: 72px fixed header
- Sidebar: 240px fixed left
- Main: 12-column grid, 24px gaps

## Design System

- Primary color: `#F5A623` (gold)
- Background: `#0B0D10` (dark)
- Cards: Glass effect with blur
- Radius: 16px (cards), 12px (items)

## Conventions

1. Use `'use client'` for interactive components
2. Import from barrel: `@/components/dashboard`
3. All data must be typed
4. Use CSS variables for design tokens
5. Follow existing component patterns
