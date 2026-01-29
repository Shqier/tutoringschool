# Busala Dashboard - Components

## Dashboard Components (`src/components/dashboard/`)

| Component | Location | Purpose |
|-----------|----------|---------|
| TopNav | `TopNav.tsx` | Header: logo, nav links, notifications, user |
| SidebarNav | `SidebarNav.tsx` | Left navigation menu |
| AdminOverviewCard | `AdminOverviewCard.tsx` | Welcome card + stats grid |
| StatMiniCard | `StatMiniCard.tsx` | Individual stat display |
| LessonsList | `LessonsList.tsx` | Today's lessons timeline |
| ResourceUtilizationCard | `ResourceUtilizationCard.tsx` | Room/teacher metrics + heatmap |
| GroupsLessonsTable | `GroupsLessonsTable.tsx` | Groups data table |
| TeacherLoadCard | `TeacherLoadCard.tsx` | Teacher workload bars |
| QuickActionsCard | `QuickActionsCard.tsx` | 2x2 action buttons |
| AnnouncementsCard | `AnnouncementsCard.tsx` | Announcements list |

## UI Components (`src/components/ui/`)

shadcn/ui based components:
- `card.tsx` - Card, CardHeader, CardTitle, CardContent
- `button.tsx` - Button with variants
- `avatar.tsx` - Avatar, AvatarImage, AvatarFallback
- `badge.tsx` - Badge with variants
- `switch.tsx` - Toggle switch
- `tabs.tsx` - Tabs, TabsList, TabsTrigger, TabsContent

## Import Pattern

```tsx
import {
  TopNav,
  SidebarNav,
  AdminOverviewCard,
  // ...
} from '@/components/dashboard';

import { Card, CardContent } from '@/components/ui/card';
```

## Component Structure

Each dashboard component follows:
```tsx
'use client';

import { /* icons */ } from 'lucide-react';
import { /* ui components */ } from '@/components/ui/*';
import type { /* types */ } from '@/types/dashboard';

interface Props {
  data: DataType;
}

export function ComponentName({ data }: Props) {
  return (/* JSX */);
}
```
