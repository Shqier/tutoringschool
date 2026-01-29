# Busala Dashboard - Architecture

## Tech Stack
- **Framework**: Next.js 16.1.5 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: lucide-react

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Dashboard page
│   └── globals.css         # Design tokens
├── components/
│   ├── dashboard/          # Dashboard components
│   └── ui/                 # Reusable shadcn components
├── types/
│   └── dashboard.ts        # TypeScript interfaces
├── data/
│   └── mock-data.ts        # Mock data
└── lib/
    └── utils.ts            # Utilities (cn function)
```

## Layout Architecture

```
┌─────────────────────────────────────────┐
│             TopNav (72px)               │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │       Main Content           │
│ (240px)  │   (12-col grid, 24px gap)    │
│          │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

- TopNav: Fixed, full-width, h-[72px]
- Sidebar: Fixed left, w-[240px]
- Main: ml-[240px] pt-[72px]

## Component Patterns

1. **Client Components**: Use `'use client'` for interactivity
2. **Barrel Exports**: `components/dashboard/index.ts`
3. **Type Safety**: All data has TypeScript interfaces
4. **Icon Mapping**: Dynamic icons via lucide-react
