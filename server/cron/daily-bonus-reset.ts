import { storage } from "../storage";

/**
 * Daily bonus reset job
 * Resets all revealed daily bonuses back to unrevealed state
 * Runs at 00:00 server local time via node-cron
 */
export async function resetDailyBonuses(): Promise<void> {
  try {
    console.log("[CRON] Daily bonus reset job started at", new Date().toISOString());
    
    // Reset all revealed bonuses
    const affectedRows = await storage.resetRevealedDailyBonuses();
    
    console.log(`[CRON] Daily bonus reset completed. Reset ${affectedRows} bonuses.`);
    
    // TODO: If server runs in UTC container, adjust cron timezone
  } catch (error) {
    console.error("[CRON] Daily bonus reset job failed:", error);
    // TODO: Consider implementing error alerting/monitoring
  }
}