# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
npm run dev          # Start full stack development (client + server on port 5001)
npm run dev:api      # Start API server only with test database (port 5001)
npm run dev:ui       # Start Vite UI server only (port 5173)
npm run dev:all      # Start both API and UI servers concurrently
npm run check        # TypeScript type checking
npm run db:push      # Apply database schema changes with Drizzle
```

### Testing

```bash
# Quick unit tests (stub database)
npm run test:unit    # Fast tests without real database
bun test <pattern>   # Run specific test files matching pattern
bun test server/__tests__/auth-login.test.ts  # Run single test file

# Full test suite (requires Docker)
npm run test:all     # Starts test DB, runs all Bun tests + Playwright E2E
npm run test:db      # Alternative: runs tests with real database

# Test database management
npm run test-db-up   # Start PostgreSQL test container (port 5433)
npm run test-db-down # Stop and remove test database

# Playwright E2E tests (separate from Bun tests)
npx playwright test             # Run E2E tests from e2e/ directory
npx playwright test --ui        # Interactive UI mode
npx playwright test --debug     # Debug mode with inspector

# Running tests with real database
USE_REAL_DB=true DATABASE_URL=postgresql://postgres:postgres@localhost:5433/intelliticket_test bun test tests/ server/__tests__/
```

### Database Operations

```bash
npm run db:push                 # Apply schema changes to database
npx drizzle-kit generate        # Generate new migration files
npx drizzle-kit studio          # Open Drizzle Studio for database inspection

# Apply migrations to test database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/intelliticket_test npx tsx -e "
  import pg from 'pg';
  import fs from 'fs';
  const client = new pg.Client(process.env.DATABASE_URL);
  await client.connect();
  const sql = fs.readFileSync('migrations/XXX.sql', 'utf8');
  await client.query(sql);
  await client.end();
"
```

### Build & Production

```bash
npm run build        # Build production bundle (Vite + esbuild)
npm start            # Run production server
```

## Architecture Overview

### Core Patterns

1. **Multi-Family Data Isolation**
   - Every user belongs to a family via `family_id`
   - Parents automatically get a family on registration
   - Children inherit parent's family
   - All queries filter by family for data isolation
   - Multi-parent support via `family_parents` join table

2. **Database Architecture** (`server/db.ts`)
   - Factory pattern: `createDb()` returns appropriate database instance
   - Test mode: Returns stub by default unless `USE_REAL_DB=true`
   - Production: Requires `DATABASE_URL` environment variable
   - Stub database: Chainable proxy that throws on actual operations

3. **Schema & Validation** (`shared/schema.ts`)
   - Single source of truth for database schema
   - Drizzle ORM for type-safe queries
   - Zod schemas for API validation
   - Email: Required for parents, optional for children (partial unique index)
   - All foreign keys use CASCADE delete
   - `performed_by_id` tracks who performed transactions

4. **Authentication Flow**
   - Parents register with email/password at `/api/auth/register`
   - Registration creates both user and family records
   - Children are created by parents via `/api/family/children`
   - Children cannot login directly (no passwords)
   - Access tokens (15m) + Refresh tokens (14-28d) in HttpOnly cookies
   - Automatic token refresh on 401 errors

5. **Server Architecture** (`server/index.ts`)
   - ES modules with `createServer()` for testing
   - WebSocket support on `/ws` path
   - Port 5001 (changed from 5000 to avoid macOS conflicts)
   - Scheduled jobs for daily resets
   - Cookie parser for refresh token handling

### Business Rules

- **Tickets**: 1 ticket = $0.25
- **Chores**: Daily/weekly/monthly recurrence with completion tracking
- **Daily Bonus**: Spin wheel system, resets at midnight
- **Goals**: Progress calculated from user's balance (not stored separately)
- **Transactions**: Full audit trail with undo support via `ref_id`
- **Multi-Parent**: Multiple parents can manage same family

### Testing Strategy

1. **Unit Tests**: Fast, use database stub (tests/ and server/__tests__/)
2. **Integration Tests**: Use real test database with `USE_REAL_DB=true`
3. **E2E Tests**: Playwright with automatic server startup (e2e/ directory)
4. **Test Database**: PostgreSQL 16 in Docker on port 5433
5. **Test Separation**: Bun tests in tests/ and server/__tests__/, Playwright tests in e2e/

### Critical Implementation Details

1. **Email Handling**
   - Parents: Email required for authentication
   - Children: Email optional (NULL allowed)
   - Unique constraint: Partial index `WHERE email IS NOT NULL`

2. **Family Creation**
   - Automatic on parent registration
   - Named "{Parent's Name}'s Family"
   - Required for all user operations
   - Parents added to `family_parents` table on registration

3. **Migration Order**
   - Must apply in sequence (0000 through 0020)
   - Key migrations: 0016 (families table), 0018 (email nullable), 0019 (multi-parent), 0020 (column renames)
   - Test database needs all migrations for tests to pass

4. **Port Configuration**
   - API server: 5001 (not 5000 - conflicts with macOS)
   - UI dev server: 5173
   - Test database: 5433

5. **Token Refresh Architecture**
   - Frontend: `apiRequest()` and query functions handle 401 automatically
   - Refresh queue prevents duplicate refresh attempts
   - Failed refresh redirects to login
   - Cookies: HttpOnly, Secure (in production), SameSite=strict

### Environment Variables

Production:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `REFRESH_SECRET` - Secret for refresh tokens (defaults to JWT_SECRET + "_refresh")

Testing:
- `NODE_ENV=test` - Enables test mode
- `USE_REAL_DB=true` - Use real database in tests
- `DATABASE_URL` - Test database connection

### Recent Changes (Major Updates)

1. **Multi-Parent Support**: Complete `family_parents` join table implementation with invite endpoints
2. **Dual Token Authentication**: Access tokens (15m) + refresh tokens (14-28d) with HttpOnly cookies
3. **Transaction Audit Trail**: `performed_by_id` tracking for all family financial operations
4. **Test Infrastructure Overhaul**: Separated Bun/Playwright tests, robust CI with server management
5. **Family-Based Data Isolation**: All operations now scoped to family for proper multi-parent security
6. **Port Standardization**: API consistently on 5001, UI on 5173, test DB on 5433
7. **Advanced Token Management**: Frontend queue-based refresh with 401 handling

### API Endpoints Added

- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Clear refresh token cookie
- `POST /api/families/:id/invite-parent` - Invite parent to family
- `GET /api/families/:id/parents` - List all parents in family
- `GET /api/me` - Get current user info (requires auth)

### Known Issues

1. **Vite Proxy**: Still configured to proxy `/api` to port 5000 instead of 5001 (vite.config.ts:26)
2. **TypeScript**: Type narrowing issues with literal string comparisons in queryClient.ts

### Common Patterns

1. **API Response Format**
   ```typescript
   // Success
   { success: true, data: <result> }
   
   // Error
   { success: false, error: { msg: string, code?: string } }
   ```

2. **Query Functions**
   ```typescript
   // Standard queries
   queryFn: getQueryFn()
   
   // Cached queries (for high-frequency endpoints)
   queryFn: getCachedQueryFn({ 
     on401: "throw", 
     cacheDuration: 30000 
   })
   ```

3. **Transaction Tracking**
   ```typescript
   // All transaction endpoints now include
   performed_by_id: req.user.id
   ```

4. **Multi-Parent Queries**
   ```sql
   -- Check if user is parent of family
   SELECT 1 FROM family_parents 
   WHERE family_id = ? AND parent_id = ?
   ```

### Quick Fixes

1. **Migration 0020 issue**: If you see `delta_tickets` column errors, apply:
   ```sql
   ALTER TABLE "transactions" RENAME COLUMN "delta_tickets" TO "delta";
   ALTER TABLE "transactions" RENAME COLUMN "date" TO "created_at";
   ```

2. **Cookie-parser missing**: Run `npm install cookie-parser @types/cookie-parser`

3. **Type narrowing error**: Use type assertion `(on401 as UnauthorizedBehavior)`

4. **Test Authentication**: Use `extractToken()` helper from `server/__tests__/helpers/auth.ts` 
   ```typescript
   import { extractToken } from "./helpers/auth";
   const token = extractToken(response.body); // Handles both token formats
   ```

5. **Spin Ticket Values**: Current wheel returns `[1, 2, 3, 5, 10]` not `[1, 2, 3, 5, 8]`

6. **Transaction Metadata**: Stored as JSON string, parse with `JSON.parse(transaction.metadata)`