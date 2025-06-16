# Ticket Tracker

[![CI](https://github.com/andykoski/IntelliTicket/actions/workflows/ci.yml/badge.svg)](https://github.com/andykoski/IntelliTicket/actions/workflows/ci.yml)

A web application for tracking tickets. This project uses Node.js, Express, React and Vite.

## Prerequisites

- **Node.js 20 or higher**
- **npm** (comes with Node.js)
- **Bun** (optional, used for running tests)
- **Docker** (required for running test suite with database)

Set the following environment variables before starting the server:

- `DATABASE_URL` – connection string for your PostgreSQL database
- `JWT_SECRET` – secret string for signing JSON Web Tokens

## Installation

Install dependencies:

```bash
npm install
```

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Production

Create a production build:

```bash
npm run build
```

Run the built application:

```bash
npm start
```

## Running Tests

Tests are written with Bun. There are two ways to run the test suite:

### Unit Tests (without database)

Run unit tests with the database stub:

```bash
npm test
# or
bun test
```

### Full Test Suite (with real PostgreSQL)

Run the complete test suite with a disposable PostgreSQL database:

```bash
npm run test:db
```

This command will:
1. Start a PostgreSQL 16 container on port 5433
2. Wait for the database to be ready
3. Run all database migrations
4. Execute the full test suite with real database operations
5. Stop and remove the test database container

**Requirements for database tests:**
- Docker must be installed and running
- Port 5433 must be available
- The test database uses: `postgresql://postgres:postgres@localhost:5433/intelliticket_test`

**Alternative: Using an existing PostgreSQL database:**

If you have PostgreSQL installed locally or access to a test database, you can run tests with:

```bash
DATABASE_URL="your-test-database-url" NODE_ENV=test bun test --timeout 30000
```

Make sure to use a separate test database as the tests may modify data.

To manually manage the test database:

```bash
# Start the test database
npm run test-db-up

# Stop and remove the test database
npm run test-db-down
```

### Quick Test Commands

- Run **`npm run test:unit`** for the fast stub-DB suite.
- Run **`npm run test:all`** (requires Docker) for the full integration + Playwright run.

## Docker

A `Dockerfile` is provided to build and run the application in a container.
Use it to containerize the project for production deployments.

## Recurring Chores

The application includes a sophisticated chore completion and reset system that tracks when users complete chores and automatically resets them based on their recurrence patterns.

### How It Works

1. **Chore Completion Tracking**: When a chore is completed via `POST /api/chores/:choreId/complete`, the system:
   - Creates a record in the `chore_completions` table with the completion timestamp
   - Creates a transaction for the earned tickets
   - Broadcasts the completion to connected clients

2. **Completion Status**: The `GET /api/chores?userId=X` endpoint returns chores with a `completed` boolean flag that indicates if the chore has been completed today (or within the recurrence period).

3. **Automatic Reset**: A daily job runs at 00:05 local time to clean up expired chore completions:
   - **Daily chores**: Completions older than 1 day are removed
   - **Weekly chores**: Completions older than 7 days are removed  
   - **Monthly chores**: Completions older than 31 days are removed

### Database Schema

The `chore_completions` table tracks completion history:

```sql
CREATE TABLE chore_completions (
  id SERIAL PRIMARY KEY,
  chore_id INTEGER REFERENCES chores(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  completion_datetime TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

- `POST /api/chores/:choreId/complete` - Mark a chore as completed (parent-only)
  - Body: `{ user_id: number }`
  - Creates completion record and transaction
  
- `GET /api/chores?userId=X` - Get chores with completion status for a user
  - Returns chores with `completed: boolean` field
  - Parents can view any user's status, children can only view their own

### Reset Job

The reset job (`/server/jobs/resetChores.ts`) can be:
- **Automatic**: Scheduled daily at 00:05 
- **Manual**: Triggered via `triggerManualReset()` function for testing

This system ensures that recurring chores become available again after their recurrence period while maintaining a complete history of when chores were completed.

## Goals Logic

The application supports a goal-tracking system where children can save tickets toward products they want. Goal progress is now calculated entirely from the user's current balance, making the system more reliable and consistent.

### How It Works

1. **Balance-Based Progress**: Goal progress is derived directly from the user's ticket balance
   - No separate tracking of "tickets saved" - your entire balance counts toward your active goal
   - Progress = `(user_balance * $0.25) / current_product_price * 100`
   
2. **Live Price Tracking**: Progress dynamically adjusts when product prices change:
   - Price increases → Progress percentage decreases
   - Price decreases → Progress percentage increases (capped at 100%)
   
3. **Automatic Updates**: Any transaction that changes your balance immediately updates goal progress:
   - Earning tickets from chores → Progress increases
   - Spending tickets → Progress decreases
   - No manual syncing or tracking needed

### Implementation Details

- `calculateGoalProgressFromBalance()` derives progress from user balance and current price
- The `tickets_saved` field has been removed from the goals table
- All API endpoints (`/api/goals/active`, `/api/stats`) calculate progress in real-time
- Goal switching is seamless - progress instantly reflects your current balance

### Example

A child with 80 tickets (worth $20) sets a goal for a $25 product:
- Initial progress: 80% 
- Earns 20 more tickets → Balance: 100 tickets → Progress: 100%
- Spends 40 tickets on something else → Balance: 60 tickets → Progress: 60%
- Product price drops to $15 → Progress jumps to 100%

This approach eliminates sync issues and ensures goal progress always reflects reality.

### Over-Save Behavior

When product prices decrease after a child has been saving, they may have more tickets than needed. The system handles this gracefully:

1. **Progress Capping**: Progress percentage is capped at 100% even if tickets saved exceed the current price
2. **Smart Spending**: When purchasing from a goal, only the tickets needed for the current price are deducted
3. **Refund Protection**: Remaining tickets stay in the child's balance for future use
4. **UI Indicators**: The dashboard shows an "Over-saved" badge indicating how many tickets will remain after purchase

#### Example Scenario

1. Child saves 100 tickets for a $25 product (100 tickets needed)
2. Product price drops to $15 (60 tickets needed)
3. Progress shows 100% with 40 tickets over-saved
4. When purchasing, only 60 tickets are spent, leaving 40 in the balance

This protects children from losing tickets when prices fluctuate and ensures fair value for their savings.

## Bonus System

The application includes a daily bonus system where children can earn bonus tickets through a spin wheel mechanism.

### Daily Bonus Features

1. **Automatic Assignment**: Each child is assigned a daily bonus that can be revealed through spinning
2. **Random Rewards**: Spin values are randomly selected from [1, 2, 3, 5, 8] tickets
3. **Once Per Day**: Each bonus can only be spun once, preventing duplicate rewards
4. **Parent Control**: Parents can spin bonuses on behalf of their children

### Bonus Reset Job

A scheduled job automatically resets all revealed bonuses at midnight, making them available for spinning again the next day.

#### Configuration

The reset job runs via `node-cron` at 00:00 server local time:

```javascript
// server/index.ts
cron.schedule("0 0 * * *", resetDailyBonuses, {
  timezone: "America/Los_Angeles" // Adjust to your server's timezone
});
```

#### How It Works

1. **Daily Reset**: At midnight, all bonuses with `revealed = true` are reset to `revealed = false`
2. **Ticket Preservation**: The `bonus_tickets` value is preserved for historical tracking
3. **Logging**: The job logs how many bonuses were reset each night
4. **Error Handling**: Failed resets are logged but don't crash the server

#### Timezone Considerations

- The cron job uses the server's local timezone by default
- To change timezone, modify the `timezone` option in the cron schedule
- **Container Deployments**: If running in a UTC container, adjust the cron string or timezone accordingly

#### Manual Testing

For testing purposes, you can manually trigger the reset by calling the storage method:

```javascript
const affectedRows = await storage.resetRevealedDailyBonuses();
console.log(`Reset ${affectedRows} bonuses`);
```

### API Endpoints

- `GET /api/bonus/today` - Get or create today's bonus for a user
- `POST /api/bonus/spin` - Spin the bonus wheel and claim tickets

### Database Schema

The `daily_bonus_simple` table tracks daily bonuses:

```sql
CREATE TABLE daily_bonus_simple (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bonus_tickets INTEGER NOT NULL,
  revealed BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);
```
