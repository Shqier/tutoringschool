# ClassHub - School Management Platform

A modern school management system built with Next.js, TypeScript, and PostgreSQL. Features include lesson scheduling, teacher availability management, student enrollment, and resource allocation.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Shqier/tutoringschool.git
cd busala-v1

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npx prisma db push
npx prisma generate

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality

- **Dashboard**: Real-time overview of students, teachers, lessons, and resources
- **Lesson Management**: Full CRUD with conflict detection and scheduling
- **Teacher Availability**:
  - Weekly recurring schedules
  - Date-specific exceptions (vacations, sick days)
  - Automatic validation on lesson creation
- **Student Management**: Enrollment tracking, group assignments, contact info
- **Group Management**: Class organization with lesson tracking
- **Resource Management**: Room and material allocation

### Technical Features

- ✅ **Full API Coverage**: RESTful APIs for all resources
- ✅ **Authorization**: Role-based access control (staff/manager/admin)
- ✅ **Conflict Detection**: Prevents double-booking and scheduling conflicts
- ✅ **Real-time Validation**: Teacher availability enforcement
- ✅ **Comprehensive Testing**: 274 passing API integration tests
- ✅ **Type Safety**: Full TypeScript coverage with Zod validation

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: SWR for data fetching
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Header-based (dev mode)
- **Validation**: Zod schemas

### Development
- **Testing**: Vitest + Testing Library
- **Linting**: ESLint
- **Package Manager**: npm

## 📁 Project Structure

```
busala-v1/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/             # App layout pages
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── students/      # Students page
│   │   │   ├── teachers/      # Teachers page
│   │   │   ├── groups/        # Groups page
│   │   │   └── lessons/       # Lessons page
│   │   └── api/               # API routes
│   │       ├── students/      # Students API + tests
│   │       ├── teachers/      # Teachers API + tests
│   │       ├── groups/        # Groups API + tests
│   │       ├── lessons/       # Lessons API + tests
│   │       ├── rooms/         # Rooms API
│   │       └── approvals/     # Approvals API
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   ├── students/          # Student-specific components
│   │   ├── teachers/          # Teacher-specific components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── api/               # API client & hooks
│   │   ├── db/                # Prisma client & seed
│   │   ├── scheduling/        # Conflict detection logic
│   │   └── validations.ts     # Zod schemas
│   └── types/                 # TypeScript types
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docs/                      # Documentation
│   ├── archive/              # Historical reports
│   └── api/                  # API documentation
└── ref/                       # Design & architecture docs
    ├── ARCHITECTURE.md
    ├── COMPONENTS.md
    ├── DATA_TYPES.md
    └── DESIGN_TOKENS.md
```

## 💻 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run seed         # Seed database with sample data
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the existing patterns

3. **Run tests**
   ```bash
   npm run test
   ```

4. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Coding Conventions

- Use TypeScript strict mode
- Follow existing component patterns
- Add tests for new features
- Use Zod for validation
- Follow REST API conventions
- Write meaningful commit messages

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines.

## 📡 API Documentation

### Authentication

All API requests require these headers in development:

```
x-user-id: <uuid>
x-user-role: staff | manager | admin
x-org-id: <uuid>
```

### Endpoints

#### Students API
- `GET /api/students` - List students (pagination, search, filter)
- `POST /api/students` - Create student (staff+)
- `GET /api/students/:id` - Get student details
- `PATCH /api/students/:id` - Update student (staff+)
- `DELETE /api/students/:id` - Delete student (manager+)

#### Teachers API
- `GET /api/teachers` - List teachers (staff+)
- `POST /api/teachers` - Create teacher (manager+)
- `GET /api/teachers/:id` - Get teacher details
- `PATCH /api/teachers/:id` - Update teacher (manager+)
- `DELETE /api/teachers/:id` - Delete teacher (admin only)

#### Groups API
- `GET /api/groups` - List groups (staff+)
- `POST /api/groups` - Create group (manager+)
- `GET /api/groups/:id` - Get group details
- `PATCH /api/groups/:id` - Update group (manager+)
- `DELETE /api/groups/:id` - Delete group (admin only)

#### Lessons API
- `GET /api/lessons` - List lessons (filter by date, status, teacher, group)
- `POST /api/lessons` - Create lesson (with conflict detection)
- `GET /api/lessons/:id` - Get lesson details
- `PATCH /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson

### Error Responses

All APIs follow a consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [...]
  }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Validation error
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate or scheduling conflict)
- `500` - Server error

### Conflict Detection

When creating/updating lessons, the API checks for:

1. **Teacher double-booking** - Same teacher, overlapping times
2. **Room double-booking** - Same room, overlapping times
3. **Teacher availability** - Outside weekly schedule or during exceptions

Conflicts return `409` with details:

```json
{
  "error": "Conflict detected",
  "conflicts": {
    "teacher": [...],
    "room": [...],
    "availability": [...]
  }
}
```

Use force headers to override (except availability):
- `x-force-create: true` (for POST)
- `x-force-update: true` (for PATCH)

## 🗄 Database Schema

### Core Models

- **Student** - Student information and enrollment status
- **Teacher** - Teacher details with availability schedules
- **Group** - Class groups with capacity tracking
- **Lesson** - Scheduled lessons with participants
- **Room** - Physical or virtual learning spaces
- **Approval** - Workflow approvals for changes

### Key Features

- **Teacher Availability**: Stored as JSON in Teacher model
  - `weeklyAvailability`: Recurring weekly schedule
  - `availabilityExceptions`: Date-specific overrides
- **Organization Isolation**: All models have `orgId` for multi-tenancy
- **Optimized Indexes**: Composite indexes for common queries
- **Soft Deletes**: Approval model supports workflow tracking

See `prisma/schema.prisma` for complete schema.

## 🧪 Testing

### Test Coverage

- **274 total tests** passing
- **API Integration Tests**: Full coverage of all endpoints
  - Teachers: 60 tests
  - Groups: 66 tests
  - Students: 78 tests
  - Lessons: 70 tests

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- teachers

# Run in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Test Structure

Tests are located next to the code they test:

```
src/app/api/teachers/
├── route.ts
├── [id]/route.ts
└── __tests__/
    ├── route.test.ts
    └── [id].route.test.ts
```

## 🚢 Deployment

### Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Optional: Production settings
NODE_ENV="production"
```

### Build & Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Database Migration

```bash
# Generate migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy
```

### Recommended Platforms

- **Vercel**: Easiest deployment for Next.js
- **Railway**: Simple PostgreSQL + Next.js hosting
- **Fly.io**: Full control with Docker

## 📚 Additional Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Development guide for AI assistants
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[AGENTS.md](./AGENTS.md)** - AI agent workflows
- **[Architecture](./ref/ARCHITECTURE.md)** - System architecture
- **[Components](./ref/COMPONENTS.md)** - Component library
- **[Design Tokens](./ref/DESIGN_TOKENS.md)** - Design system
- **[Data Types](./ref/DATA_TYPES.md)** - TypeScript interfaces

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🙋 Support

For questions or issues:
- Check existing documentation
- Review closed issues
- Open a new issue with details

---

Built with ❤️ using Next.js and TypeScript
