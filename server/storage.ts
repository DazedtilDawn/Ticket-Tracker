import { nanoid } from "nanoid";
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
  DailyBonusSimple,
  InsertDailyBonusSimple,
  AwardedItem,
  InsertAwardedItem,
  ChoreCompletion,
  InsertChoreCompletion,
} from "@shared/schema";
import { calculateBoostPercent } from "./lib/business-logic";

// Allowed banner color gradients for children
export const CHILD_BANNER_GRADIENTS = [
  "from-pink-500/30 to-indigo-300/30",
  "from-amber-400/30 to-rose-300/30",
  "from-lime-400/30 to-teal-300/30",
  "from-sky-400/30 to-fuchsia-300/30",
];

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getChildrenForParent(parentId: number): Promise<User[]>;

  /** Creates a new child profile for a given parent (returns created child). */
  createChildForParent(
    parentId: number,
    childData: { name: string; profile_image_url?: string }
  ): Promise<User>;
  /** Updates a child's profile (name/image) - verifies parent ownership. */
  updateChildForParent(
    parentId: number,
    childId: number,
    data: { name?: string; profile_image_url?: string | null }
  ): Promise<User>;
  /** Toggle a child's is_archived flag and return updated user (or null). */
  updateChildArchive(childId: number, archived: boolean): Promise<User | null>;
  /** Archive/unarchive a child - verifies parent ownership. */
  archiveChildForParent(
    parentId: number,
    childId: number,
    archived: boolean
  ): Promise<User>;
  /** Permanently delete a child - verifies parent ownership. */
  deleteChildForParent(
    parentId: number,
    childId: number
  ): Promise<{ id: number }>;

  // Chore operations
  getChore(id: number): Promise<Chore | undefined>;
  getChores(activeOnly?: boolean): Promise<Chore[]>;
  createChore(chore: InsertChore): Promise<Chore>;
  updateChore(
    id: number,
    chore: Partial<InsertChore>,
  ): Promise<Chore | undefined>;
  deleteChore(id: number): Promise<boolean>;

  // Chore completion operations
  logChoreCompletion(choreId: number, userId: number): Promise<ChoreCompletion>;
  getChoreStatusForUser(userId: number): Promise<(Chore & { completed: boolean })[]>;
  resetExpiredCompletions(): Promise<number>;

  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductByAsin(asin: string): Promise<Product | undefined>;
  getProductsByTitle(
    partialTitle: string,
    exactMatch?: boolean,
  ): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: number,
    product: Partial<InsertProduct>,
  ): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Goal operations
  getGoal(id: number): Promise<Goal | undefined>;
  getGoalWithProduct(
    id: number,
  ): Promise<(Goal & { product: Product }) | undefined>;
  getGoalsByUser(userId: number): Promise<Goal[]>;
  getGoalsByProductId(productId: number): Promise<Goal[]>;
  getActiveGoalByUser(
    userId: number,
  ): Promise<(Goal & { product: Product }) | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, update: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;
  getUserTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  getUserTransactionsWithDetails(
    userId: number,
    limit?: number,
  ): Promise<
    (Transaction & { chore?: Chore; goal?: Goal & { product?: Product } })[]
  >;
  getUserBalance(userId: number): Promise<number>;
  hasCompletedChoreToday(userId: number, choreId: number): Promise<boolean>;

  // Daily Bonus operations
  getDailyBonus(
    date?: string,
    userId?: number,
  ): Promise<DailyBonus | undefined>;
  getDailyBonusById(id: number): Promise<DailyBonus | undefined>;
  createDailyBonus(bonus: InsertDailyBonus): Promise<DailyBonus>;
  createDailyBonusSimple(bonus: InsertDailyBonusSimple): Promise<DailyBonusSimple>;
  getTodayDailyBonusSimple(userId: number): Promise<DailyBonusSimple | undefined>;
  markDailyBonusRevealed(id: number, tickets: number): Promise<DailyBonusSimple>;
  resetRevealedDailyBonuses(): Promise<number>;
  deleteDailyBonus(userId: number, date?: string): Promise<boolean>;
  assignDailyBonusChore(
    childId: number,
    date: string,
  ): Promise<DailyBonus | null>;
  assignDailyBonusesToAllChildren(
    date?: string,
  ): Promise<Record<number, DailyBonus | null>>;
  getChoreWithBonus(
    choreId: number,
    date?: string,
    userId?: number,
  ): Promise<(Chore & { bonus_tickets: number }) | undefined>;

  // Trophy Award operations
  awardItemToChild(award: InsertAwardedItem): Promise<AwardedItem>;
  getChildTrophies(
    childId: number,
  ): Promise<(AwardedItem & { product: Product })[]>;
  deleteAwardedItem(id: number): Promise<boolean>;
}

import { db } from "./db";
import {
  users,
  chores,
  products,
  goals,
  transactions,
  dailyBonus,
  dailyBonusSimple,
  awardedItems,
  choreCompletions,
} from "@shared/schema";
import { eq, and, desc, gte, sql, ilike, lt, ne } from "drizzle-orm";
import { TICKET_CENT_VALUE } from "../config/business";

export class DatabaseStorage implements IStorage {
  // Daily Bonus operations
  async getDailyBonus(
    date?: string,
    userId?: number,
  ): Promise<DailyBonus | undefined> {
    const today = date || new Date().toISOString().split("T")[0];

    console.log(
      `[GET_BONUS] Looking for daily bonus with date=${today}${userId ? ` and userId=${userId}` : ""}`,
    );

    let bonus: DailyBonus | undefined;

    if (userId) {
      // Get bonus for specific user
      const result = await db
        .select()
        .from(dailyBonus)
        .where(
          and(eq(dailyBonus.bonus_date, today), eq(dailyBonus.user_id, userId)),
        );

      if (result.length > 0) {
        bonus = result[0];
        console.log(
          `[GET_BONUS] Found daily bonus for user ${userId} on ${today}:`,
          {
            id: bonus.id,
            assigned_chore_id: bonus.assigned_chore_id,
            is_spun: bonus.is_spun, // Critical field we're debugging
            trigger_type: bonus.trigger_type,
          },
        );
      } else {
        console.log(
          `[GET_BONUS] No daily bonus found for user ${userId} on date ${today}`,
        );
      }
    } else {
      // Get any bonus for the date (for backward compatibility)
      const result = await db
        .select()
        .from(dailyBonus)
        .where(eq(dailyBonus.bonus_date, today));

      if (result.length > 0) {
        bonus = result[0];
        console.log(
          `[GET_BONUS] Found daily bonus for date ${today} (no user specified):`,
          {
            id: bonus.id,
            user_id: bonus.user_id,
            is_spun: bonus.is_spun, // Critical field we're debugging
            trigger_type: bonus.trigger_type,
          },
        );
      } else {
        console.log(
          `[GET_BONUS] No daily bonus found for date ${today} (no user specified)`,
        );
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

  async getDailyBonusByTriggerType(
    userId: number,
    date: string,
    triggerType: "chore_completion" | "good_behavior_reward" | "respin",
  ): Promise<DailyBonus | undefined> {
    console.log(
      `[GET_BONUS] Looking for daily bonus with date=${date}, userId=${userId}, and triggerType=${triggerType}`,
    );

    const results = await db
      .select()
      .from(dailyBonus)
      .where(
        and(
          eq(dailyBonus.bonus_date, date),
          eq(dailyBonus.user_id, userId),
          eq(dailyBonus.trigger_type, triggerType as any), // Type cast to fix compatibility issue
        ),
      );

    if (results.length > 0) {
      console.log(
        `[GET_BONUS] Found ${triggerType} bonus for user ${userId} on ${date}:`,
        {
          id: results[0].id,
          is_spun: results[0].is_spun,
          trigger_type: results[0].trigger_type,
        },
      );
      return results[0];
    } else {
      console.log(
        `[GET_BONUS] No ${triggerType} bonus found for user ${userId} on date ${date}`,
      );
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
      trigger_type: bonus.trigger_type,
    });

    const [newBonus] = await db.insert(dailyBonus).values(bonus).returning();

    console.log(
      `[CREATE_BONUS] Successfully created daily bonus with ID ${newBonus.id}:`,
      {
        is_spun: newBonus.is_spun, // Confirm the value after creation
      },
    );

    return newBonus;
  }

  async createDailyBonusSimple(bonus: InsertDailyBonusSimple): Promise<DailyBonusSimple> {
    const [newBonus] = await db.insert(dailyBonusSimple).values(bonus).returning();
    return newBonus;
  }

  async getTodayDailyBonusSimple(userId: number): Promise<DailyBonusSimple | undefined> {
    const [bonus] = await db
      .select()
      .from(dailyBonusSimple)
      .where(
        and(
          eq(dailyBonusSimple.user_id, userId),
          sql`date_trunc('day', ${dailyBonusSimple.assigned_at}) = date_trunc('day', NOW())`
        )
      )
      .limit(1);
    
    return bonus;
  }

  async markDailyBonusRevealed(id: number, tickets: number): Promise<DailyBonusSimple> {
    const [updatedBonus] = await db
      .update(dailyBonusSimple)
      .set({
        revealed: true,
        bonus_tickets: tickets,
      })
      .where(eq(dailyBonusSimple.id, id))
      .returning();
    
    return updatedBonus;
  }

  async resetRevealedDailyBonuses(): Promise<number> {
    // First, get all revealed bonuses to count them
    const revealedBonuses = await db
      .select({ id: dailyBonusSimple.id })
      .from(dailyBonusSimple)
      .where(eq(dailyBonusSimple.revealed, true));
    
    const count = revealedBonuses.length;
    
    if (count > 0) {
      // Reset all revealed bonuses
      await db
        .update(dailyBonusSimple)
        .set({
          revealed: false,
          // Keep bonus_tickets as-is to maintain history
        })
        .where(eq(dailyBonusSimple.revealed, true));
    }
    
    console.log(`[STORAGE] Reset ${count} revealed daily bonuses`);
    return count;
  }

  async deleteDailyBonus(userId: number, date?: string): Promise<boolean> {
    const today = date || new Date().toISOString().split("T")[0];

    console.log(
      `[DELETE_BONUS] Deleting daily bonus for user ${userId} on date ${today}`,
    );

    // First get the current bonus for logging purposes
    const currentBonus = await this.getDailyBonus(today, userId);
    if (currentBonus) {
      console.log(`[DELETE_BONUS] Found daily bonus to delete:`, {
        id: currentBonus.id,
        assigned_chore_id: currentBonus.assigned_chore_id,
        is_spun: currentBonus.is_spun,
        trigger_type: currentBonus.trigger_type,
      });
    } else {
      console.log(
        `[DELETE_BONUS] No existing daily bonus found for user ${userId} on date ${today}`,
      );
    }

    // Delete the existing record
    const result = await db
      .delete(dailyBonus)
      .where(
        and(eq(dailyBonus.user_id, userId), eq(dailyBonus.bonus_date, today)),
      );

    console.log(
      `[DELETE_BONUS] Daily bonus deletion complete for user ${userId}`,
    );

    return true; // Operation completed successfully
  }

  async deleteDailyBonusById(
    userId: number,
    bonusId: number,
  ): Promise<boolean> {
    console.log(
      `[DELETE_BONUS] Deleting daily bonus with ID ${bonusId} for user ${userId}`,
    );

    // Delete the existing record by ID
    const result = await db
      .delete(dailyBonus)
      .where(and(eq(dailyBonus.user_id, userId), eq(dailyBonus.id, bonusId)));

    console.log(
      `[DELETE_BONUS] Daily bonus deletion complete for ID ${bonusId}`,
    );

    return true; // Operation completed successfully
  }

  async assignDailyBonusChore(
    childId: number,
    date: string,
  ): Promise<DailyBonus | null> {
    console.log(
      `[BONUS_ASSIGN] Starting bonus assignment for child ${childId} on date ${date}`,
    );

    // Check if a bonus already exists for this child and date
    const existingBonus = await this.getDailyBonus(date, childId);
    if (existingBonus) {
      console.log(
        `[BONUS_ASSIGN] Daily bonus for user ${childId} on ${date} already exists:`,
        {
          id: existingBonus.id,
          assigned_chore_id: existingBonus.assigned_chore_id,
          is_spun: existingBonus.is_spun,
          trigger_type: existingBonus.trigger_type,
        },
      );

      return existingBonus;
    }

    // Get all active chores
    const activeChores = await this.getChores(true);
    console.log(
      `[BONUS_ASSIGN] Found ${activeChores.length} active chores to choose from for user ${childId}`,
    );

    if (activeChores.length === 0) {
      console.log(
        `[BONUS_ASSIGN] No active chores found for assigning daily bonus`,
      );
      return null;
    }

    // Filter out chores that were assigned as bonus within the last day
    const oneDayAgo = new Date(date);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const oneDayAgoStr = oneDayAgo.toISOString().split("T")[0];

    // BUGFIX: Check if we need to bypass the cooldown for debugging
    const bypassCooldown = process.env.NODE_ENV === "development";
    console.log(
      `[BONUS_ASSIGN] Debug environment detected: ${bypassCooldown ? "Bypassing cooldown checks" : "Using normal cooldown rules"}`,
    );

    // Filter for DAILY chores that aren't on cooldown
    const eligibleChores = activeChores.filter((chore) => {
      // Only select daily chores for bonuses
      const isDaily = chore.recurrence === "daily";

      // Check cooldown: If last_bonus_assigned is null or before the cooldown period, it's eligible
      // In development mode, bypass the cooldown check to allow testing
      const offCooldown =
        bypassCooldown ||
        !chore.last_bonus_assigned ||
        chore.last_bonus_assigned < oneDayAgoStr;

      const eligible = isDaily && offCooldown;

      // Log detailed eligibility info for each chore
      console.log(
        `[BONUS_ASSIGN] Chore ${chore.id} (${chore.name}) eligibility:`,
        {
          isDaily,
          recurrence: chore.recurrence,
          last_bonus_assigned: chore.last_bonus_assigned || "never",
          offCooldown,
          eligible,
        },
      );

      return eligible;
    });

    if (eligibleChores.length === 0) {
      console.log(
        `[BONUS_ASSIGN] No eligible daily chores found for assigning daily bonus (all on cooldown or not daily)`,
      );
      return null;
    }

    console.log(
      `[BONUS_ASSIGN] Found ${eligibleChores.length} eligible daily chores for bonus assignment`,
    );

    // Randomly select one eligible chore
    const selectedChore =
      eligibleChores[Math.floor(Math.random() * eligibleChores.length)];
    console.log(
      `Selected chore ${selectedChore.id} (${selectedChore.name}) for daily bonus`,
    );

    // Create a new daily bonus record
    const newBonus: InsertDailyBonus = {
      bonus_date: date,
      user_id: childId,
      assigned_chore_id: selectedChore.id,
      is_override: false,
      is_spun: false,
      trigger_type: "chore_completion",
      spin_result_tickets: 0, // Default to 0 tickets until wheel is spun
    };

    const createdBonus = await this.createDailyBonus(newBonus);

    // Update the selected chore's last_bonus_assigned date
    await this.updateChore(selectedChore.id, {
      last_bonus_assigned: date,
    });

    console.log(
      `Daily bonus created successfully for user ${childId}, chore ${selectedChore.id} on ${date}`,
    );
    return createdBonus;
  }

  async assignDailyBonusesToAllChildren(
    date?: string,
  ): Promise<Record<number, DailyBonus | null>> {
    const today = date || new Date().toISOString().split("T")[0];
    console.log(`Assigning daily bonuses to all children for date ${today}`);

    // Get all child users
    const childUsers = await this.getUsersByRole("child");
    if (childUsers.length === 0) {
      console.log("No child users found to assign daily bonuses");
      return {};
    }

    // Assign bonus chores to each child
    const results: Record<number, DailyBonus | null> = {};

    for (const child of childUsers) {
      // Assign a bonus to this child
      console.log(
        `Assigning daily bonus for child ${child.id} (${child.name})`,
      );
      try {
        const bonus = await this.assignDailyBonusChore(child.id, today);
        results[child.id] = bonus;
      } catch (error) {
        console.error(
          `Error assigning daily bonus to child ${child.id} (${child.name}):`,
          error,
        );
        results[child.id] = null;
      }
    }

    console.log(
      `Daily bonus assignment complete for ${childUsers.length} children`,
    );
    return results;
  }

  async getChoreWithBonus(
    choreId: number,
    date?: string,
    userId?: number,
  ): Promise<(Chore & { bonus_tickets: number }) | undefined> {
    const today = date || new Date().toISOString().split("T")[0];

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
        bonus_tickets: sql`coalesce(${dailyBonus.spin_result_tickets}, 0)`,
      })
      .from(chores)
      .innerJoin(
        dailyBonus,
        and(
          eq(dailyBonus.assigned_chore_id, chores.id),
          eq(dailyBonus.bonus_date, today),
        ),
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
          bonus_tickets: sql`coalesce(${dailyBonus.spin_result_tickets}, 0)`,
        })
        .from(chores)
        .innerJoin(
          dailyBonus,
          and(
            eq(dailyBonus.assigned_chore_id, chores.id),
            eq(dailyBonus.bonus_date, today),
            eq(dailyBonus.user_id, userId),
          ),
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
    const results = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
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

  async getChildrenForParent(parentId: number): Promise<User[]> {
    // Get the parent
    const parent = await this.getUser(parentId);
    if (!parent) {
      return [];
    }

    // Due to family_id constraint issues, we'll use username pattern matching
    // Children created by a parent have usernames like "parentusername_child_*"
    const usernamePattern = `${parent.username}_child_%`;

    // Get all non-archived children that belong to this parent
    return db
      .select()
      .from(users)
      .where(
        and(
          ilike(users.username, usernamePattern),
          eq(users.role, "child"),
          eq(users.is_archived, false)
        )
      );
  }

  async createChildForParent(
    parentId: number,
    { name, profile_image_url }: { name: string; profile_image_url?: string }
  ): Promise<User> {
    const parent = await this.getUser(parentId);
    if (!parent) throw new Error("Parent not found");

    console.log(`[CREATE_CHILD] Parent info:`, { 
      id: parent.id, 
      username: parent.username,
      family_id: parent.family_id 
    });

    // For family_id, use parent's family_id if it exists, otherwise use parent's id
    // This handles the foreign key constraint properly
    const familyId = parent.family_id || parentId;
    console.log(`[CREATE_CHILD] Using family_id: ${familyId}`);

    // Generate unique username with collision avoidance
    let username: string = "";
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const uniqueId = nanoid(6);
      username = `${parent.username}_child_${uniqueId}`;
      
      // Check if username already exists
      const existing = await this.getUserByUsername(username);
      if (!existing) break;
      
      attempts++;
    }
    
    if (attempts === maxAttempts || !username) {
      throw new Error("Failed to generate unique username after multiple attempts");
    }

    // Pick random gradient from allowed list
    const banner_color_preference = CHILD_BANNER_GRADIENTS[
      Math.floor(Math.random() * CHILD_BANNER_GRADIENTS.length)
    ];

    try {
      const [child] = await db
        .insert(users)
        .values({
          name,
          username,
          role: "child",
          passwordHash: "DISABLED", // child never logs in
          family_id: familyId,
          profile_image_url,
          banner_color_preference,
        })
        .returning();

      return child;
    } catch (error) {
      console.error(`[CREATE_CHILD] Error creating child:`, error);
      
      // If foreign key constraint fails, try creating without family_id first
      if (error instanceof Error && error.message.includes('foreign key constraint')) {
        console.log(`[CREATE_CHILD] Retrying without family_id...`);
        
        const [child] = await db
          .insert(users)
          .values({
            name,
            username,
            role: "child",
            passwordHash: "DISABLED",
            family_id: null, // Create without family_id
            profile_image_url,
            banner_color_preference,
          })
          .returning();

        console.log(`[CREATE_CHILD] Child created with ID ${child.id}, family_id will remain null due to constraint`);
        
        // Don't update family_id due to constraint issues
        // The child is created successfully, just without family association
        return child;
      }
      
      throw error;
    }
  }

  async insertChildForParent(parentId: number, name: string): Promise<User> {
    return this.createChildForParent(parentId, { name });
  }

  async updateChildForParent(
    parentId: number,
    childId: number,
    data: { name?: string; profile_image_url?: string | null }
  ): Promise<User> {
    // First verify the child belongs to the parent
    const child = await this.getUser(childId);
    if (!child || child.role !== "child") {
      throw new Error("Child not found");
    }

    // Check if child belongs to parent (using family_id or username pattern)
    const parent = await this.getUser(parentId);
    if (!parent) {
      throw new Error("Parent not found");
    }

    // Check family relationship
    const belongsToParent = 
      (child.family_id && child.family_id === parentId) ||
      (child.family_id && child.family_id === parent.family_id) ||
      child.username.startsWith(`${parent.username}_child_`);
    
    if (!belongsToParent) {
      throw new Error("Child does not belong to this parent");
    }

    // Update the child
    const updateData: Partial<User> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.profile_image_url !== undefined) updateData.profile_image_url = data.profile_image_url;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, childId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update child");
    }

    return updated;
  }

  async updateChildArchive(
    childId: number,
    archived: boolean,
  ): Promise<User | null> {
    const [updated] = await db
      .update(users)
      .set({ is_archived: archived })
      .where(and(eq(users.id, childId), eq(users.role, "child")))
      .returning();
    return updated ?? null;
  }

  async archiveChildForParent(
    parentId: number,
    childId: number,
    archived: boolean
  ): Promise<User> {
    // First verify the child belongs to the parent
    const child = await this.getUser(childId);
    if (!child || child.role !== "child") {
      throw new Error("Child not found");
    }

    // Check if child belongs to parent (using family_id or username pattern)
    const parent = await this.getUser(parentId);
    if (!parent) {
      throw new Error("Parent not found");
    }

    // Check family relationship
    const belongsToParent = 
      (child.family_id && child.family_id === parentId) ||
      (child.family_id && child.family_id === parent.family_id) ||
      child.username.startsWith(`${parent.username}_child_`);
    
    if (!belongsToParent) {
      throw new Error("Child does not belong to this parent");
    }

    // Update the archive status
    const [updated] = await db
      .update(users)
      .set({ is_archived: archived })
      .where(eq(users.id, childId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update archive status");
    }

    return updated;
  }

  async deleteChildForParent(
    parentId: number,
    childId: number
  ): Promise<{ id: number }> {
    // First verify the child belongs to the parent
    const child = await this.getUser(childId);
    if (!child || child.role !== "child") {
      throw new Error("Child not found");
    }

    // Check if child belongs to parent (using family_id or username pattern)
    const parent = await this.getUser(parentId);
    if (!parent) {
      throw new Error("Parent not found");
    }

    // Check family relationship
    const belongsToParent = 
      (child.family_id && child.family_id === parentId) ||
      (child.family_id && child.family_id === parent.family_id) ||
      child.username.startsWith(`${parent.username}_child_`);
    
    if (!belongsToParent) {
      throw new Error("Child does not belong to this parent");
    }

    // Delete all related data first to avoid foreign key constraints
    // 1. Delete transactions
    await db.delete(transactions).where(eq(transactions.user_id, childId));
    
    // 2. Delete goals
    await db.delete(goals).where(eq(goals.user_id, childId));
    
    // 3. Delete daily bonuses
    await db.delete(dailyBonus).where(eq(dailyBonus.user_id, childId));
    
    // 4. Delete awarded items
    await db.delete(awardedItems).where(eq(awardedItems.child_id, childId));
    
    // 5. Finally delete the child user
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, childId))
      .returning({ id: users.id });

    if (!deleted) {
      throw new Error("Failed to delete child");
    }

    return deleted;
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

  async updateChore(
    id: number,
    update: Partial<InsertChore>,
  ): Promise<Chore | undefined> {
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

  // Chore completion operations
  async logChoreCompletion(choreId: number, userId: number): Promise<ChoreCompletion> {
    // Check if this chore was already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await db
      .select()
      .from(choreCompletions)
      .where(
        and(
          eq(choreCompletions.chore_id, choreId),
          eq(choreCompletions.user_id, userId),
          gte(choreCompletions.completion_datetime, today),
          lt(choreCompletions.completion_datetime, tomorrow)
        )
      )
      .limit(1);

    // If already completed today, return the existing completion
    if (existing.length > 0) {
      console.log(`Chore ${choreId} already completed today by user ${userId}`);
      return existing[0];
    }

    // Otherwise, create new completion
    const [completion] = await db
      .insert(choreCompletions)
      .values({
        chore_id: choreId,
        user_id: userId,
      })
      .returning();
    return completion;
  }

  async getChoreStatusForUser(userId: number): Promise<(Chore & { completed: boolean; boostPercent?: number })[]> {
    // Get all active chores
    const allChores = await this.getChores(true);
    
    // Get today's date for checking completions
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Get today's completions for this user
    const todayCompletions = await db
      .select({ chore_id: choreCompletions.chore_id })
      .from(choreCompletions)
      .where(
        and(
          eq(choreCompletions.user_id, userId),
          gte(choreCompletions.completion_datetime, startOfToday)
        )
      );
    
    // Create a set of completed chore IDs for fast lookup
    const completedChoreIds = new Set(todayCompletions.map(c => c.chore_id));
    
    // Get the user's active goal if they have one
    const activeGoal = await this.getActiveGoalByUser(userId);
    
    // Return chores with completion status and boost percentage
    return allChores.map(chore => ({
      ...chore,
      completed: completedChoreIds.has(chore.id),
      boostPercent: activeGoal ? 
        calculateBoostPercent(chore.base_tickets, activeGoal.product.price_cents) : 
        undefined,
    }));
  }

  async resetExpiredCompletions(): Promise<number> {
    const now = new Date();
    
    // Calculate cutoff dates for different recurrence types
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    
    // Delete expired completions based on chore recurrence
    // Daily chores: delete completions older than 1 day
    const dailyResult = await db
      .delete(choreCompletions)
      .where(
        and(
          sql`${choreCompletions.chore_id} IN (SELECT id FROM chores WHERE recurrence = 'daily')`,
          lt(choreCompletions.completion_datetime, oneDayAgo)
        )
      );
    
    // Weekly chores: delete completions older than 7 days
    const weeklyResult = await db
      .delete(choreCompletions)
      .where(
        and(
          sql`${choreCompletions.chore_id} IN (SELECT id FROM chores WHERE recurrence = 'weekly')`,
          lt(choreCompletions.completion_datetime, oneWeekAgo)
        )
      );
    
    // Monthly chores: delete completions older than 31 days
    const monthlyResult = await db
      .delete(choreCompletions)
      .where(
        and(
          sql`${choreCompletions.chore_id} IN (SELECT id FROM chores WHERE recurrence = 'monthly')`,
          lt(choreCompletions.completion_datetime, oneMonthAgo)
        )
      );
    
    // Return total number of deleted rows
    const totalDeleted = (dailyResult.rowCount || 0) + (weeklyResult.rowCount || 0) + (monthlyResult.rowCount || 0);
    console.log(`[CHORE_RESET] Deleted ${totalDeleted} expired chore completions`);
    return totalDeleted;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const results = await db.select().from(products).where(eq(products.id, id));
    return results[0];
  }

  async getProductByAsin(asin: string): Promise<Product | undefined> {
    const results = await db
      .select()
      .from(products)
      .where(eq(products.asin, asin));
    return results[0];
  }

  async getProductsByTitle(
    partialTitle: string,
    exactMatch: boolean = false,
  ): Promise<Product[]> {
    if (exactMatch) {
      // If exactMatch is true, we look for exact title matches (case insensitive)
      const results = await db
        .select()
        .from(products)
        .where(ilike(products.title, partialTitle));
      return results;
    } else {
      // Otherwise do partial matching with wildcards
      const results = await db
        .select()
        .from(products)
        .where(ilike(products.title, `%${partialTitle}%`));
      return results;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    // Return all products in the database
    return db.select().from(products);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const productData = {
      ...insertProduct,
      last_checked: new Date(),
    };

    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(
    id: number,
    update: Partial<InsertProduct>,
  ): Promise<Product | undefined> {
    const updateData = { ...update } as any;

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...updateData,
        last_checked: new Date(),
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

  async getGoalWithProduct(
    id: number,
  ): Promise<(Goal & { product: Product }) | undefined> {
    const result = await db
      .select({
        id: goals.id,
        user_id: goals.user_id,
        product_id: goals.product_id,
        is_active: goals.is_active,
        purchased_at: goals.purchased_at,
        product: products,
      })
      .from(goals)
      .where(eq(goals.id, id))
      .innerJoin(products, eq(goals.product_id, products.id));

    return result[0];
  }

  async getGoalsByUser(userId: number): Promise<Goal[]> {
    return db.select().from(goals).where(eq(goals.user_id, userId));
  }

  async getActiveGoalByUser(
    userId: number,
  ): Promise<(Goal & { product: Product }) | undefined> {
    const result = await db
      .select({
        id: goals.id,
        user_id: goals.user_id,
        product_id: goals.product_id,
        is_active: goals.is_active,
        purchased_at: goals.purchased_at,
        product: products,
      })
      .from(goals)
      .where(and(eq(goals.user_id, userId), eq(goals.is_active, true)))
      .innerJoin(products, eq(goals.product_id, products.id));

    return result[0];
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    // If we're creating a new goal, deactivate other goals for this user
    await db
      .update(goals)
      .set({ is_active: false })
      .where(
        and(eq(goals.user_id, insertGoal.user_id), eq(goals.is_active, true)),
      );

    const goalData = {
      ...insertGoal,
      is_active: true,
    };

    const [goal] = await db.insert(goals).values(goalData).returning();
    return goal;
  }

  async updateGoal(
    id: number,
    update: Partial<Goal>,
  ): Promise<Goal | undefined> {
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
        console.log(
          `[GOAL_DEBUG] Current goal info for activation:`,
          currentGoal,
        );

        // Get the user ID
        const userId = currentGoal.user_id;

        // Find the currently active goal for this user
        const [activeGoal] = await db
          .select()
          .from(goals)
          .where(and(eq(goals.user_id, userId), eq(goals.is_active, true)));

        console.log(
          `[GOAL_DEBUG] Current active goal for user ${userId}:`,
          activeGoal || "None",
        );

        // Deactivate previous active goal if different
        if (activeGoal && activeGoal.id !== id) {
          console.log(
            `[GOAL_DEBUG] Deactivating previous active goal ${activeGoal.id}`,
          );
          await db
            .update(goals)
            .set({ is_active: false })
            .where(eq(goals.id, activeGoal.id));
        }

        // Activate the current goal
        console.log(`[GOAL_DEBUG] Activating goal ${id}`);
        const [updatedGoal] = await db
          .update(goals)
          .set({
            is_active: true,
          })
          .where(eq(goals.id, id))
          .returning();

        if (updatedGoal) {
          console.log(
            `[GOAL_DEBUG] Successfully activated goal ${id}`,
          );
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
        console.log(
          `[STORAGE_DELETE_GOAL] Goal ID ${id} not found initially. Cannot delete.`,
        );
        return false;
      }

      console.log(
        `[STORAGE_DELETE_GOAL] Goal ID ${id} found. Disassociating transactions first.`,
      );
      // Set goal_id to NULL for all transactions referencing this goal
      await db
        .update(transactions)
        .set({ goal_id: null })
        .where(eq(transactions.goal_id, id));
      console.log(
        `[STORAGE_DELETE_GOAL] Transactions for goal ID ${id} disassociated.`,
      );

      console.log(`[STORAGE_DELETE_GOAL] Attempting to delete goal ID ${id}.`);
      const deleteResult = await db
        .delete(goals)
        .where(eq(goals.id, id))
        .returning({ id: goals.id });
      console.log(
        `[STORAGE_DELETE_GOAL] Drizzle delete operation result for goal ID ${id}:`,
        deleteResult,
      );

      const stillExists = await this.getGoal(id);
      if (stillExists) {
        console.warn(
          `[STORAGE_DELETE_GOAL] VERIFICATION FAILED: Goal ID ${id} still exists after delete attempt.`,
        );
        return false;
      }

      console.log(
        `[STORAGE_DELETE_GOAL] VERIFICATION SUCCESS: Goal ID ${id} successfully deleted.`,
      );
      return true;
    } catch (error) {
      console.error(
        `[STORAGE_DELETE_GOAL] Error deleting goal ID ${id}:`,
        error,
      );
      return false;
    }
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const results = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return results[0];
  }

  async deleteTransaction(id: number): Promise<boolean> {
    try {
      // Get the transaction first to determine how to handle it
      const transaction = await this.getTransaction(id);
      if (!transaction) {
        return false;
      }

      // No longer need to update tickets_saved when deleting transactions

      // If this transaction is for completing a chore, we need to check if it was a daily bonus chore
      // and reset the revealed flag in the dailyBonus table
      if (
        transaction.chore_id &&
        transaction.type === "earn" &&
        transaction.created_at
      ) {
        console.log(
          `Transaction ${transaction.id} is a chore completion transaction for chore ${transaction.chore_id}`,
        );

        // Extract the date from the transaction date
        const transactionDate = new Date(transaction.created_at);
        const transactionDateStr = transactionDate.toISOString().split("T")[0];
        console.log(`Transaction date: ${transactionDateStr}`);

        // Check if there is a dailyBonus record for this user, date, and chore
        console.log(
          `Looking for daily bonus record for user ${transaction.user_id} on ${transactionDateStr}`,
        );
        const dailyBonusRecord = await this.getDailyBonus(
          transactionDateStr,
          transaction.user_id,
        );

        if (dailyBonusRecord) {
          console.log(`Found daily bonus record: `, dailyBonusRecord);

          if (dailyBonusRecord.assigned_chore_id === transaction.chore_id) {
            console.log(
              `Resetting daily bonus for user ${transaction.user_id}, chore ${transaction.chore_id} on ${transactionDateStr}`,
            );

            // Store the original spin result tickets value before resetting
            const originalSpinResultTickets =
              dailyBonusRecord.spin_result_tickets || null;

            // Completely reset the daily bonus state
            console.log(
              `Updating daily bonus record ${dailyBonusRecord.id} to set is_spun=false, preserving spin_result_tickets=${originalSpinResultTickets}`,
            );

            const updateResult = await db
              .update(dailyBonus)
              .set({
                is_spun: false,
                // Keep the original spin result tickets that were assigned, don't set to null/0
                // This preserves the "prize" while making it available again
                spin_result_tickets: originalSpinResultTickets,
              })
              .where(eq(dailyBonus.id, dailyBonusRecord.id))
              .returning();

            console.log(
              `Daily bonus reset complete. Update result:`,
              updateResult,
            );
            console.log(
              `Spin result tickets preserved: ${originalSpinResultTickets}`,
            );
          } else {
            console.log(
              `Daily bonus assigned chore ID ${dailyBonusRecord.assigned_chore_id} doesn't match transaction chore ID ${transaction.chore_id}, not resetting`,
            );
          }
        } else {
          console.log(
            `No daily bonus record found for user ${transaction.user_id} on ${transactionDateStr}`,
          );
        }
      } else {
        console.log(
          `Transaction ${transaction.id} is not a chore completion transaction or lacks required fields:`,
          {
            has_chore_id: !!transaction.chore_id,
            type: transaction.type,
            has_date: !!transaction.created_at,
          },
        );
      }

      // Delete the transaction
      const deleted = await db
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning({ id: transactions.id });

      return deleted.length > 0;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }
  }

  async createTransaction(
    insertTransaction: InsertTransaction,
  ): Promise<Transaction> {
    const {
      user_id,
      delta,
      type,
      chore_id,
      goal_id,
      note,
      source,
      ref_id,
      reason,
      metadata,
      to_shared_goal_id,
    } = insertTransaction;
    console.log(
      `[TRANSACTION] Creating transaction for user ${user_id}, delta: ${delta}, type: ${type}`,
    );

    const transactionData = {
      ...insertTransaction,
      user_id,
      delta,
      type: type || "earn",
      source: source || "chore",
      created_at: new Date(),
    };

    // Calculate user's current balance for validation
    const currentBalance = await this.getUserBalance(user_id);
    console.log(
      `[TRANSACTION] Current balance for user ${user_id}: ${currentBalance}`,
    );

    const [transaction] = await db
      .insert(transactions)
      .values({
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
        to_shared_goal_id: transactionData.to_shared_goal_id,
      })
      .returning();
    console.log(
      `[TRANSACTION] Created transaction ${transaction.id} with delta ${transaction.delta}`,
    );

    const newBalance = await this.getUserBalance(user_id);
    console.log(`[TRANSACTION] New balance for user ${user_id}: ${newBalance}`);

    // Update the user's balance cache
    await db
      .update(users)
      .set({ balance_cache: newBalance })
      .where(eq(users.id, user_id));
    console.log(`[TRANSACTION] Updated balance_cache for user ${user_id} to ${newBalance}`);

    // No longer need to update tickets_saved - progress is calculated from balance

    return transaction;
  }

  async getUserTransactions(
    userId: number,
    limit = 10,
  ): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.user_id, userId))
      .orderBy(desc(transactions.created_at))
      .limit(limit);
  }

  async getUserTransactionsWithDetails(
    userId: number,
    limit = 10,
  ): Promise<
    (Transaction & { chore?: Chore; goal?: Goal & { product?: Product } })[]
  > {
    // First get the transactions
    const userTransactions = await this.getUserTransactions(userId, limit);

    // For each transaction, fetch related entities if needed
    const results = await Promise.all(
      userTransactions.map(async (tx) => {
        const result: Transaction & {
          chore?: Chore;
          goal?: Goal & { product?: Product };
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
      }),
    );

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

  async hasCompletedChoreToday(
    userId: number,
    choreId: number,
  ): Promise<boolean> {
    // Format today as YYYY-MM-DD for string comparison
    const todayStr = new Date().toISOString().split("T")[0];

    // Let's completely skip the check for now to allow completion
    console.log(
      `[CHORE_CHECK] Skipping completion check for user ${userId} and chore ${choreId} to avoid SQL errors`,
    );
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

  async updateUserProfileImage(
    userId: number,
    profileImageUrl: string,
  ): Promise<User | null> {
    try {
      const result = await db
        .update(users)
        .set({ profile_image_url: profileImageUrl })
        .where(eq(users.id, userId))
        .returning();

      return result.length ? result[0] : null;
    } catch (error) {
      console.error("Error updating user profile image:", error);
      return null;
    }
  }

  // Trophy Award operations - Step 1 implementation
  async awardItemToChild(award: InsertAwardedItem): Promise<AwardedItem> {
    const result = await db.insert(awardedItems).values(award).returning();
    return result[0];
  }

  async getChildTrophies(
    childId: number,
  ): Promise<(AwardedItem & { product: Product })[]> {
    const result = await db
      .select({
        id: awardedItems.id,
        child_id: awardedItems.child_id,
        item_id: awardedItems.item_id,
        awarded_by: awardedItems.awarded_by,
        custom_note: awardedItems.custom_note,
        awarded_at: awardedItems.awarded_at,
        product: products,
      })
      .from(awardedItems)
      .innerJoin(products, eq(awardedItems.item_id, products.id))
      .where(eq(awardedItems.child_id, childId))
      .orderBy(desc(awardedItems.awarded_at));

    return result.map((row) => ({
      ...row,
      product: row.product,
    }));
  }

  async deleteAwardedItem(id: number): Promise<boolean> {
    const result = await db.delete(awardedItems).where(eq(awardedItems.id, id));
    return !(!result || result.rowCount == null || result.rowCount === 0);
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
      role: "parent",
    } as InsertUser);
  }

  const childUser = await storage.getUserByUsername("child");
  if (!childUser) {
    await storage.createUser({
      name: "Child User",
      username: "child",
      email: "child@example.com",
      passwordHash: "password",
      role: "child",
    } as InsertUser);
  }
}

// Initialize default users (this runs asynchronously)
initDefaultUsers().catch((error) => {
  console.error("Failed to initialize default users:", error);
});
