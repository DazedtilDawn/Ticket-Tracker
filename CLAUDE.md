# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
npm run dev          # Start development server with hot reload (client + server)
npm run check        # TypeScript type checking
npm run db:push      # Apply database schema changes with Drizzle
```

### Build & Production

```bash
npm run build        # Build production bundle (Vite for client, esbuild for server)
npm start            # Run production server
```

### Testing

```bash
npm test             # Run tests with Bun (or `bun test` directly)
```

## Architecture Overview

### Full-Stack Monorepo Structure

- **Client**: React SPA in `/client` using Vite, TypeScript, Tailwind CSS
- **Server**: Express API in `/server` using TypeScript, Drizzle ORM
- **Shared**: Database schema and types in `/shared/schema.ts`

### Key Architectural Patterns

1. **Database-First Design**

   - PostgreSQL with Drizzle ORM
   - Shared schema between client/server in `shared/schema.ts`
   - Zod validation schemas derived from database schema
   - Transaction-based ticket system with audit trail

2. **State Management**

   - Zustand stores for client state (`client/src/store/`)
   - React Query for server state and caching
   - WebSocket for real-time updates

3. **Authentication & Authorization**

   - JWT-based authentication
   - Role-based access (parent/child roles)
   - Family-based data isolation via `family_id`

4. **File Upload System**

   - Profile images: `/public/uploads/profiles/`
   - Banner images: `/public/uploads/banners/`
   - Trophy images: `/public/uploads/trophies/`
   - Handled by multer with local filesystem storage

5. **Progressive Web App**
   - Service worker for offline support
   - Android WebView wrapper in `/public/android/`
   - PWA manifest and icons

### Business Logic

The app is a family ticket tracking system where:

- Children earn tickets by completing chores
- Parents manage chores and can award/deduct tickets
- Children can set savings goals for products
- Daily bonus system with spin wheel
- Trophy/achievement system for rewarding children
- Shared family catalog for purchased items

Ticket value: 1 ticket = $0.25 (defined in `config/business.ts`)

### Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing

### Database Migrations

Database schema changes are managed through Drizzle Kit:

- Schema defined in `shared/schema.ts`
- Migrations in `/migrations/`
- Apply changes with `npm run db:push`
