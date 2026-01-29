# Busala Setup Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local or hosted)
- npm or yarn

## Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql-14
   sudo systemctl start postgresql

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create database**:
   ```bash
   psql postgres
   CREATE DATABASE busala;
   CREATE USER shqier WITH PASSWORD 'test1';
   GRANT ALL PRIVILEGES ON DATABASE busala TO busala;
   \q
   ```

3. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and update DATABASE_URL:
   DATABASE_URL="postgresql://busala_user:your_password@localhost:5432/busala"
   ```

### Option 2: Hosted PostgreSQL (Recommended for Production)

Choose one of these providers:

#### Supabase (Free tier available)
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string from Settings > Database
4. Update `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

#### Neon (Free tier available)
1. Go to [https://neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `.env`:
   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

#### Railway (Pay-as-you-go)
1. Go to [https://railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string
4. Update `.env`

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run database migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Seed the database**:
   ```bash
   npx prisma db seed
   # OR
   node -r ts-node/register src/lib/db/seed-prisma.ts
   ```

## Development

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Database Management

### View database with Prisma Studio:
```bash
npx prisma studio
```

### Reset database (WARNING: Deletes all data):
```bash
npx prisma migrate reset
```

### Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

### Apply migrations to production:
```bash
npx prisma migrate deploy
```

## Prisma Commands Reference

| Command | Description |
|---------|-------------|
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Create and apply migrations (dev) |
| `npx prisma migrate deploy` | Apply migrations (production) |
| `npx prisma migrate reset` | Reset database and apply all migrations |
| `npx prisma studio` | Open Prisma Studio (database GUI) |
| `npx prisma db push` | Push schema changes without migrations |
| `npx prisma db seed` | Run seed script |
| `npx prisma format` | Format schema.prisma file |

## Environment Variables

Required environment variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Optional: For production
NODE_ENV="production"
```

## Troubleshooting

### Connection errors:
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure firewall allows connections
- For hosted databases, check IP whitelist

### Migration errors:
```bash
# Reset and start fresh (development only)
npx prisma migrate reset

# Force push schema (use with caution)
npx prisma db push --force-reset
```

### Prisma Client errors:
```bash
# Regenerate Prisma Client
rm -rf node_modules/.prisma
npx prisma generate
```

## Production Deployment

1. Set `DATABASE_URL` environment variable
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Build application:
   ```bash
   npm run build
   ```
4. Start application:
   ```bash
   npm start
   ```

## Notes

- The application uses PostgreSQL with Prisma ORM
- Seed data includes 5 teachers, 20 students, 6 rooms, 6 groups, ~30 lessons, and 8 approvals
- All data is scoped to organizations via `orgId` field
- Authentication is header-based for development (x-user-role, x-user-id, x-org-id)
