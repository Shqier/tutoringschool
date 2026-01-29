# Busala Dashboard - Data Types

Location: `src/types/dashboard.ts`

## Core Types

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'teacher' | 'student';
}
```

### StatCard
```typescript
interface StatCard {
  id: string;
  label: string;
  value: number | string;
  icon: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string };
  color?: string;
}
```

### Lesson
```typescript
interface Lesson {
  id: string;
  title: string;
  subject: string;
  teacher: Teacher;
  room: Room;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  students: number;
}
```

### Group
```typescript
interface Group {
  id: string;
  name: string;
  teacher: Teacher;
  subject: string;
  students: number;
  schedule: string;
  progress: number;
}
```

### Teacher
```typescript
interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  subjects: string[];
  workload: number; // 0-100
}
```

### Room
```typescript
interface Room {
  id: string;
  name: string;
  capacity: number;
  occupied: boolean;
}
```

### Announcement
```typescript
interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  author: string;
  priority: 'high' | 'medium' | 'low';
}
```

### QuickAction
```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
}
```

### Navigation
```typescript
interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  active?: boolean;
}
```

## Mock Data

Location: `src/data/mock-data.ts`

Exports:
- `dashboardStats: StatCard[]`
- `todaysLessons: Lesson[]`
- `groups: Group[]`
- `teachers: Teacher[]`
- `resourceUtilization: ResourceUtilization`
- `announcements: Announcement[]`
- `quickActions: QuickAction[]`
- `topNavItems: NavItem[]`
- `sidebarNavItems: NavItem[]`
