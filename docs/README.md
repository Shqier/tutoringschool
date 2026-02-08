# Busala Documentation

Complete documentation for the Busala school management system.

## 📚 Documentation Structure

### Getting Started
- **[README.md](../README.md)** - Project overview, quick start, and features
- **[SETUP.md](../SETUP.md)** - Detailed installation and database setup
- **[CLAUDE.md](../CLAUDE.md)** - Development guide for AI assistants

### API Documentation
- **[API Reference](./api/README.md)** - Complete API documentation
  - Authentication & authorization
  - All endpoints with examples
  - Error codes and responses
  - Conflict detection & resolution

### Architecture & Design
- **[Architecture](../ref/ARCHITECTURE.md)** - System architecture and layout
- **[Components](../ref/COMPONENTS.md)** - Component library reference
- **[Design Tokens](../ref/DESIGN_TOKENS.md)** - Colors, spacing, typography
- **[Data Types](../ref/DATA_TYPES.md)** - TypeScript type definitions

### Development
- **[AGENTS.md](../AGENTS.md)** - AI agent workflows and automation

### Archive
Historical reports and migration documents:
- [Phase 2 Review](./archive/PHASE_2_REVIEW.md) - Teacher availability implementation
- [Phase 3 Complete](./archive/PHASE_3_COMPLETE.md) - Teachers & Groups APIs
- [Phase 4 Summary](./archive/PHASE_4_SUMMARY.md) - Students API & verification
- [Migration Reports](./archive/) - Various migration and integration summaries

## 📖 Quick Links

### For New Developers
1. Read [README.md](../README.md) for project overview
2. Follow [SETUP.md](../SETUP.md) for installation
3. Review [Architecture](../ref/ARCHITECTURE.md) for system design
4. Check [API Reference](./api/README.md) for endpoint details

### For AI Assistants
1. Start with [CLAUDE.md](../CLAUDE.md) for development guidelines
2. Review [AGENTS.md](../AGENTS.md) for workflow automation
3. Reference [API Documentation](./api/README.md) for implementation details

### For Designers
1. Review [Design Tokens](../ref/DESIGN_TOKENS.md) for design system
2. Check [Components](../ref/COMPONENTS.md) for available UI elements
3. See [Architecture](../ref/ARCHITECTURE.md) for layout structure

## 🎯 Key Features Documented

### Teacher Availability System
- **Weekly schedules**: Recurring availability by day and time
- **Exceptions**: Date-specific overrides (vacations, extra shifts)
- **Automatic enforcement**: Validated on lesson creation
- **Priority order**: Unavailable exceptions → Available exceptions → Weekly schedule

See [CLAUDE.md](../CLAUDE.md#🔒-locked-data-model---phase-2-do-not-change) for implementation details.

### Conflict Detection
- **Teacher double-booking**: Same teacher, overlapping times
- **Room conflicts**: Same room, overlapping lessons
- **Availability checks**: Outside teacher's schedule

See [API Reference](./api/README.md#conflict-detection) for usage.

### Authorization Model
- **Role-based access**: staff, manager, admin
- **Resource permissions**: Different levels per resource type
- **Organization isolation**: All data scoped by orgId

See [API Reference](./api/README.md#role-permissions) for details.

## 🧪 Testing

### Test Coverage
- **274 total tests** across all APIs
- **Integration tests** for all endpoints
- **Validation tests** for all schemas
- **Authorization tests** for all roles

Run tests:
```bash
npm test
```

See test files in `src/app/api/*/__tests__/`

## 🗄 Database

### Schema Overview
- **Students**: Enrollment and contact info
- **Teachers**: Availability schedules and specializations
- **Groups**: Class organization with capacity
- **Lessons**: Scheduled sessions with conflict checking
- **Rooms**: Physical/virtual spaces
- **Approvals**: Workflow management

View schema: `prisma/schema.prisma`

### Key Features
- **JSON fields**: For complex data (availability schedules)
- **Composite indexes**: Optimized for common queries
- **Organization scoping**: Multi-tenant support via orgId
- **Timestamps**: Automatic createdAt/updatedAt tracking

## 🚀 Deployment

### Environment Setup
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
NODE_ENV="production"
```

### Deployment Steps
1. Set environment variables
2. Run migrations: `npx prisma migrate deploy`
3. Build: `npm run build`
4. Start: `npm start`

### Recommended Platforms
- **Vercel**: Best for Next.js
- **Railway**: PostgreSQL + app hosting
- **Fly.io**: Full Docker control

## 📝 Contributing

### Before Contributing
1. Read [README.md](../README.md#🤝-contributing)
2. Review [CLAUDE.md](../CLAUDE.md) for conventions
3. Ensure tests pass: `npm test`
4. Follow commit conventions

### Code Standards
- TypeScript strict mode
- Zod validation for all inputs
- Tests for new features
- Conventional commit messages

## 🔧 Development Tools

### Available Commands
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run lint         # Lint code
```

### Database Tools
```bash
npx prisma studio    # Database GUI
npx prisma migrate   # Manage migrations
npx prisma generate  # Generate client
```

## 📊 Project Status

### Completed Features
- ✅ Dashboard with real-time data
- ✅ Full CRUD for all resources
- ✅ Teacher availability system
- ✅ Conflict detection
- ✅ Role-based authorization
- ✅ Comprehensive test coverage

### In Progress
- 🚧 Authentication system (currently header-based)
- 🚧 Real-time notifications
- 🚧 Advanced reporting

### Planned
- 📋 Multi-language support
- 📋 Mobile app
- 📋 Calendar integration
- 📋 Payment processing

## 🆘 Getting Help

1. **Check documentation** - Most questions answered here
2. **Review code** - Code is well-commented
3. **Run tests** - Tests show expected behavior
4. **Check issues** - May already be reported
5. **Ask for help** - Open an issue with details

## 📄 License

This project is private and proprietary.

---

Last updated: February 2026
