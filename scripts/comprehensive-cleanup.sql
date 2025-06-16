-- Comprehensive cleanup to remove all test data except family with Kiki and Bryce
-- Preserving: user 503 (parent), 611 (Bryce), 612 (Kiki)

BEGIN;

-- Show what we're starting with
SELECT 'BEFORE CLEANUP:' as status;
SELECT COUNT(*) as total_users FROM users;

-- Create a temporary table with users to keep
CREATE TEMP TABLE users_to_keep (user_id INTEGER);
INSERT INTO users_to_keep VALUES (503), (611), (612);

-- Also keep demo_parent from our recent test
INSERT INTO users_to_keep 
SELECT id FROM users WHERE username = 'demo_parent';

-- Clean up all related tables first
DELETE FROM transactions WHERE user_id NOT IN (SELECT user_id FROM users_to_keep);
DELETE FROM goals WHERE user_id NOT IN (SELECT user_id FROM users_to_keep);
DELETE FROM daily_bonus WHERE user_id NOT IN (SELECT user_id FROM users_to_keep);
DELETE FROM trophy_awards WHERE child_id NOT IN (SELECT user_id FROM users_to_keep);
DELETE FROM chore_completions WHERE user_id NOT IN (SELECT user_id FROM users_to_keep);

-- Delete products that don't have any goals
DELETE FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM goals WHERE product_id IS NOT NULL);

-- Delete chores created by test users (keeping system chores)
DELETE FROM chores WHERE created_by_user_id IS NOT NULL AND created_by_user_id NOT IN (SELECT user_id FROM users_to_keep);

-- Now delete all users except the ones we want to keep
DELETE FROM users WHERE id NOT IN (SELECT user_id FROM users_to_keep);

-- Update family relationships
UPDATE users SET family_id = 503 WHERE id IN (503, 611, 612);

-- Recalculate balances
UPDATE users u
SET balance_cache = (
    SELECT COALESCE(SUM(delta), 0)
    FROM transactions t
    WHERE t.user_id = u.id
)
WHERE id IN (SELECT user_id FROM users_to_keep);

-- Show results
SELECT 'AFTER CLEANUP:' as status;
SELECT COUNT(*) as total_users FROM users;

SELECT 'REMAINING USERS:' as status;
SELECT id, username, name, role, family_id, balance_cache 
FROM users 
ORDER BY role DESC, id;

-- Drop temp table
DROP TABLE users_to_keep;

COMMIT;