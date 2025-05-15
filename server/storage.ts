import {
  User,
  InsertUser,
  Chore,
  InsertChore,
  Product,
  InsertProduct,
  Goal,
  InsertGoal,
  Transaction,
  InsertTransaction,
  DailyBonus,
  InsertDailyBonus,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Chore operations
  getChore(id: number): Promise<Chore | undefined>;
  getChores(activeOnly?: boolean): Promise<Chore[]>;
  createChore(chore: InsertChore): Promise<Chore>;
  updateChore(id: number, chore: Partial<InsertChore>): Promise<Chore | undefined>;
  deleteChore(id: number): Promise<boolean>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductByAsin(asin: string): Promise<Product | undefined>;
  getProductsByTitle(partialTitle: string, exactMatch?: boolean): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Goal operations
  getGoal(id: number): Promise<Goal | undefined>;
  getGoalWithProduct(id: number): Promise<(Goal & { product: Product }) | undefined>;
  getGoalsByUser(userId: number): Promise<Goal[]>;
  getGoalsByProductId(productId: number): Promise<Goal[]>;
  getActiveGoalByUser(userId: number): Promise<(Goal & { product: Product }) | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, update: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;
  getUserTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  getUserTransactionsWithDetails(userId: number, limit?: number): Promise<(Transaction & { chore?: Chore, goal?: Goal & { product?: Product }})[]>;
  getUserBalance(userId: number): Promise<number>;
  hasCompletedChoreToday(userId: number, choreId: number): Promise<boolean>;
  
  // Daily Bonus operations
  getDailyBonus(date?: string, userId?: number): Promise<DailyBonus | undefined>;
  getDailyBonusById(id: number): Promise<DailyBonus | undefined>;
  createDailyBonus(bonus: InsertDailyBonus): Promise<DailyBonus>;
  deleteDailyBonus(userId: number, date?: string): Promise<boolean>;
  assignDailyBonusChore(childId: number, date: string): Promise<DailyBonus | null>;
  assignDailyBonusesToAllChildren(date?: string): Promise<Record<number, DailyBonus | null>>;
  getChoreWithBonus(choreId: number, date?: string, userId?: number): Promise<(Chore & { bonus_tickets: number }) | undefined>;
}

import { db } from "./db";
import { 
  users, chores, products, goals, transactions, dailyBonus
} from "@shared/schema";
import { eq, and, desc, gte, sql, ilike, lt, ne } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // Daily Bonus operations
  async getDailyBonus(date?: string, userId?: number): Promise<DailyBonus | undefined> {
    const today = date || new Date().toISOString().split('T')[0];
    
    console.log(`[GET_BONUS] Looking for daily bonus with date=${today}${userId ? ` and userId=${userId}` : ''}`);
    
    try {
      let bonus: DailyBonus | undefined;
      
      if (userId) {
        // Get bonus for specific user
        const result = await db
          .select()
          .from(dailyBonus)
          .where(
            and(
              eq(dailyBonus.bonusDate, today),
              eq(dailyBonus.userId, userId)
            )
          );
          
        if (result.length > 0) {
          bonus = result[0];
          console.log(`[GET_BONUS] Found daily bonus for user ${userId} on ${today}:`, {
            id: bonus.id,
            assignedChoreId: bonus.assignedChoreId,
            isSpun: bonus.isSpun, // Critical field we're debugging
            triggerType: bonus.triggerType
          });
        } else {
          console.log(`[GET_BONUS] No daily bonus found for user ${userId} on date ${today}`);
        }
      } else {
        // Get any bonus for the date (for backward compatibility)
        const result = await db
          .select()
          .from(dailyBonus)
          .where(eq(dailyBonus.bonusDate, today));
        
        if (result.length > 0) {
          bonus = result[0];
          console.log(`[GET_BONUS] Found daily bonus for date ${today} (no user specified):`, {
            id: bonus.id,
            userId: bonus.userId,
            isSpun: bonus.isSpun, // Critical field we're debugging
            triggerType: bonus.triggerType
          });
        } else {
          console.log(`[GET_BONUS] No daily bonus found for date ${today} (no user specified)`);
        }
      }
      
      return bonus;
    } catch (error) {
      console.error('[GET_BONUS] Error retrieving daily bonus:', error);
      throw error;
    }
  }
  
  async getDailyBonusById(id: number): Promise<DailyBonus | undefined> {
    const [bonus] = await db
      .select()
      .from(dailyBonus)
      .where(eq(dailyBonus.id, id));
    
    return bonus;
  }
  
  async createDailyBonus(bonus: InsertDailyBonus): Promise<DailyBonus> {
    console.log(`[CREATE_BONUS] Creating new daily bonus with params:`, {
      bonusDate: bonus.bonusDate,
      userId: bonus.userId,
      assignedChoreId: bonus.assignedChoreId,
      isOverride: bonus.isOverride,
      isSpun: bonus.isSpun, // Critical field we're debugging
      triggerType: bonus.triggerType
    });
    
    try {
      const [newBonus] = await db
        .insert(dailyBonus)
        .values(bonus)
        .returning();
      
      console.log(`[CREATE_BONUS] Successfully created daily bonus with ID ${newBonus.id}:`, {
        isSpun: newBonus.isSpun // Confirm the value after creation
    });
    
      return newBonus;
    } catch (error) {
      console.error('[CREATE_BONUS] Error creating daily bonus:', error);
      throw error;
    }
  }
  
  async deleteDailyBonus(userId: number, date?: string): Promise<boolean> {
    const today = date || new Date().toISOString().split('T')[0];
    
    console.log(`[DELETE_BONUS] Deleting daily bonus for user ${userId} on date ${today}`);
    
    try {
      // First get the current bonus for logging purposes
      const currentBonus = await this.getDailyBonus(today, userId);
      if (currentBonus) {
        console.log(`[DELETE_BONUS] Found daily bonus to delete:`, {
          id: currentBonus.id,
          assignedChoreId: currentBonus.assignedChoreId,
          isSpun: currentBonus.isSpun,
          triggerType: currentBonus.triggerType
        });
      } else {
        console.log(`[DELETE_BONUS] No existing daily bonus found for user ${userId} on date ${today}`);
      }
      
      // Delete the existing record
      const result = await db
        .delete(dailyBonus)
        .where(
          and(
            eq(dailyBonus.userId, userId),
            eq(dailyBonus.bonusDate, today)
          )
        );
      
      console.log(`[DELETE_BONUS] Daily bonus deletion complete for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[DELETE_BONUS] Error deleting daily bonus:', error);
      return false;
    }
  }
  
  async assignDailyBonusChore(childId: number, date: string): Promise<DailyBonus | null> {
    console.log(`[BONUS_ASSIGN] Starting bonus assignment for child ${childId} on date ${date}`);
    
    try {
      // Check if a bonus already exists for this child and date
      const existingBonus = await this.getDailyBonus(date, childId);
      if (existingBonus) {
        console.log(`[BONUS_ASSIGN] Daily bonus for user ${childId} on ${date} already exists:`, {
          id: existingBonus.id,
          assignedChoreId: existingBonus.assignedChoreId,
          isSpun: existingBonus.isSpun,
          triggerType: existingBonus.triggerType
        });
        
        // BUGFIX: If we found a bonus with isSpun incorrectly set to true, fix it here
        if (existingBonus.isSpun) {
          console.log(`[BONUS_ASSIGN] IMPORTANT: Existing bonus for user ${childId} is marked as already spun.`);
          console.log(`[BONUS_ASSIGN] DEBUG FIX: Resetting isSpun to false to allow wheel to trigger.`);
          
          try {
            // Fix the isSpun flag so the wheel can be triggered
            await db
              .update(dailyBonus)
              .set({ isSpun: false })
              .where(eq(dailyBonus.id, existingBonus.id));
              
            console.log(`[BONUS_ASSIGN] Successfully reset isSpun flag to false for bonus ${existingBonus.id}`);
            
            // Re-fetch the updated bonus
            const updatedBonus = await this.getDailyBonusById(existingBonus.id);
            if (updatedBonus) {
              console.log(`[BONUS_ASSIGN] Updated bonus state:`, {
                id: updatedBonus.id,
                isSpun: updatedBonus.isSpun
              });
              return updatedBonus;
            }
          } catch (err) {
            console.error(`[BONUS_ASSIGN] Error resetting isSpun flag:`, err);
          }
        }
        
        return existingBonus;
      }
      
      // Get all active chores
      const activeChores = await this.getChores(true);
      console.log(`[BONUS_ASSIGN] Found ${activeChores.length} active chores to choose from for user ${childId}`);
      
      if (activeChores.length === 0) {
        console.log(`[BONUS_ASSIGN] No active chores found for assigning daily bonus`);
        return null;
      }
    
      // Filter out chores that were assigned as bonus within the last day
      const oneDayAgo = new Date(date);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];
      
      // BUGFIX: Check if we need to bypass the cooldown for debugging
      const bypassCooldown = process.env.NODE_ENV === 'development';
      console.log(`[BONUS_ASSIGN] Debug environment detected: ${bypassCooldown ? 'Bypassing cooldown checks' : 'Using normal cooldown rules'}`);
      
      // Filter for DAILY chores that aren't on cooldown
      const eligibleChores = activeChores.filter(chore => {
        // Only select daily chores for bonuses
        const isDaily = chore.recurrence === 'daily';
        
        // Check cooldown: If lastBonusAssigned is null or before the cooldown period, it's eligible
        // In development mode, bypass the cooldown check to allow testing
        const offCooldown = bypassCooldown || !chore.lastBonusAssigned || chore.lastBonusAssigned < oneDayAgoStr;
        
        const eligible = isDaily && offCooldown;
        
        // Log detailed eligibility info for each chore
        console.log(`[BONUS_ASSIGN] Chore ${chore.id} (${chore.name}) eligibility:`, {
          isDaily,
          recurrence: chore.recurrence,
          lastBonusAssigned: chore.lastBonusAssigned || 'never',
          offCooldown,
          eligible
        });
        
        return eligible;
      });
      
      if (eligibleChores.length === 0) {
        console.log(`[BONUS_ASSIGN] No eligible daily chores found for assigning daily bonus (all on cooldown or not daily)`);
        return null;
      }
      
      console.log(`[BONUS_ASSIGN] Found ${eligibleChores.length} eligible daily chores for bonus assignment`);
      
      // Randomly select one eligible chore
      const selectedChore = eligibleChores[Math.floor(Math.random() * eligibleChores.length)];
      console.log(`Selected chore ${selectedChore.id} (${selectedChore.name}) for daily bonus`);
      
      // Create a new daily bonus record
      const newBonus: InsertDailyBonus = {
        bonusDate: date,
        userId: childId,
        assignedChoreId: selectedChore.id,
        isOverride: false,
        isSpun: false,
        triggerType: 'chore_completion',
        spinResultTickets: 0  // Default to 0 tickets until wheel is spun
      };
      
      const createdBonus = await this.createDailyBonus(newBonus);
      
      // Update the selected chore's lastBonusAssigned date
      await this.updateChore(selectedChore.id, {
        lastBonusAssigned: date
      });
      
      console.log(`Daily bonus created successfully for user ${childId}, chore ${selectedChore.id} on ${date}`);
      return createdBonus;
    } catch (error) {
      console.error(`[BONUS_ASSIGN] Error assigning daily bonus to child ${childId}:`, error);
      return null;
    }
  }

  async assignDailyBonusesToAllChildren(date?: string): Promise<Record<number, DailyBonus | null>> {
    const today = date || new Date().toISOString().split('T')[0];
    console.log(`Assigning daily bonuses to all children for date ${today}`);
    
    try {
      // Get all child users
      const childUsers = await this.getUsersByRole('child');
      if (childUsers.length === 0) {
        console.log('No child users found to assign daily bonuses');
        return {};
      }
      
      // Assign bonus chores to each child
      const results: Record<number, DailyBonus | null> = {};
      
      for (const child of childUsers) {
        // Assign a bonus to this child
        console.log(`Assigning daily bonus for child ${child.id} (${child.name})`);
        try {
          const bonus = await this.assignDailyBonusChore(child.id, today);
          results[child.id] = bonus;
        } catch (error) {
          console.error(`Error assigning daily bonus to child ${child.id} (${child.name}):`, error);
          results[child.id] = null;
        }
      }
      
      console.log(`Daily bonus assignment complete for ${childUsers.length} children`);
      return results;
    } catch (error) {
      console.error(`Error in assignDailyBonusesToAllChildren:`, error);
      return {};
    }
  }
  
  async getChoreWithBonus(choreId: number, date?: string, userId?: number): Promise<(Chore & { bonusTickets: number }) | undefined> {
    const today = date || new Date().toISOString().split('T')[0];
    
    try {
      let query = db
        .select({
          id: chores.id,
          name: chores.name,
          description: chores.description,
          baseTickets: chores.baseTickets,
          recurrence: chores.recurrence,
          emoji: chores.emoji,
          isActive: chores.isActive,
          lastBonusAssigned: chores.lastBonusAssigned,
          createdByUserId: chores.createdByUserId,
          bonusTickets: dailyBonus.spinResultTickets
        })
        .from(chores)
        .innerJoin(
          dailyBonus,
          and(
            eq(dailyBonus.assignedChoreId, chores.id),
            eq(dailyBonus.bonusDate, today)
          )
        )
        .where(eq(chores.id, choreId));
      
      // If a specific user is requested, filter bonus chores for that user
      const baseConditions = eq(chores.id, choreId);
      if (userId) {
        query = db
          .select({
            id: chores.id,
            name: chores.name,
            description: chores.description,
            baseTickets: chores.baseTickets,
            recurrence: chores.recurrence,
            emoji: chores.emoji,
            isActive: chores.isActive,
            lastBonusAssigned: chores.lastBonusAssigned,
            createdByUserId: chores.createdByUserId,
            bonusTickets: dailyBonus.spinResultTickets
          })
          .from(chores)
          .innerJoin(
            dailyBonus,
            and(
              eq(dailyBonus.assignedChoreId, chores.id),
              eq(dailyBonus.bonusDate, today),
              eq(dailyBonus.userId, userId)
            )
          )
          .where(baseConditions);
      }
      
      const [result] = await query;
      
      // If a result is found but bonusTickets is null, treat it as 0
      if (result && result.bonusTickets === null) {
        return {
          ...result,
          bonusTickets: 0
        };
      }
      
      return result;
    } catch (error) {
      console.error(`[GET_CHORE_WITH_BONUS] Error fetching chore with bonus for choreId ${choreId}:`, error);
      return undefined;
    }
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  // Chore operations
  async getChore(id: number): Promise<Chore | undefined> {
    const results = await db.select().from(chores).where(eq(chores.id, id));
    return results[0];
  }

  async getChores(activeOnly = true): Promise<Chore[]> {
    if (activeOnly) {
      return db.select().from(chores).where(eq(chores.isActive, true));
    }
    return db.select().from(chores);
  }

  async createChore(insertChore: InsertChore): Promise<Chore> {
    try {
      console.log("Storage: Creating chore with data:", insertChore);
      const [chore] = await db.insert(chores).values(insertChore).returning();
      console.log("Storage: Chore created successfully:", chore);
      return chore;
    } catch (error) {
      console.error("Storage: Error creating chore:", error);
      throw error;
    }
  }

  async updateChore(id: number, update: Partial<InsertChore>): Promise<Chore | undefined> {
    const [updatedChore] = await db
      .update(chores)
      .set(update)
      .where(eq(chores.id, id))
      .returning();
    return updatedChore;
  }

  async deleteChore(id: number): Promise<boolean> {
    const result = await db.delete(chores).where(eq(chores.id, id));
    return !!result;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const results = await db.select().from(products).where(eq(products.id, id));
    return results[0];
  }

  async getProductByAsin(asin: string): Promise<Product | undefined> {
    const results = await db.select().from(products).where(eq(products.asin, asin));
    return results[0];
  }
  
  async getProductsByTitle(partialTitle: string, exactMatch: boolean = false): Promise<Product[]> {
    if (exactMatch) {
      // If exactMatch is true, we look for exact title matches (case insensitive)
      const results = await db.select().from(products).where(
        ilike(products.title, partialTitle)
      );
      return results;
    } else {
      // Otherwise do partial matching with wildcards
      const results = await db.select().from(products).where(
        ilike(products.title, `%${partialTitle}%`)
      );
      return results;
    }
  }
  
  async getAllProducts(): Promise<Product[]> {
    // Return all products in the database
    return db.select().from(products);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // Ensure priceLockedCents is set if not provided
    const productData = {
      ...insertProduct,
      priceLockedCents: insertProduct.priceLockedCents || insertProduct.priceCents,
      lastChecked: new Date()
    };
    
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...update,
        last_checked: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      // First check if the product exists
      const productExists = await this.getProduct(id);
      if (!productExists) {
        return false;
      }
      
      // Delete the product
      await db.delete(products).where(eq(products.id, id));
      
      // Verify deletion
      const stillExists = await this.getProduct(id);
      return !stillExists;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }
  
  async getGoalsByProductId(productId: number): Promise<Goal[]> {
    const results = await db
      .select()
      .from(goals)
      .where(eq(goals.product_id, productId));
    return results;
  }

  // Goal operations
  async getGoal(id: number): Promise<Goal | undefined> {
    const results = await db.select().from(goals).where(eq(goals.id, id));
    return results[0];
  }
  
  async getGoalWithProduct(id: number): Promise<(Goal & { product: Product }) | undefined> {
    const result = await db
      .select({
        id: goals.id,
        user_id: goals.user_id,
        product_id: goals.product_id,
        tickets_saved: goals.tickets_saved,
        is_active: goals.is_active,
        product: products
      })
      .from(goals)
      .where(eq(goals.id, id))
      .innerJoin(products, eq(goals.product_id, products.id));
      
    return result[0];
  }

  async getGoalsByUser(userId: number): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.user_id, userId));
  }
  
  async getActiveGoalByUser(userId: number): Promise<(Goal & { product: Product }) | undefined> {
    try {
      const result = await db
        .select({
          id: goals.id,
          userId: goals.userId,
          productId: goals.productId,
          ticketsSaved: goals.ticketsSaved,
          isActive: goals.isActive,
          product: products
        })
        .from(goals)
        .where(and(
          eq(goals.userId, userId),
          eq(goals.isActive, true)
        ))
        .innerJoin(products, eq(goals.productId, products.id));
        
      return result[0];
    } catch (error) {
      console.error(`[GET_ACTIVE_GOAL] Error getting active goal for user ${userId}:`, error);
      return undefined;
    }
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    // If we're creating a new goal, deactivate other goals for this user
    await db
      .update(goals)
      .set({ is_active: false })
      .where(and(
        eq(goals.user_id, insertGoal.user_id),
        eq(goals.is_active, true)
      ));
    
    const goalData = {
      ...insertGoal,
      tickets_saved: 0,
      is_active: true
    };
    
    const [goal] = await db.insert(goals).values(goalData).returning();
    return goal;
  }

  async updateGoal(id: number, update: Partial<Goal>): Promise<Goal | undefined> {
    console.log(`[GOAL_DEBUG] Updating goal ${id} with:`, update);
    
    // Special handling for goal activation
    if (update.is_active === true) {
      try {
        // Get the current goal
        const currentGoal = await this.getGoal(id);
        if (!currentGoal) {
          console.error(`[GOAL_DEBUG] Goal ${id} not found for activation`);
          return undefined;
        }
        console.log(`[GOAL_DEBUG] Current goal info for activation:`, currentGoal);
        
        // Get the user ID
        const userId = currentGoal.user_id;
        
        // Find the currently active goal for this user
        const [activeGoal] = await db
          .select()
          .from(goals)
          .where(and(
            eq(goals.user_id, userId),
            eq(goals.is_active, true)
          ));
        
        console.log(`[GOAL_DEBUG] Current active goal for user ${userId}:`, activeGoal || 'None');
        
        // Determine tickets to transfer
        let ticketsToTransfer = 0;
        if (activeGoal && activeGoal.id !== id) {
          ticketsToTransfer = activeGoal.tickets_saved ?? 0;
          console.log(`[GOAL_DEBUG] Will transfer ${ticketsToTransfer} tickets from goal ${activeGoal.id} to goal ${id}`);
          
          // First, deactivate the previously active goal
          console.log(`[GOAL_DEBUG] Deactivating previous active goal ${activeGoal.id}`);
          await db
            .update(goals)
            .set({ is_active: false })
            .where(eq(goals.id, activeGoal.id));
        }
        
        // Now, update the current goal with the transferred tickets and activate it
        console.log(`[GOAL_DEBUG] Activating goal ${id} with ${ticketsToTransfer} tickets`);
        const [updatedGoal] = await db
          .update(goals)
          .set({ 
            is_active: true,
            tickets_saved: ticketsToTransfer
          })
          .where(eq(goals.id, id))
          .returning();
        
        if (updatedGoal) {
          console.log(`[GOAL_DEBUG] Successfully activated goal ${id} with tickets:`, updatedGoal.tickets_saved);
        }
        
        return updatedGoal;
      } catch (error) {
        console.error(`[GOAL_DEBUG] Error during goal activation:`, error);
        return undefined;
      }
    } else {
      // Standard update for non-activation changes
      console.log(`[GOAL_DEBUG] Performing standard update for goal ${id}`);
      const [updatedGoal] = await db
        .update(goals)
        .set(update)
        .where(eq(goals.id, id))
        .returning();
      
      return updatedGoal;
    }
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    try {
      // First check if the goal exists
      const goalExists = await this.getGoal(id);
      if (!goalExists) {
        return false;
      }
      
      // Delete the goal
      await db.delete(goals).where(eq(goals.id, id));
      
      // Verify deletion
      const stillExists = await this.getGoal(id);
      return !stillExists;
    } catch (error) {
      console.error("Error deleting goal:", error);
      return false;
    }
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const results = await db.select().from(transactions).where(eq(transactions.id, id));
    return results[0];
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    try {
      // Get the transaction first to determine how to handle it
      const transaction = await this.getTransaction(id);
      if (!transaction) {
        return false;
      }
      
      // If the transaction is of type 'earn' and has positive delta_tickets, we need to update goals
      if (transaction.type === 'earn' && transaction.delta_tickets > 0) {
        // If this transaction directly affected a goal, update that goal
        if (transaction.goal_id) {
          // Get the goal
          const goal = await this.getGoal(transaction.goal_id);
          if (goal) {
            // Subtract the tickets from the goal
            const updatedTicketsSaved = Math.max(0, goal.tickets_saved - transaction.delta_tickets);
            await this.updateGoal(goal.id, { tickets_saved: updatedTicketsSaved });
          }
        } 
        // If the transaction doesn't have a goal_id but the user has an active goal, update that
        else {
          const activeGoal = await this.getActiveGoalByUser(transaction.user_id);
          if (activeGoal) {
            // Instead of just subtracting, recalculate the total from all transactions
            // Get all earn transactions for this user
            const earnTransactions = await db
              .select()
              .from(transactions)
              .where(
                and(
                  eq(transactions.user_id, transaction.user_id),
                  eq(transactions.type, 'earn'),
                  ne(transactions.id, transaction.id) // Exclude the transaction being deleted
                )
              );
            
            // Calculate total tickets earned
            const totalEarned = earnTransactions.reduce((sum, tx) => sum + tx.delta_tickets, 0);
            
            // Calculate total spent on goals
            const spendTransactions = await db
              .select()
              .from(transactions)
              .where(
                and(
                  eq(transactions.userId, transaction.userId),
                  eq(transactions.type, 'spend')
                )
              );
            
            const totalSpent = spendTransactions.reduce((sum, tx) => sum + Math.abs(tx.delta), 0);
            
            // Calculate how many tickets should be in the goal (remaining balance)
            const balance = await this.getUserBalance(transaction.userId);
            const ticketsForGoal = Math.max(0, totalEarned - totalSpent - balance);
            
            console.log(`Recalculated goal tickets: total earned ${totalEarned}, total spent ${totalSpent}, current balance ${balance}, tickets for goal ${ticketsForGoal}`);
            
            // Update the goal with recalculated amount
            await this.updateGoal(activeGoal.id, { ticketsSaved: ticketsForGoal });
          }
        }
      }
      
      // If this transaction is for completing a chore, we need to check if it was a daily bonus chore
      // and reset the revealed flag in the dailyBonus table
      if (transaction.choreId && transaction.type === 'earn' && transaction.createdAt) {
        console.log(`Transaction ${transaction.id} is a chore completion transaction for chore ${transaction.choreId}`);
        
        // Extract the date from the transaction date
        const transactionDate = new Date(transaction.createdAt);
        const transactionDateStr = transactionDate.toISOString().split('T')[0];
        console.log(`Transaction date: ${transactionDateStr}`);
        
        // Check if there is a dailyBonus record for this user, date, and chore
        console.log(`Looking for daily bonus record for user ${transaction.userId} on ${transactionDateStr}`);
        const dailyBonusRecord = await this.getDailyBonus(transactionDateStr, transaction.userId);
        
        if (dailyBonusRecord) {
          console.log(`Found daily bonus record: `, dailyBonusRecord);
          
          if (dailyBonusRecord.assignedChoreId === transaction.choreId) {
            console.log(`Resetting daily bonus for user ${transaction.userId}, chore ${transaction.choreId} on ${transactionDateStr}`);
            
            // Store the original spin result tickets value before resetting
            const originalSpinResultTickets = dailyBonusRecord.spinResultTickets || null;
            
            // Completely reset the daily bonus state
            console.log(`Updating daily bonus record ${dailyBonusRecord.id} to set isSpun=false, preserving spinResultTickets=${originalSpinResultTickets}`);
            
            const updateResult = await db
              .update(dailyBonus)
              .set({ 
                is_spun: false,
                // Keep the original spin result tickets that were assigned, don't set to null/0
                // This preserves the "prize" while making it available again
                spin_result_tickets: originalSpinResultTickets
              })
              .where(eq(dailyBonus.id, dailyBonusRecord.id))
              .returning();
              
            console.log(`Daily bonus reset complete. Update result:`, updateResult);
            console.log(`Spin result tickets preserved: ${originalSpinResultTickets}`);
          } else {
            console.log(`Daily bonus assigned chore ID ${dailyBonusRecord.assigned_chore_id} doesn't match transaction chore ID ${transaction.chore_id}, not resetting`);
          }
        } else {
          console.log(`No daily bonus record found for user ${transaction.user_id} on ${transactionDateStr}`);
        }
      } else {
        console.log(`Transaction ${transaction.id} is not a chore completion transaction or lacks required fields:`, {
          has_chore_id: !!transaction.chore_id,
          type: transaction.type,
          has_date: !!transaction.date
        });
      }
      
      // Delete the transaction
      const deleted = await db
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning({ id: transactions.id });
      
      return deleted.length > 0;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    console.log(`[TRANSACTION] Creating transaction for user ${insertTransaction.userId}, delta: ${insertTransaction.delta}, type: ${insertTransaction.type}`);
    
    const transactionData = {
      ...insertTransaction,
      createdAt: new Date() // Using createdAt instead of date
    };
    
    // Calculate user's current balance for validation
    const currentBalance = await this.getUserBalance(insertTransaction.userId);
    console.log(`[TRANSACTION] Current balance for user ${insertTransaction.userId}: ${currentBalance}`);
    
    // Insert transaction
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    console.log(`[TRANSACTION] Created transaction ${transaction.id} with delta ${transaction.delta}`);
    
    // Calculate new balance
    const newBalance = await this.getUserBalance(insertTransaction.userId);
    console.log(`[TRANSACTION] New balance for user ${insertTransaction.userId}: ${newBalance}`);
    
    // Always sync the active goal with the latest total
    try {
      // Get the active goal for the user
      const activeGoal = await this.getActiveGoalByUser(transaction.userId);
      
      if (activeGoal) {
        console.log(`[TRANSACTION] User ${transaction.userId} has active goal ${activeGoal.id} with ticketsSaved: ${activeGoal.ticketsSaved}`);
        
        // If this is a spend transaction on a specific goal, set it to 0
        if (transaction.type === 'spend' && transaction.goalId && transaction.goalId === activeGoal.id) {
          console.log(`[TRANSACTION] Setting active goal ${activeGoal.id} ticketsSaved to 0 because it's being spent directly`);
          await db.update(goals)
            .set({ ticketsSaved: 0 })
            .where(eq(goals.id, activeGoal.id));
          
        } else {
          // For all other cases, recalculate the goal progress using all earn/spend transactions
          // This ensures goal progress is always in sync with user balance
          console.log(`[TRANSACTION] Recalculating goal progress for goal ${activeGoal.id}`);
          
          // Ensure goal progress never goes below 0 or exceeds current balance
          const newTicketsSaved = Math.min(Math.max(0, newBalance), 
            Math.ceil(activeGoal.product.priceLockedCents / 25));
          
          console.log(`[TRANSACTION] Updating active goal ${activeGoal.id} ticketsSaved from ${activeGoal.ticketsSaved} to ${newTicketsSaved}`);
          
          await db.update(goals)
            .set({ ticketsSaved: newTicketsSaved })
            .where(eq(goals.id, activeGoal.id));
        }
      } else {
        console.log(`[TRANSACTION] No active goal found for user ${transaction.userId}`);
      }
    } catch (error) {
      console.error(`[TRANSACTION] Error updating goal progress:`, error);
    }
    
    return transaction;
  }

  async getUserTransactions(userId: number, limit = 10): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }
  
  async getUserTransactionsWithDetails(
    userId: number, 
    limit = 10
  ): Promise<(Transaction & { chore?: Chore, goal?: Goal & { product?: Product }})[]> {
    // First get the transactions
    const userTransactions = await this.getUserTransactions(userId, limit);
    
    // For each transaction, fetch related entities if needed
    const results = await Promise.all(userTransactions.map(async (tx) => {
      const result: Transaction & { 
        chore?: Chore, 
        goal?: Goal & { product?: Product }
      } = { ...tx };
      
      // Fetch chore if applicable
      if (tx.chore_id) {
        result.chore = await this.getChore(tx.chore_id);
      }
      
      // Fetch goal and product if applicable
      if (tx.goal_id) {
        const goalWithProduct = await this.getGoalWithProduct(tx.goal_id);
        if (goalWithProduct) {
          result.goal = goalWithProduct;
        }
      }
      
      return result;
    }));
    
    return results;
  }

  async getUserBalance(userId: number): Promise<number> {
    try {
      // Sum up all transactions for this user
      const txList = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));
      
      // Calculate sum manually for better type safety
      return txList.reduce((sum, tx) => sum + tx.delta, 0);
    } catch (error) {
      console.error("Error getting user balance:", error);
      return 0;
    }
  }
  
  async hasCompletedChoreToday(userId: number, choreId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const results = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.choreId, choreId),
        eq(transactions.type, 'earn'),
        gte(transactions.createdAt, today)
      ))
      .limit(1);
    
    return results.length > 0;
  }
}

// Initialize with DatabaseStorage
export const storage = new DatabaseStorage();

// For testing - add default users if they don't exist
async function initDefaultUsers() {
  const parentUser = await storage.getUserByUsername("parent");
  if (!parentUser) {
    await storage.createUser({
      name: "Parent User",
      username: "parent",
      password: "password",
      role: "parent"
    });
  }
  
  const childUser = await storage.getUserByUsername("child");
  if (!childUser) {
    await storage.createUser({
      name: "Child User",
      username: "child",
      password: "password",
      role: "child"
    });
  }
}

// Initialize default users (this runs asynchronously)
initDefaultUsers().catch(error => {
  console.error("Failed to initialize default users:", error);
});
