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
# Quick unit tests (React components, no database)
npm run test         # Run Vitest unit tests for React components
npm run test:unit    # Same as npm run test
npm run test:vitest  # Explicit Vitest run

# Integration tests (requires real database)
npm run test:integration  # Run Bun integration tests with PostgreSQL
npm run test:db          # Alternative: runs tests with real database

# Full test suite (requires Docker)
npm run test:all     # Starts test DB, runs all tests (unit + integration + E2E)

# Test database management
npm run test-db-up   # Start PostgreSQL test container (port 5433)
npm run test-db-down # Stop and remove test database

# Specific test patterns
bun test <pattern>   # Run specific Bun test files matching pattern
bun test server/__tests__/auth-login.test.ts  # Run single test file

# Playwright E2E tests (separate from unit/integration)
npx playwright test             # Run E2E tests
npx playwright test --ui        # Interactive UI mode
npx playwright test --debug     # Debug mode with inspector

# Running tests with real database manually
USE_REAL_DB=true DATABASE_URL=postgresql://postgres:postgres@localhost:5433/intelliticket_test bun test tests/ server/__tests__/
```

### Database Operations

```bash
npm run db:push                 # Apply schema changes to database
npx drizzle-kit generate        # Generate new migration files
npx drizzle-kit studio          # Open Drizzle Studio for database inspection
npx drizzle-kit push --force    # Apply migrations without interactive prompts (CI)

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

1. **Unit Tests**: Vitest for React components (`client/__tests__/`), use jsdom environment
2. **Integration Tests**: Bun for server API tests (`server/__tests__/`), use real PostgreSQL database
3. **E2E Tests**: Playwright with automatic server startup (`tests/` directory)
4. **Test Database**: PostgreSQL 16 in Docker on port 5433
5. **Hybrid Approach**: Vitest (React) + Bun (server) + Playwright (E2E)
6. **CI Pipeline**: Parallel execution - unit/integration/E2E run simultaneously

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
4. **Test Infrastructure Overhaul**: Hybrid testing (Vitest + Bun + Playwright), parallel CI pipeline
5. **Family-Based Data Isolation**: All operations now scoped to family for proper multi-parent security
6. **Port Standardization**: API consistently on 5001, UI on 5173, test DB on 5433
7. **Advanced Token Management**: Frontend queue-based refresh with 401 handling
8. **Wishlist System**: Basic wishlist implementation with database table and POST endpoint

### API Endpoints Added

- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Clear refresh token cookie
- `POST /api/families/:id/invite-parent` - Invite parent to family
- `GET /api/families/:id/parents` - List all parents in family
- `GET /api/me` - Get current user info (requires auth)
- `POST /api/wishlist` - Create wishlist item (basic implementation)

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

7. **Vitest Mock Patterns**: Use these standard mocks for React component tests:
   ```typescript
   // React Query mock
   vi.mock("@tanstack/react-query", () => ({
     QueryClient: vi.fn(),
     QueryClientProvider: ({ children }: any) => children,
     useQuery: vi.fn(() => ({ data: mockData, isLoading: false })),
     useMutation: vi.fn(() => ({ mutate: vi.fn(), isLoading: false })),
     useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
   }));
   
   // API request mock
   vi.mock("../lib/apiRequest", () => ({
     apiRequest: vi.fn(() => Promise.resolve([])),
   }));
   ```

8. **Test Environment Setup**: React tests require jsdom environment and these polyfills:
   ```typescript
   // vitest.setup.ts
   global.ResizeObserver = class ResizeObserver {
     observe() {}
     unobserve() {}
     disconnect() {}
   };
   
   global.IntersectionObserver = class IntersectionObserver {
     observe() {}
     unobserve() {}
     disconnect() {}
   };
   ```

9. **Wishlist Integration**: Current implementation includes:
   - Database table: `wishlist_items` with userId, productId, progress
   - Storage function: `createWishlistItem()` in `server/storage/wishlist.ts`
   - API endpoint: `POST /api/wishlist` with Zod validation
   - Integration test: `server/__tests__/wishlist-item.test.ts`

### Project Structure & Key Files

```
server/
├── __tests__/          # Bun integration tests (real database)
├── cron/              # Scheduled job handlers (daily resets)
├── jobs/              # Background job implementations
├── lib/               # Utilities (auth, file uploads, business logic)
├── storage/           # Database operations (organized by feature)
├── db.ts              # Database factory (stub vs real)
├── index.ts           # Server creation and startup
└── routes.ts          # All API route definitions (4000+ lines)

client/
├── __tests__/         # Vitest React component tests
├── src/
│   ├── components/    # Reusable UI components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Client utilities and API functions
│   ├── pages/         # Page-level components
│   ├── store/         # Zustand state management
│   └── utils/         # Utility functions

tests/                 # Playwright E2E tests
shared/
├── schema.ts          # Single source of truth: DB schema + Zod validation

config/
└── vitest.unit.config.ts  # Vitest configuration for React tests
```

### Development Workflow Recommendations

1. **Making Database Changes**:
   ```bash
   # 1. Update shared/schema.ts with new table/column
   # 2. Generate migration
   npx drizzle-kit generate
   # 3. Apply to development database  
   npm run db:push
   # 4. Create storage functions in server/storage/
   # 5. Add API routes in server/routes.ts
   # 6. Write integration tests in server/__tests__/
   # 7. Run tests to verify
   npm run test:integration
   ```

2. **Adding React Components**:
   ```bash
   # 1. Create component in client/src/components/
   # 2. Write Vitest test in client/__tests__/
   # 3. Run unit tests
   npm run test:unit
   # 4. Add to pages if needed
   ```

3. **CI/CD Considerations**:
   - All three test types run in parallel
   - Database migrations auto-apply with --force flag
   - E2E tests start servers automatically
   - Tests fail fast on any infrastructure issues

### Authentication & Authorization Patterns

- **Parent-only endpoints**: Use `parentOnly` middleware
- **Family isolation**: All database queries automatically filter by `family_id`
- **Token handling**: Frontend `apiRequest()` handles 401s with automatic refresh
- **Multi-parent**: Check `family_parents` table for authorization

### Performance & Reliability

- **Rate limiting**: Chore endpoints have circuit breaker (100 req/window)
- **Caching**: High-frequency endpoints use `getCachedQueryFn()`
- **Error handling**: Standardized error response format
- **Logging**: API requests logged with duration and response size limits