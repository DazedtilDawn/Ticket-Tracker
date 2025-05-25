-- Aggressive cleanup to keep only the main family (parent 503, Bryce 611, Kiki 612)
BEGIN;

-- Show what we're starting with
SELECT 'BEFORE CLEANUP:' as status, COUNT(*) as total_users FROM users;

-- Fix the parent's family_id
UPDATE users SET family_id = 503 WHERE id = 503;

-- Delete all chore_completions for other users
DELETE FROM chore_completions WHERE user_id NOT IN (503, 611, 612);

-- Delete all trophy_awards for other users
DELETE FROM trophy_awards WHERE child_id NOT IN (503, 611, 612);

-- Delete all daily_bonus for other users
DELETE FROM daily_bonus WHERE user_id NOT IN (503, 611, 612);

-- Delete all goals for other users  
DELETE FROM goals WHERE user_id NOT IN (503, 611, 612);

-- Delete all transactions for other users
DELETE FROM transactions WHERE user_id NOT IN (503, 611, 612);

-- Delete all users except our main family
DELETE FROM users WHERE id NOT IN (503, 611, 612);

-- Reset any test data that might be lingering
UPDATE users SET balance_cache = 0 WHERE id IN (503, 611, 612);

-- Clean up any orphaned products not linked to active goals
DELETE FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM goals WHERE user_id IN (611, 612));

-- Show results
SELECT 'AFTER CLEANUP:' as status, COUNT(*) as total_users FROM users;
SELECT id, username, name, role, family_id, balance_cache FROM users ORDER BY id;

COMMIT;