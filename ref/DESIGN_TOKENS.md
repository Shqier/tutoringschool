# Busala Dashboard - Design Tokens

Location: `src/app/globals.css`

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--busala-gold` | `#F5A623` | Primary accent |
| `--busala-bg` | `#0B0D10` | Page background |
| `--busala-card` | `#14171C` | Card backgrounds |
| `--busala-sidebar` | `#0E1014` | Sidebar background |
| `--busala-nav` | `#101319` | TopNav background |
| `--busala-border` | `rgba(255,255,255,0.04)` | Subtle borders |
| `--busala-muted` | `rgba(255,255,255,0.5)` | Muted text |

## Spacing

| Token | Value |
|-------|-------|
| `--spacing-xs` | 8px |
| `--spacing-sm` | 12px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |

## Layout Dimensions

| Token | Value |
|-------|-------|
| `--topnav-height` | 72px |
| `--sidebar-width` | 240px |
| `--row-height` | 56px |
| `--avatar-sm` | 32px |
| `--avatar-md` | 48px |
| `--button-height` | 38px |

## Radius & Shadows

| Token | Value |
|-------|-------|
| `--radius-card` | 16px |
| `--radius-item` | 12px |
| `--shadow-card` | `0 20px 40px rgba(0,0,0,0.4)` |
| `--shadow-hover` | `0 24px 48px rgba(0,0,0,0.5)` |

## CSS Utility Classes

```css
.busala-card        /* Glass effect card */
.busala-gradient-gold  /* Gold gradient bg */
.busala-nav-active   /* Active nav item */
.busala-bg-gradient  /* Radial bg gradient */
.custom-scrollbar    /* Styled scrollbar */
```

## Tailwind Usage

```tsx
// Card with glass effect
<div className="busala-card rounded-[16px]">

// Gold gradient button
<button className="busala-gradient-gold h-[38px] rounded-full">

// Active nav item
<a className="busala-nav-active h-[44px] rounded-[12px]">
```
