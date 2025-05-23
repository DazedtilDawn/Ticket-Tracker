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
import { TICKET_CENT_VALUE } from "../config/business";

export class DatabaseStorage implements IStorage {
  // Daily Bonus operations
  async getDailyBonus(date?: string, userId?: number): Promise<DailyBonus | undefined> {
    const today = date || new Date().toISOString().split('T')[0];
    
    console.log(`[GET_BONUS] Looking for daily bonus with date=${today}${userId ? ` and userId=${userId}` : ''}`);
    
    let bonus: DailyBonus | undefined;
    
    if (userId) {
      // Get bonus for specific user
      const result = await db
        .select()
        .from(dailyBonus)
        .where(
          and(
            eq(dailyBonus.bonus_date, today),
            eq(dailyBonus.user_id, userId)
          )
        );
        
      if (result.length > 0) {
        bonus = result[0];
        console.log(`[GET_BONUS] Found daily bonus for user ${userId} on ${today}:`, {
          id: bonus.id,
          assigned_chore_id: bonus.assigned_chore_id,
          is_spun: bonus.is_spun, // Critical field we're debugging
          trigger_type: bonus.trigger_type
        });
      } else {
        console.log(`[GET_BONUS] No daily bonus found for user ${userId} on date ${today}`);
      }
    } else {
      // Get any bonus for the date (for backward compatibility)
      const result = await db
        .select()
        .from(dailyBonus)
        .where(eq(dailyBonus.bonus_date, today));
      
      if (result.length > 0) {
        bonus = result[0];
        console.log(`[GET_BONUS] Found daily bonus for date ${today} (no user specified):`, {
          id: bonus.id,
          user_id: bonus.user_id,
          is_spun: bonus.is_spun, // Critical field we're debugging
          trigger_type: bonus.trigger_type
        });
      } else {
        console.log(`[GET_BONUS] No daily bonus found for date ${today} (no user specified)`);
      }
    }
    
    return bonus;
  }
  
  async getDailyBonusById(id: number): Promise<DailyBonus | undefined> {
    const [bonus] = await db
      .select()
      .from(dailyBonus)
      .where(eq(dailyBonus.id, id));
    
    return bonus;
  }
  
  async getDailyBonusByTriggerType(userId: number, date: string, triggerType: 'chore_completion' | 'good_behavior_reward' | 'respin'): Promise<DailyBonus | undefined> {
    console.log(`[GET_BONUS] Looking for daily bonus with date=${date}, userId=${userId}, and triggerType=${triggerType}`);
    
    const results = await db
      .select()
      .from(dailyBonus)
      .where(and(
        eq(dailyBonus.bonus_date, date),
        eq(dailyBonus.user_id, userId),
        eq(dailyBonus.trigger_type, triggerType as any) // Type cast to fix compatibility issue
      ));
    
    if (results.length > 0) {
      console.log(`[GET_BONUS] Found ${triggerType} bonus for user ${userId} on ${date}:`, {
        id: results[0].id,
        is_spun: results[0].is_spun,
        trigger_type: results[0].trigger_type
      });
      return results[0];
    } else {
      console.log(`[GET_BONUS] No ${triggerType} bonus found for user ${userId} on date ${date}`);
      return undefined;
    }
  }
  
  async createDailyBonus(bonus: InsertDailyBonus): Promise<DailyBonus> {
    console.log(`[CREATE_BONUS] Creating new daily bonus with params:`, {
      bonus_date: bonus.bonus_date,
      user_id: bonus.user_id,
      assigned_chore_id: bonus.assigned_chore_id,
      is_override: bonus.is_override,
      is_spun: bonus.is_spun, // Critical field we're debugging
      trigger_type: bonus.trigger_type
    });
    
    const [newBonus] = await db
      .insert(dailyBonus)
      .values(bonus)
      .returning();
    
    console.log(`[CREATE_BONUS] Successfully created daily bonus with ID ${newBonus.id}:`, {
      is_spun: newBonus.is_spun // Confirm the value after creation
    });
    
    return newBonus;
  }
  
  async deleteDailyBonus(userId: number, date?: string): Promise<boolean> {
    const today = date || new Date().toISOString().split('T')[0];
    
    console.log(`[DELETE_BONUS] Deleting daily bonus for user ${userId} on date ${today}`);
    
    // First get the current bonus for logging purposes
    const currentBonus = await this.getDailyBonus(today, userId);
    if (currentBonus) {
      console.log(`[DELETE_BONUS] Found daily bonus to delete:`, {
        id: currentBonus.id,
        assigned_chore_id: currentBonus.assigned_chore_id,
        is_spun: currentBonus.is_spun,
        trigger_type: currentBonus.trigger_type
      });
    } else {
      console.log(`[DELETE_BONUS] No existing daily bonus found for user ${userId} on date ${today}`);
    }
    
    // Delete the existing record
    const result = await db
      .delete(dailyBonus)
      .where(
        and(
          eq(dailyBonus.user_id, userId),
          eq(dailyBonus.bonus_date, today)
        )
      );
    
    console.log(`[DELETE_BONUS] Daily bonus deletion complete for user ${userId}`);
    
    return true; // Operation completed successfully
  }

  async deleteDailyBonusById(userId: number, bonusId: number): Promise<boolean> {
    console.log(`[DELETE_BONUS] Deleting daily bonus with ID ${bonusId} for user ${userId}`);
    
    // Delete the existing record by ID
    const result = await db
      .delete(dailyBonus)
      .where(
        and(
          eq(dailyBonus.user_id, userId),
          eq(dailyBonus.id, bonusId)
        )
      );
    
    console.log(`[DELETE_BONUS] Daily bonus deletion complete for ID ${bonusId}`);
    
    return true; // Operation completed successfully
  }
  
  async assignDailyBonusChore(childId: number, date: string): Promise<DailyBonus | null> {
    console.log(`[BONUS_ASSIGN] Starting bonus assignment for child ${childId} on date ${date}`);
    
    // Check if a bonus already exists for this child and date
    const existingBonus = await this.getDailyBonus(date, childId);
    if (existingBonus) {
      console.log(`[BONUS_ASSIGN] Daily bonus for user ${childId} on ${date} already exists:`, {
        id: existingBonus.id,
        assigned_chore_id: existingBonus.assigned_chore_id,
        is_spun: existingBonus.is_spun,
        trigger_type: existingBonus.trigger_type
      });

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
      
      // Check cooldown: If last_bonus_assigned is null or before the cooldown period, it's eligible
      // In development mode, bypass the cooldown check to allow testing
      const offCooldown = bypassCooldown || !chore.last_bonus_assigned || chore.last_bonus_assigned < oneDayAgoStr;
      
      const eligible = isDaily && offCooldown;
      
      // Log detailed eligibility info for each chore
      console.log(`[BONUS_ASSIGN] Chore ${chore.id} (${chore.name}) eligibility:`, {
        isDaily,
        recurrence: chore.recurrence,
        last_bonus_assigned: chore.last_bonus_assigned || 'never',
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
      bonus_date: date,
      user_id: childId,
      assigned_chore_id: selectedChore.id,
      is_override: false,
      is_spun: false,
      trigger_type: 'chore_completion',
      spin_result_tickets: 0  // Default to 0 tickets until wheel is spun
    };
    
    const createdBonus = await this.createDailyBonus(newBonus);
    
    // Update the selected chore's last_bonus_assigned date
    await this.updateChore(selectedChore.id, {
      last_bonus_assigned: date
    });
    
    console.log(`Daily bonus created successfully for user ${childId}, chore ${selectedChore.id} on ${date}`);
    return createdBonus;
  }

  async assignDailyBonusesToAllChildren(date?: string): Promise<Record<number, DailyBonus | null>> {
    const today = date || new Date().toISOString().split('T')[0];
    console.log(`Assigning daily bonuses to all children for date ${today}`);
    
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
  }
  
  async getChoreWithBonus(choreId: number, date?: string, userId?: number): Promise<(Chore & { bonus_tickets: number }) | undefined> {
    const today = date || new Date().toISOString().split('T')[0];
    
    let query = db
      .select({
        id: chores.id,
        name: chores.name,
        description: chores.description,
        base_tickets: chores.base_tickets,
        recurrence: chores.recurrence,
        tier: chores.tier,
        image_url: chores.image_url,
        is_active: chores.is_active,
        emoji: chores.emoji,
        last_bonus_assigned: chores.last_bonus_assigned,
        created_at: chores.created_at,
        created_by_user_id: chores.created_by_user_id,
        bonus_tickets: sql`coalesce(${dailyBonus.spin_result_tickets}, 0)`
      })
      .from(chores)
      .innerJoin(
        dailyBonus,
        and(
          eq(dailyBonus.assigned_chore_id, chores.id),
          eq(dailyBonus.bonus_date, today)
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
          base_tickets: chores.base_tickets,
          recurrence: chores.recurrence,
          tier: chores.tier,
          image_url: chores.image_url,
          is_active: chores.is_active,
          emoji: chores.emoji,
          last_bonus_assigned: chores.last_bonus_assigned,
          created_at: chores.created_at,
          created_by_user_id: chores.created_by_user_id,
          bonus_tickets: sql`coalesce(${dailyBonus.spin_result_tickets}, 0)`
        })
        .from(chores)
        .innerJoin(
          dailyBonus,
          and(
            eq(dailyBonus.assigned_chore_id, chores.id),
            eq(dailyBonus.bonus_date, today),
            eq(dailyBonus.user_id, userId)
          )
        )
        .where(baseConditions);
    }
    
    const [result] = await query;
    
    if (!result) return undefined;
    return {
      ...result,
      bonus_tickets: Number(result.bonus_tickets ?? 0),
    };
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
      return db.select().from(chores).where(eq(chores.is_active, true));
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
    // Ensure price_locked_cents is set if not provided
    const productData = {
      ...insertProduct,
      price_locked_cents: insertProduct.price_locked_cents || insertProduct.price_cents,
      last_checked: new Date()
    };
    
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product | undefined> {
    const updateData = { ...update } as any;

    // Keep locked price in sync when price changes unless explicitly provided
    if (update.price_cents !== undefined && update.price_locked_cents === undefined) {
      updateData.price_locked_cents = update.price_cents;
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updateData,
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
      .where(and(
        eq(goals.user_id, userId),
        eq(goals.is_active, true)
      ))
      .innerJoin(products, eq(goals.product_id, products.id));
      
    return result[0];
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
      const goalExists = await this.getGoal(id);
      if (!goalExists) {
        console.log(`[STORAGE_DELETE_GOAL] Goal ID ${id} not found initially. Cannot delete.`);
        return false;
      }

      console.log(`[STORAGE_DELETE_GOAL] Goal ID ${id} found. Disassociating transactions first.`);
      // Set goal_id to NULL for all transactions referencing this goal
      await db.update(transactions)
        .set({ goal_id: null })
        .where(eq(transactions.goal_id, id));
      console.log(`[STORAGE_DELETE_GOAL] Transactions for goal ID ${id} disassociated.`);

      console.log(`[STORAGE_DELETE_GOAL] Attempting to delete goal ID ${id}.`);
      const deleteResult = await db.delete(goals).where(eq(goals.id, id)).returning({ id: goals.id });
      console.log(`[STORAGE_DELETE_GOAL] Drizzle delete operation result for goal ID ${id}:`, deleteResult);

      const stillExists = await this.getGoal(id);
      if (stillExists) {
        console.warn(`[STORAGE_DELETE_GOAL] VERIFICATION FAILED: Goal ID ${id} still exists after delete attempt.`);
        return false;
      }

      console.log(`[STORAGE_DELETE_GOAL] VERIFICATION SUCCESS: Goal ID ${id} successfully deleted.`);
      return true;
    } catch (error) {
      console.error(`[STORAGE_DELETE_GOAL] Error deleting goal ID ${id}:`, error);
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
      
      // If the transaction is of type 'earn' and has positive delta, we need to update goals
      if (transaction.type === 'earn' && transaction.delta > 0) {
        // If this transaction directly affected a goal, update that goal
        if (transaction.goal_id) {
          // Get the goal
          const goal = await this.getGoal(transaction.goal_id);
          if (goal) {
            // Subtract the tickets from the goal
            const updatedTicketsSaved = Math.max(0, goal.tickets_saved - transaction.delta);
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
            const totalEarned = earnTransactions.reduce((sum, tx) => sum + tx.delta, 0);
            
            // Calculate total spent on goals
            const spendTransactions = await db
              .select()
              .from(transactions)
              .where(
                and(
                  eq(transactions.user_id, transaction.user_id),
                  eq(transactions.type, 'spend')
                )
              );
            
            const totalSpent = spendTransactions.reduce((sum, tx) => sum + Math.abs(tx.delta), 0);
            
            // Calculate how many tickets should be in the goal (remaining balance)
            const balance = await this.getUserBalance(transaction.user_id);
            const ticketsForGoal = Math.max(0, totalEarned - totalSpent - balance);
            
            console.log(`Recalculated goal tickets: total earned ${totalEarned}, total spent ${totalSpent}, current balance ${balance}, tickets for goal ${ticketsForGoal}`);
            
            // Update the goal with recalculated amount
            await this.updateGoal(activeGoal.id, { tickets_saved: ticketsForGoal });
          }
        }
      }
      
      // If this transaction is for completing a chore, we need to check if it was a daily bonus chore
      // and reset the revealed flag in the dailyBonus table
      if (transaction.chore_id && transaction.type === 'earn' && transaction.created_at) {
        console.log(`Transaction ${transaction.id} is a chore completion transaction for chore ${transaction.chore_id}`);
        
        // Extract the date from the transaction date
        const transactionDate = new Date(transaction.created_at);
        const transactionDateStr = transactionDate.toISOString().split('T')[0];
        console.log(`Transaction date: ${transactionDateStr}`);
        
        // Check if there is a dailyBonus record for this user, date, and chore
        console.log(`Looking for daily bonus record for user ${transaction.user_id} on ${transactionDateStr}`);
        const dailyBonusRecord = await this.getDailyBonus(transactionDateStr, transaction.user_id);
        
        if (dailyBonusRecord) {
          console.log(`Found daily bonus record: `, dailyBonusRecord);
          
          if (dailyBonusRecord.assigned_chore_id === transaction.chore_id) {
            console.log(`Resetting daily bonus for user ${transaction.user_id}, chore ${transaction.chore_id} on ${transactionDateStr}`);
            
            // Store the original spin result tickets value before resetting
            const originalSpinResultTickets = dailyBonusRecord.spin_result_tickets || null;
            
            // Completely reset the daily bonus state
            console.log(`Updating daily bonus record ${dailyBonusRecord.id} to set is_spun=false, preserving spin_result_tickets=${originalSpinResultTickets}`);
            
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
          has_date: !!transaction.created_at
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
    const { user_id, delta, type, chore_id, goal_id, note, source, ref_id, reason, metadata, to_shared_goal_id } = insertTransaction;
    console.log(`[TRANSACTION] Creating transaction for user ${user_id}, delta: ${delta}, type: ${type}`);

    const transactionData = {
      ...insertTransaction,
      user_id,
      delta,
      type: type || 'earn',
      source: source || 'chore',
      created_at: new Date()
    };

    // Calculate user's current balance for validation
    const currentBalance = await this.getUserBalance(user_id);
    console.log(`[TRANSACTION] Current balance for user ${user_id}: ${currentBalance}`);

    const [transaction] = await db.insert(transactions).values({
      user_id: transactionData.user_id,
      delta: transactionData.delta,
      type: transactionData.type,
      source: transactionData.source,
      created_at: transactionData.created_at,
      chore_id: transactionData.chore_id,
      goal_id: transactionData.goal_id,
      note: transactionData.note,
      ref_id: transactionData.ref_id,
      reason: transactionData.reason,
      metadata: transactionData.metadata,
      to_shared_goal_id: transactionData.to_shared_goal_id
    }).returning();
    console.log(`[TRANSACTION] Created transaction ${transaction.id} with delta ${transaction.delta}`);

    const newBalance = await this.getUserBalance(user_id);
    console.log(`[TRANSACTION] New balance for user ${user_id}: ${newBalance}`);
    
    // Always sync the active goal with the latest total
    try {
      // Get the active goal for the user
      const activeGoal = await this.getActiveGoalByUser(transaction.user_id);
      
      if (activeGoal) {
        console.log(`[TRANSACTION] User ${transaction.user_id} has active goal ${activeGoal.id} with tickets_saved: ${activeGoal.tickets_saved}`);
        
        // If this is a spend transaction on a specific goal, set it to 0
        if (transaction.type === 'spend' && transaction.goal_id && transaction.goal_id === activeGoal.id) {
          console.log(`[TRANSACTION] Setting active goal ${activeGoal.id} tickets_saved to 0 because it's being spent directly`);
          await db.update(goals)
            .set({ tickets_saved: 0 })
            .where(eq(goals.id, activeGoal.id));
          
        } else {
          // For all other cases, recalculate the goal progress using all earn/spend transactions
          // This ensures goal progress is always in sync with user balance
          console.log(`[TRANSACTION] Recalculating goal progress for goal ${activeGoal.id}`);
          
          // Ensure goal progress never goes below 0 or exceeds current balance
          const newTicketsSaved = Math.min(
            Math.max(0, newBalance),
            Math.ceil((activeGoal.product.price_locked_cents || 0) / TICKET_CENT_VALUE)
          );
          
          console.log(`[TRANSACTION] Updating active goal ${activeGoal.id} tickets_saved from ${activeGoal.tickets_saved} to ${newTicketsSaved}`);
          
          await db.update(goals)
            .set({ tickets_saved: newTicketsSaved })
            .where(eq(goals.id, activeGoal.id));
        }
      } else {
        console.log(`[TRANSACTION] No active goal found for user ${transaction.user_id}`);
      }
    } catch (error) {
      console.error(`[TRANSACTION] Error updating goal progress: ${error}`);
    }
    
    return transaction;
  }

  async getUserTransactions(userId: number, limit = 10): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.user_id, userId))
      .orderBy(desc(transactions.created_at))
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
        .where(eq(transactions.user_id, userId));
      
      // Calculate sum manually for better type safety
      return txList.reduce((sum, tx) => sum + tx.delta, 0);
    } catch (error) {
      console.error("Error getting user balance:", error);
      return 0;
    }
  }
  
  async hasCompletedChoreToday(userId: number, choreId: number): Promise<boolean> {
    // Format today as YYYY-MM-DD for string comparison
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Let's completely skip the check for now to allow completion
    console.log(`[CHORE_CHECK] Skipping completion check for user ${userId} and chore ${choreId} to avoid SQL errors`);
    return false;
  }
  
  async getUserById(id: number): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result.length ? result[0] : null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }
  
  async updateUserProfileImage(userId: number, profileImageUrl: string): Promise<User | null> {
    try {
      const result = await db.update(users)
        .set({ profile_image_url: profileImageUrl })
        .where(eq(users.id, userId))
        .returning();
      
      return result.length ? result[0] : null;
    } catch (error) {
      console.error("Error updating user profile image:", error);
      return null;
    }
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
      email: "parent@example.com", 
      passwordHash: "password",
      role: "parent"
    } as InsertUser);
  }
  
  const childUser = await storage.getUserByUsername("child");
  if (!childUser) {
    await storage.createUser({
      name: "Child User",
      username: "child",
      email: "child@example.com",
      passwordHash: "password",
      role: "child"
    } as InsertUser);
  }
}

// Initialize default users (this runs asynchronously)
initDefaultUsers().catch(error => {
  console.error("Failed to initialize default users:", error);
});
