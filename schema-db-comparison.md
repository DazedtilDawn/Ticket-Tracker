# Schema.ts vs Test Database Comparison Report

## Missing Tables

The following tables are defined in schema.ts but do not exist in the test database:

1. **families** - Family management table
2. **awarded_items** - Trophy award system table
3. **chore_completions** - Dedicated chore completion tracking
4. **daily_bonus_simple** - Simple daily bonus system

## Missing Enums

The following enum is defined in schema.ts but does not exist in the test database:

1. **reward_type** enum with values: ['tickets', 'spin']

## Missing/Different Columns

### users table
**Missing columns:**
- `email` (text, not null, unique)
- `passwordHash` (text, not null) - Note: DB has `password` instead
- `profile_image_url` (text)
- `banner_image_url` (text)
- `banner_color_preference` (text)
- `is_archived` (boolean, not null, default false)
- `balance_cache` (integer)
- `created_at` (timestamp with timezone)
- `family_id` (integer, references families.id with CASCADE delete)

**Different columns:**
- DB has `password` but schema.ts expects `passwordHash`

### chores table
**Missing columns:**
- `base_tickets` (integer, not null) - Note: DB has `tickets` instead
- `created_by_user_id` (integer, references users.id with CASCADE delete)
- `created_at` (timestamp with timezone, default now)

**Different columns:**
- DB has `tickets` but schema.ts expects `base_tickets`

### products table
**Extra columns in DB (not in schema.ts):**
- `price_locked_cents` (integer) - This should be removed per migration 0003

**Missing columns:**
- Schema expects timestamps WITH timezone but DB has WITHOUT timezone for:
  - `last_checked`
  - `camel_last_checked`

### goals table
**Missing columns:**
- `purchased_at` (timestamp with timezone)

**Extra columns in DB (not in schema.ts):**
- `tickets_saved` (integer, not null, default 0) - This should be removed per migration 0004

### transactions table
**Missing columns:**
- `delta` (integer, not null) - Note: DB has `delta_tickets` instead
- `created_at` (timestamp with timezone, default now) - Note: DB has `date` instead
- `metadata` (text)
- `to_shared_goal_id` (integer, references goals.id with CASCADE delete)

**Different columns:**
- DB has `delta_tickets` but schema.ts expects `delta`
- DB has `date` but schema.ts expects `created_at`
- Schema expects timestamp WITH timezone but DB has WITHOUT timezone

### daily_bonus table
**Missing columns:**
- Schema expects `created_at` WITH timezone but DB has WITHOUT timezone

**Missing "respin" value in bonus_trigger enum:**
- DB has: ['chore_completion', 'good_behavior_reward']
- Schema expects: ['chore_completion', 'good_behavior_reward', 'respin']

## Missing Indexes

The following indexes are defined in schema.ts but do not exist in the test database:

### goals table
- `goals_user_id_idx` on (user_id)

### transactions table
- `transactions_user_id_idx` on (user_id)
- `transactions_chore_id_idx` on (chore_id)
- `transactions_goal_id_idx` on (goal_id)
- `transactions_ref_id_idx` on (ref_id)

### daily_bonus table
- `daily_bonus_user_id_idx` on (user_id)
- `daily_bonus_assigned_chore_id_idx` on (assigned_chore_id)

### chore_completions table (entire table missing)
- `chore_user_date_idx` UNIQUE on (chore_id, user_id, completion_datetime)
- `chore_completions_user_id_idx` on (user_id)
- `chore_completions_chore_id_idx` on (chore_id)

## Foreign Key Constraints

### Missing CASCADE delete constraints:
1. **users table**: Missing foreign key to families.id
2. **chores table**: Missing foreign key for created_by_user_id to users.id
3. **goals table**: Missing CASCADE delete on user_id and product_id foreign keys
4. **transactions table**: 
   - Missing CASCADE delete on user_id, chore_id, goal_id foreign keys
   - Missing foreign key for to_shared_goal_id
   - Missing foreign key constraint for ref_id (noted in schema.ts comment)

## Summary of Required Migrations

1. **Create missing tables**: families, awarded_items, chore_completions, daily_bonus_simple
2. **Add missing enum**: reward_type
3. **Add "respin" to bonus_trigger enum**
4. **Rename columns**:
   - users.password → passwordHash
   - chores.tickets → base_tickets
   - transactions.delta_tickets → delta
   - transactions.date → created_at
5. **Add missing columns** to existing tables (see detailed list above)
6. **Remove deprecated columns**:
   - products.price_locked_cents
   - goals.tickets_saved
7. **Convert timestamps to WITH timezone**
8. **Add missing indexes**
9. **Update foreign key constraints to include CASCADE delete where specified**
10. **Add foreign key constraint for transactions.ref_id to daily_bonus.id**