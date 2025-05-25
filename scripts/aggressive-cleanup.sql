-- Aggressive cleanup - Delete EVERYTHING except parent (503), Bryce (611), and Kiki (612)

BEGIN;

-- Show starting state
SELECT 'STARTING WITH:' as status, COUNT(*) as user_count FROM users;

-- Delete all related data for users we're removing
DELETE FROM transactions WHERE user_id NOT IN (503, 611, 612);
DELETE FROM goals WHERE user_id NOT IN (503, 611, 612);
DELETE FROM daily_bonus WHERE user_id NOT IN (503, 611, 612);
DELETE FROM trophy_awards WHERE child_id NOT IN (503, 611, 612);
DELETE FROM chore_completions WHERE user_id NOT IN (503, 611, 612);

-- Delete all users except our three
DELETE FROM users WHERE id NOT IN (503, 611, 612);

-- Clean up orphaned data
DELETE FROM products WHERE id NOT IN (SELECT DISTINCT product_id FROM goals WHERE product_id IS NOT NULL);
DELETE FROM chores WHERE created_by_user_id IS NOT NULL AND created_by_user_id NOT IN (503, 611, 612);

-- Fix family relationships
UPDATE users SET family_id = 503 WHERE id IN (503, 611, 612);

-- Ensure parent user has proper family_id
UPDATE users SET family_id = NULL WHERE id = 503;

-- Recalculate balances based on remaining transactions
UPDATE users u
SET balance_cache = (
    SELECT COALESCE(SUM(delta), 0)
    FROM transactions t
    WHERE t.user_id = u.id
);

-- Restore the welcome bonus transactions for Bryce and Kiki if they're missing
INSERT INTO transactions (user_id, delta, type, note, source, created_at)
SELECT u.id, 10, 'earn', 'Welcome bonus!', 'manual_add', '2025-05-24 14:47:06.152'
FROM users u
WHERE u.id = 611
AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.user_id = 611 AND t.note = 'Welcome bonus!'
);

INSERT INTO transactions (user_id, delta, type, note, source, created_at)
SELECT u.id, 10, 'earn', 'Welcome bonus!', 'manual_add', '2025-05-24 14:47:06.198'
FROM users u
WHERE u.id = 612
AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.user_id = 612 AND t.note = 'Welcome bonus!'
);

-- Update balance cache again after potential transaction inserts
UPDATE users u
SET balance_cache = (
    SELECT COALESCE(SUM(delta), 0)
    FROM transactions t
    WHERE t.user_id = u.id
);

-- Show final results
SELECT 'FINAL STATE:' as status;
SELECT id, username, name, role, family_id, balance_cache, profile_image_url, banner_color_preference 
FROM users 
ORDER BY id;

SELECT 'TRANSACTIONS:' as status;
SELECT user_id, delta, type, note, created_at 
FROM transactions 
ORDER BY user_id, created_at;

COMMIT;