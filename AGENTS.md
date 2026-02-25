# Repository Guidelines

## Project Structure & Module Organization
- `src/app` – Next.js App Router pages and global styles.
- `src/components` – Reusable UI components (PascalCase files).
- `src/lib` – App logic: `api/`, `db/` (Prisma), `scheduling/`, `utils`, and `test/` helpers.
- `src/hooks` – React hooks (`useX` naming).
- `src/types` – Shared TypeScript types.
- `prisma/` – `schema.prisma` and `migrations/`.
- `public/` – Static assets.
- `scripts/` – Dev utilities (e.g., `verify-availability.ts`).

## Build, Test, and Development Commands
- `npm run dev` – Start local dev server at `http://localhost:3000`.
- `npm run build` – Production build.
- `npm start` – Run built app.
- `npm run lint` – ESLint (Next core-web-vitals + TS).
- `npm test` / `npm run test:watch` – Vitest (sequential; DB-safe).
- `npm run test:coverage` – Coverage report.
- Prisma: `npx prisma generate`, `npx prisma migrate dev`, `npx prisma studio`, `npx prisma db seed`.
- Verification: `npx tsx scripts/verify-availability.ts`.

## Coding Style & Naming Conventions
- TypeScript, strict mode; 2-space indent.
- Components: PascalCase in `src/components` (e.g., `RoomDialog.tsx`).
- Hooks: `useCamelCase` in `src/hooks`.
- Utils/DB/API: camelCase functions in `src/lib/**`.
- Paths: use `@/` alias (e.g., `import { prisma } from '@/lib/db/prisma'`).
- Lint before pushing: `npm run lint`. No Prettier config; follow ESLint fixes.

## Testing Guidelines
- Framework: Vitest (`*.test.ts|tsx` or `__tests__` folders).
- Env: requires `.env` with `DATABASE_URL`; tests run sequentially; DB cleaned in `setup.ts`.
- Run: `npm test` (CI), `npm run test:watch` (local), `npm run test:coverage`.
- Prefer isolated unit tests in `src/lib/**`, mock I/O where feasible.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits encouraged (e.g., `feat:`, `fix:`, `chore:`). Example from history: `feat: add dashboard UI components and database integration`.
- PRs must include: clear summary, linked issue, test coverage for logic changes, screenshots for UI, and notes for DB migrations.
- CI-ready: ensure `npm run lint` and `npm test` pass; include migration/seed changes when schema updates.

## Security & Configuration
- Never commit secrets. Use `.env` (see `.env.example`).
- Database: PostgreSQL via Prisma; apply migrations with `npx prisma migrate dev` (dev) or `deploy` (prod).

## Cursor Cloud specific instructions

### Services
- **PostgreSQL 16** – Required. Runs locally on port 5432. Start with `sudo pg_ctlcluster 16 main start`. DB user `busala` / password `busala`, database `busala`.
- **Next.js dev server** – `npm run dev` on `http://localhost:3000`. Uses header-based dev auth (`x-user-role`, `x-user-id`, `x-org-id`).

### Gotchas
- PostgreSQL may not be running after a VM restart. Always run `sudo pg_ctlcluster 16 main start` before any DB operation.
- The `.env` file is not committed. It must contain `DATABASE_URL="postgresql://busala:busala@localhost:5432/busala"`.
- `npm test` cleans the database. After running tests, re-seed with `npx prisma db seed` if you need sample data for the dev server.
- The seed script is idempotent; it skips if data already exists. To force re-seed, truncate tables first.
- Lint has pre-existing warnings/errors (1 error in `src/app/error.tsx`, ~17 warnings) in the existing codebase. Do not attempt to fix these unless specifically asked.
- Seed data uses `org_busala_default` as the orgId. Use this value in `x-org-id` headers when testing API endpoints manually.
- Standard commands (dev, build, lint, test) are documented in the "Build, Test, and Development Commands" section above.
