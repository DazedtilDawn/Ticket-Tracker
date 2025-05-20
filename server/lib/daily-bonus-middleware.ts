import { Request, Response, NextFunction } from 'express';
import { IStorage } from '../storage';

/**
 * Middleware to automatically assign daily bonus chores when a parent logs in or accesses a protected route.
 * This will ensure each child gets one random, eligible bonus chore per day if one hasn't been assigned yet.
 *
 * @param storage The storage interface for database operations
 * @returns Express middleware function
 */
export function DailyBonusAssignmentMiddleware(storage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if no authenticated user or user is not a parent
      if (!req.user || req.user.role !== 'parent') {
        return next();
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Log for debugging
      console.log(`[DailyBonusMiddleware] Parent ${req.user.id} (${req.user.username}) accessed system at ${new Date().toISOString()}`);
      
      // Get all child users
      const childUsers = await storage.getUsersByRole('child');
      if (childUsers.length === 0) {
        console.log('[DailyBonusMiddleware] No child users found, skipping bonus assignment');
        return next();
      }
      
      // Track if we assigned any new bonuses
      let assignedCount = 0;
      
      // Check and assign for each child
      for (const child of childUsers) {
        // Check if child already has a bonus for today
        const existingBonus = await storage.getDailyBonus(today, child.id);
        
        if (existingBonus) {
          console.log(`[DailyBonusMiddleware] Child ${child.id} (${child.name}) already has a bonus for today:`, {
            id: existingBonus.id,
            assigned_chore_id: existingBonus.assigned_chore_id,
            is_spun: existingBonus.is_spun,
            trigger_type: existingBonus.trigger_type
          });
          continue;
        }
        
        try {
          // Assign a bonus chore to this child
          const bonus = await storage.assignDailyBonusChore(child.id, today);
          
          if (bonus) {
            assignedCount++;
            console.log(`[DailyBonusMiddleware] Assigned bonus chore ${bonus.assigned_chore_id} to child ${child.id} (${child.name})`);
          } else {
            console.log(`[DailyBonusMiddleware] Could not assign bonus chore to child ${child.id} (${child.name}) - no eligible chores`);
          }
        } catch (error) {
          console.error(`[DailyBonusMiddleware] Error assigning bonus to child ${child.id}:`, error);
          // Continue to next child, don't fail the entire process
        }
      }
      
      if (assignedCount > 0) {
        console.log(`[DailyBonusMiddleware] Successfully assigned ${assignedCount} new bonus chores`);
      }
      
      // Continue with the request
      next();
    } catch (error) {
      console.error("[DailyBonusMiddleware] Error in daily bonus assignment middleware:", error);
      // Don't fail the request if bonus assignment has an error
      next();
    }
  };
}
