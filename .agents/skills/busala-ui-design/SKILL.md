---
name: busala-ui-design
description: UI/UX design for Busala School Management System. Use when designing interfaces, creating components, or implementing the Busala design system. Covers color palette, typography, spacing, component patterns, and responsive design.
---

# Busala UI Design System

## Brand Colors

```css
/* Primary */
--busala-gold: #F5A623          /* Main accent */
--busala-gold-dark: #D4891A     /* Hover states */

/* Background */
--busala-bg-primary: #F8F9FA    /* Page background */
--busala-bg-card: #FFFFFF       /* Card background */
--busala-bg-dark: #0B0D10       /* Dark mode background */
--busala-bg-nav: #151921        /* Navigation background */

/* Text */
--busala-text-primary: #1A1D24
--busala-text-secondary: rgba(0,0,0,0.7)
--busala-text-muted: rgba(0,0,0,0.6)
--busala-text-subtle: rgba(0,0,0,0.5)

/* Borders */
--busala-border-subtle: rgba(0,0,0,0.08)
--busala-border-glass: rgba(255,255,255,0.1)
--busala-border-divider: rgba(0,0,0,0.1)

/* Status Colors */
--status-active: #10B981        /* Green */
--status-inactive: #6B7280      /* Gray */
--status-pending: #F59E0B       /* Amber */
--status-error: #EF4444         /* Red */
--status-at-risk: #F97316       /* Orange */
```

## Typography

### Font Stack

```css
--font-sans: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', monospace;
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2rem (32px) | 700 | 1.2 |
| H2 | 1.5rem (24px) | 600 | 1.3 |
| H3 | 1.25rem (20px) | 600 | 1.4 |
| Body | 0.875rem (14px) | 400 | 1.5 |
| Small | 0.75rem (12px) | 400 | 1.5 |
| Label | 0.75rem (12px) | 500 | 1.4 |

## Spacing

### Base Unit: 4px

| Token | Value |
|-------|-------|
| space-1 | 4px |
| space-2 | 8px |
| space-3 | 12px |
| space-4 | 16px |
| space-6 | 24px |
| space-8 | 32px |

### Layout

- **TopNav height**: 72px
- **Sidebar width**: 240px
- **Content padding**: 24px (p-6)
- **Card padding**: 16px (p-4)
- **Card border-radius**: 16px
- **Item border-radius**: 12px

## Component Patterns

### Card

```tsx
<div className="busala-card p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
  {/* Card content */}
</div>
```

### Button Variants

```tsx
// Primary (Gold)
<Button className="bg-gradient-to-r from-[#F5A623] to-[#D4891A] text-[#0B0D10]">

// Secondary
<Button variant="outline" className="border-gray-300">

// Ghost
<Button variant="ghost" className="hover:bg-gray-100">

// Danger
<Button className="bg-red-500 text-white">
```

### Input Fields

```tsx
<Input 
  className="bg-[#0B0D10] border-gray-700 text-white 
             placeholder:text-gray-600 
             focus:border-[#F5A623] focus:ring-[#F5A623]/20"
/>
```

### Status Badges

```tsx
// Active
<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">

// Pending
<Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">

// Inactive
<Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
```

## Layout Patterns

### Dashboard Grid

```tsx
<div className="grid grid-cols-12 gap-6">
  {/* Main content - 8 columns */}
  <div className="col-span-12 lg:col-span-8">
  
  {/* Sidebar - 4 columns */}
  <div className="col-span-12 lg:col-span-4">
</div>
```

### Data Table

```tsx
<div className="busala-card overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
    <tbody className="divide-y">
      <tr className="hover:bg-gray-50">
        <td className="py-3 px-4">
```

### Page Header

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="text-sm text-gray-500">Subtitle description</p>
  </div>
  <Button className="busala-gradient-gold">
    <Plus className="w-4 h-4 mr-2" />
    Add New
  </Button>
</div>
```

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

### Responsive Patterns

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">

// Stack on mobile, side-by-side on desktop
<div className="flex flex-col lg:flex-row">

// Full width mobile, constrained desktop
<div className="w-full lg:w-1/2">
```

## Icons

Use **Lucide React** icons:

```tsx
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Settings,
  Plus,
  Search,
  MoreVertical 
} from 'lucide-react';
```

Icon sizes:
- Small: 16px (w-4 h-4)
- Default: 20px (w-5 h-5)
- Large: 24px (w-6 h-6)

## Dark Mode

The app uses dark mode by default. Key classes:

```tsx
<html className="dark">
<body className="bg-[#0B0D10] text-white">
```

### Dark Mode Colors

- Background: `#0B0D10`
- Card: `#151921`
- Border: `rgba(255,255,255,0.1)`
- Text Primary: `#FFFFFF`
- Text Muted: `rgba(255,255,255,0.6)`

## Best Practices

1. Use CSS variables for colors
2. Maintain 4px grid spacing
3. Use `rounded-2xl` (16px) for cards
4. Use `rounded-xl` (12px) for buttons/inputs
5. Add hover states to interactive elements
6. Use `transition-colors` for smooth state changes
7. Ensure contrast ratios meet WCAG AA
