---
name: busala-frontend
description: Frontend development for Busala School Management System using Next.js 16, React 19, TypeScript 5, Tailwind CSS v4, and shadcn/ui. Use when implementing UI components, pages, hooks, or client-side logic. Covers component patterns, styling conventions, form handling with react-hook-form, and API integration.
---

# Busala Frontend Development

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: react-hook-form + Zod
- **State**: React hooks, React Query (via custom hooks)
- **Icons**: lucide-react

## Component Patterns

### Server Components (Default)

```tsx
// Use for static content, data fetching
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Client Components

```tsx
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <div />;
}
```

### Component File Structure

```
src/components/
├── ui/              # shadcn/ui components
├── app/             # Shared app components
├── dashboard/       # Dashboard-specific
├── teachers/        # Feature-specific
└── students/        # Feature-specific
```

## Styling Conventions

### Design Tokens (CSS Variables)

```css
/* Primary Colors */
--busala-gold: #F5A623
--busala-bg-primary: #F8F9FA
--busala-bg-card: #FFFFFF
--busala-text-primary: #1A1D24
--busala-text-muted: rgba(0,0,0,0.6)
```

### Utility Classes

```tsx
// Card styling
<div className="busala-card">

// Gradient background
<div className="busala-bg-gradient">

// Active navigation
<div className="busala-nav-active">
```

### Layout

```tsx
// Main content area
<main className="ml-[240px] pt-[72px]">
  <div className="p-6 lg:p-8">
```

## Form Patterns

### With react-hook-form + Zod

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

## API Integration

### Using Custom Hooks

```tsx
import { useTeachers } from '@/lib/api/hooks';

export function TeacherList() {
  const { data, isLoading, error } = useTeachers();
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{data?.teachers.map(...)}</div>;
}
```

### Direct API Client

```tsx
import { createTeacher } from '@/lib/api/client';

const handleCreate = async () => {
  try {
    const teacher = await createTeacher({
      fullName: 'John Doe',
      email: 'john@example.com',
    });
    toast.success('Created!');
  } catch (error) {
    toast.error(error.message);
  }
};
```

## Error Handling

### API Errors

```tsx
try {
  await apiCall();
} catch (error) {
  if (error instanceof ApiConflictError) {
    // Handle 409 conflicts
  } else if (error instanceof ApiClientError) {
    // Handle other API errors
  }
}
```

## Best Practices

1. Use Server Components by default
2. Add `'use client'` only when using hooks or browser APIs
3. Import from barrel files: `@/components/dashboard`
4. Use CSS variables for colors, not hardcoded values
5. Handle loading and error states
6. Use TypeScript strict mode - no `any` types
