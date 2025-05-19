CREATE OR REPLACE FUNCTION ensure_daily_bonus_is_spun_consistency()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_spun := NEW.spin_result_tickets IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER daily_bonus_is_spun_consistency
BEFORE INSERT OR UPDATE ON "daily_bonus"
FOR EACH ROW EXECUTE FUNCTION ensure_daily_bonus_is_spun_consistency();
