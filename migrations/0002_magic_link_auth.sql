-- Migration for Magic Link Auth & Schema Updates

-- Add email column to users table for magic link auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Rename password to passwordHash for better semantics
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- Add balance_cache column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_cache INTEGER NOT NULL DEFAULT 0;

-- Add createdAt to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  primary_parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add familyId to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_id INTEGER REFERENCES families(id) ON DELETE SET NULL;

-- Rename tickets to baseTickets in chores
ALTER TABLE chores RENAME COLUMN tickets TO base_tickets;

-- Add createdByUserId to chores
ALTER TABLE chores ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add createdAt to chores
ALTER TABLE chores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Create chore_completions table
CREATE TABLE IF NOT EXISTS chore_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chore_completions_user_chore_day UNIQUE(user_id, chore_id, completion_date)
);

-- Update transactions table
ALTER TABLE transactions RENAME COLUMN delta_tickets TO delta;
ALTER TABLE transactions RENAME COLUMN date TO created_at;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS to_shared_goal_id INTEGER;

-- Update dailyBonus table
ALTER TABLE daily_bonus RENAME COLUMN user_id TO userId;
ALTER TABLE daily_bonus RENAME COLUMN assigned_chore_id TO assignedChoreId;
ALTER TABLE daily_bonus RENAME COLUMN bonus_date TO bonusDate;
ALTER TABLE daily_bonus RENAME COLUMN is_override TO isOverride;
ALTER TABLE daily_bonus RENAME COLUMN is_spun TO isSpun;
ALTER TABLE daily_bonus RENAME COLUMN trigger_type TO triggerType;
ALTER TABLE daily_bonus RENAME COLUMN spin_result_tickets TO spinResultTickets;
ALTER TABLE daily_bonus RENAME COLUMN pending_multiplier TO pendingMultiplier;
ALTER TABLE daily_bonus ADD COLUMN IF NOT EXISTS respin_used BOOLEAN NOT NULL DEFAULT FALSE;

-- Add login_tokens table for magic link authentication
CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consumed_at TIMESTAMP WITH TIME ZONE,
  ip_fingerprint TEXT
);

-- Create index on login_tokens for user_id
CREATE INDEX IF NOT EXISTS login_tokens_user_idx ON login_tokens (user_id);