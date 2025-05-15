-- daily_bonus ----------------------------------------------------
ALTER TABLE daily_bonus RENAME COLUMN userid            TO user_id;
ALTER TABLE daily_bonus RENAME COLUMN bonusdate         TO bonus_date;
ALTER TABLE daily_bonus RENAME COLUMN assignedchoreid   TO assigned_chore_id;
ALTER TABLE daily_bonus RENAME COLUMN triggertype       TO trigger_type;
ALTER TABLE daily_bonus RENAME COLUMN isoverride        TO is_override;
ALTER TABLE daily_bonus RENAME COLUMN isspun            TO is_spun;
ALTER TABLE daily_bonus RENAME COLUMN spinresulttickets TO spin_result_tickets;
ALTER TABLE daily_bonus RENAME COLUMN pendingmultiplier TO pending_multiplier;

-- Fix column default value issues
ALTER TABLE daily_bonus ALTER COLUMN spin_result_tickets DROP NOT NULL;