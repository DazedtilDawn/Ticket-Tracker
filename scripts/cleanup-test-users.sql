-- Cleanup script to remove all test users except the parent family with Kiki and Bryce
-- Preserving users: 503 (parent), 611 (Bryce), 612 (Kiki)

BEGIN;

-- First, let's see what we're about to delete
SELECT COUNT(*) as total_users_before FROM users;

-- Show users we're keeping
SELECT 'KEEPING:' as status, id, username, name, role, family_id 
FROM users 
WHERE id IN (503, 611, 612)
ORDER BY id;

-- Show count of users to be deleted
SELECT COUNT(*) as users_to_delete 
FROM users 
WHERE id NOT IN (503, 611, 612);

-- Delete all transactions for users except our preserved ones
DELETE FROM transactions 
WHERE user_id NOT IN (503, 611, 612);

-- Delete all goals for users except our preserved ones
DELETE FROM goals 
WHERE user_id NOT IN (503, 611, 612);

-- Delete all daily_bonus records for users except our preserved ones
DELETE FROM daily_bonus 
WHERE user_id NOT IN (503, 611, 612);

-- Delete all trophy_awards for users except our preserved ones
DELETE FROM trophy_awards 
WHERE child_id NOT IN (503, 611, 612);

-- Delete all chore_completions for users except our preserved ones
DELETE FROM chore_completions 
WHERE user_id NOT IN (503, 611, 612);

-- Finally, delete all users except our preserved ones
DELETE FROM users 
WHERE id NOT IN (503, 611, 612);

-- Update family_id for parent user if needed
UPDATE users 
SET family_id = 503 
WHERE id = 503;

-- Verify the results
SELECT 'REMAINING USERS:' as status;
SELECT id, username, name, role, family_id, balance_cache 
FROM users 
ORDER BY id;

-- Reset balance cache for our users based on actual transactions
UPDATE users u
SET balance_cache = (
    SELECT COALESCE(SUM(delta), 0)
    FROM transactions t
    WHERE t.user_id = u.id
)
WHERE id IN (503, 611, 612);

-- Show final state
SELECT 'FINAL STATE:' as status;
SELECT id, username, name, role, family_id, balance_cache 
FROM users 
WHERE id IN (503, 611, 612)
ORDER BY id;

COMMIT;