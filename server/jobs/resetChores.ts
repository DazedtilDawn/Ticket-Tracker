import { storage } from "../storage";

/**
 * Daily chore reset job
 * 
 * This job runs daily at 00:05 local time to clean up expired chore completions
 * based on each chore's recurrence pattern:
 * - Daily chores: delete completions older than 1 day
 * - Weekly chores: delete completions older than 7 days  
 * - Monthly chores: delete completions older than 31 days
 * 
 * This allows recurring chores to "reset" and become available again
 * after their recurrence period has passed.
 */
export async function resetExpiredChores(): Promise<void> {
  console.log("[CHORE_RESET_JOB] Starting daily chore reset job...");
  
  try {
    const deletedCount = await storage.resetExpiredCompletions();
    
    console.log(`[CHORE_RESET_JOB] Successfully completed. Deleted ${deletedCount} expired chore completions.`);
    
    // Log some statistics for monitoring
    const totalChores = await storage.getChores(true);
    console.log(`[CHORE_RESET_JOB] System stats: ${totalChores.length} active chores`);
    
  } catch (error) {
    console.error("[CHORE_RESET_JOB] Error during chore reset:", error);
    // Don't throw - we want the scheduler to continue running
  }
}

/**
 * Setup function to register the chore reset job with a scheduler
 * Call this from server startup to schedule the daily job
 */
export function scheduleChoreResetJob(): void {
  console.log("[CHORE_RESET_JOB] Scheduling daily chore reset job for 00:05...");
  
  // Calculate time until next 00:05
  const now = new Date();
  const next0005 = new Date();
  next0005.setHours(0, 5, 0, 0); // 00:05:00
  
  // If it's already past 00:05 today, schedule for tomorrow
  if (now > next0005) {
    next0005.setDate(next0005.getDate() + 1);
  }
  
  const timeUntilFirst = next0005.getTime() - now.getTime();
  
  console.log(`[CHORE_RESET_JOB] First run scheduled for: ${next0005.toISOString()}`);
  console.log(`[CHORE_RESET_JOB] Time until first run: ${Math.round(timeUntilFirst / 1000 / 60)} minutes`);
  
  // Schedule the first run
  setTimeout(() => {
    resetExpiredChores();
    
    // Then schedule it to run every 24 hours
    setInterval(() => {
      resetExpiredChores();
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
  }, timeUntilFirst);
}

/**
 * Manual trigger function for testing/debugging
 * Can be called directly to trigger a reset without waiting for the schedule
 */
export async function triggerManualReset(): Promise<number> {
  console.log("[CHORE_RESET_JOB] Manual reset triggered");
  await resetExpiredChores();
  return await storage.resetExpiredCompletions();
}