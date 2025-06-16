import { db } from "../server/db";
import { users, chores, products, goals, transactions, dailyBonus, choreCompletions, awardedItems } from "../shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Chore data with images
const choreData = [
  { name: "Make Bed", description: "Make your bed neatly", base_tickets: 2, recurrence: "daily", image_url: "/uploads/chores/make-bed.jpg" },
  { name: "Brush Teeth", description: "Brush teeth morning and night", base_tickets: 1, recurrence: "daily", image_url: "/uploads/chores/brush-teeth.jpg" },
  { name: "Clean Room", description: "Tidy up and organize your room", base_tickets: 5, recurrence: "weekly", image_url: "/uploads/chores/clean-room.jpg" },
  { name: "Feed Pets", description: "Feed the family pets", base_tickets: 3, recurrence: "daily", image_url: "/uploads/chores/feed-pets.jpg" },
  { name: "Take Out Trash", description: "Take trash bins to the curb", base_tickets: 4, recurrence: "weekly", image_url: "/uploads/chores/take-out-trash.jpg" },
  { name: "Set Table", description: "Set the table for dinner", base_tickets: 2, recurrence: "daily", image_url: "/uploads/chores/set-table.jpg" },
  { name: "Clear Table", description: "Clear table after meals", base_tickets: 2, recurrence: "daily", image_url: "/uploads/chores/clear-table.jpg" },
  { name: "Water Plants", description: "Water all indoor plants", base_tickets: 3, recurrence: "weekly", image_url: "/uploads/chores/water-plants.jpg" },
  { name: "Homework", description: "Complete all homework", base_tickets: 5, recurrence: "daily", image_url: "/uploads/chores/homework.jpg" },
  { name: "Read for 20 mins", description: "Read a book for 20 minutes", base_tickets: 3, recurrence: "daily", image_url: "/uploads/chores/read-book.jpg" },
  { name: "Practice Piano", description: "Practice piano for 30 minutes", base_tickets: 4, recurrence: "daily", image_url: "/uploads/chores/practice-piano.jpg" },
  { name: "Vacuum Living Room", description: "Vacuum the living room carpet", base_tickets: 5, recurrence: "weekly", image_url: "/uploads/chores/vacuum.jpg" },
  { name: "Load Dishwasher", description: "Load dirty dishes into dishwasher", base_tickets: 3, recurrence: "daily", image_url: "/uploads/chores/dishwasher.jpg" },
  { name: "Fold Laundry", description: "Fold and put away clean laundry", base_tickets: 4, recurrence: "weekly", image_url: "/uploads/chores/fold-laundry.jpg" },
  { name: "Pack School Bag", description: "Pack bag for next school day", base_tickets: 2, recurrence: "daily", image_url: "/uploads/chores/pack-bag.jpg" }
];

async function cleanAndRestoreData() {
  try {
    console.log("🧹 Starting cleanup and restore process...");

    // Step 1: Find or create parent account
    console.log("\n📋 Setting up parent account...");
    let parentUser = await db.select().from(users)
      .where(and(eq(users.username, "parent"), eq(users.role, "parent")))
      .limit(1);

    if (parentUser.length === 0) {
      console.log("Creating parent account...");
      const hashedPassword = await bcrypt.hash("password", 10);
      const [newParent] = await db.insert(users).values({
        name: "Parent",
        username: "parent",
        email: "parent@example.com",
        passwordHash: hashedPassword,
        role: "parent",
        balance_cache: 0
      }).returning();
      parentUser = [newParent];
      console.log("✅ Parent account created");
    } else {
      console.log("✅ Parent account already exists");
    }

    const parentId = parentUser[0].id;
    const familyId = parentUser[0].family_id || parentId;

    // Step 2: Clean up existing children (archive instead of delete)
    console.log("\n🧹 Archiving existing children...");
    await db.update(users)
      .set({ is_archived: true })
      .where(and(eq(users.role, "child"), eq(users.family_id, familyId)));

    // Step 3: Create Bryce and Kiki
    console.log("\n👶 Creating children accounts...");
    
    // Check if Bryce exists and unarchive or create
    let bryceUser = await db.select().from(users)
      .where(and(eq(users.name, "Bryce"), eq(users.family_id, familyId)))
      .limit(1);

    if (bryceUser.length > 0) {
      console.log("Unarchiving Bryce...");
      await db.update(users)
        .set({ is_archived: false })
        .where(eq(users.id, bryceUser[0].id));
    } else {
      console.log("Creating Bryce...");
      const [newBryce] = await db.insert(users).values({
        name: "Bryce",
        username: `bryce_${Date.now()}`,
        passwordHash: "DISABLED",
        role: "child",
        family_id: familyId,
        balance_cache: 0,
        banner_color_preference: "from-blue-400 to-purple-600",
        profile_image_url: "/uploads/profiles/bryce.jpg"
      }).returning();
      bryceUser = [newBryce];
    }

    // Check if Kiki exists and unarchive or create
    let kikiUser = await db.select().from(users)
      .where(and(eq(users.name, "Kiki"), eq(users.family_id, familyId)))
      .limit(1);

    if (kikiUser.length > 0) {
      console.log("Unarchiving Kiki...");
      await db.update(users)
        .set({ is_archived: false })
        .where(eq(users.id, kikiUser[0].id));
    } else {
      console.log("Creating Kiki...");
      const [newKiki] = await db.insert(users).values({
        name: "Kiki",
        username: `kiki_${Date.now()}`,
        passwordHash: "DISABLED",
        role: "child",
        family_id: familyId,
        balance_cache: 0,
        banner_color_preference: "from-pink-400 to-purple-600",
        profile_image_url: "/uploads/profiles/kiki.jpg"
      }).returning();
      kikiUser = [newKiki];
    }

    console.log("✅ Children accounts ready");

    // Step 4: Clean up and recreate chores
    console.log("\n🧹 Setting up chores...");
    
    // Archive existing chores instead of deleting
    await db.update(chores).set({ is_active: false });

    // Create fresh chores
    for (const chore of choreData) {
      // Check if chore exists and reactivate or create new
      const existingChore = await db.select().from(chores)
        .where(eq(chores.name, chore.name))
        .limit(1);

      if (existingChore.length > 0) {
        await db.update(chores)
          .set({ 
            is_active: true,
            base_tickets: chore.base_tickets,
            recurrence: chore.recurrence,
            description: chore.description
          })
          .where(eq(chores.id, existingChore[0].id));
        console.log(`✅ Reactivated chore: ${chore.name}`);
      } else {
        await db.insert(chores).values({
          ...chore,
          is_active: true
        });
        console.log(`✅ Created chore: ${chore.name}`);
      }
    }

    // Step 5: Reset daily bonuses for today
    console.log("\n🎯 Resetting daily bonuses...");
    const today = new Date().toISOString().split('T')[0];
    await db.delete(dailyBonus).where(eq(dailyBonus.bonus_date, today));
    console.log("✅ Daily bonuses reset for fresh assignment");

    // Step 6: Clear recent transactions and completions (optional)
    console.log("\n🧹 Cleaning up old data...");
    
    // Delete transactions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await db.delete(transactions)
      .where(gte(transactions.created_at, thirtyDaysAgo));
    
    await db.delete(choreCompletions)
      .where(gte(choreCompletions.completion_datetime, thirtyDaysAgo));

    console.log("✅ Cleaned up old transactions and completions");

    // Step 7: Set initial balances
    console.log("\n💰 Setting initial balances...");
    await db.update(users)
      .set({ balance_cache: 10 })
      .where(eq(users.id, bryceUser[0].id));
    
    await db.update(users)
      .set({ balance_cache: 10 })
      .where(eq(users.id, kikiUser[0].id));

    console.log("✅ Set starting balance of 10 tickets for each child");

    // Summary
    console.log("\n🎉 Restoration complete!");
    console.log("📊 Summary:");
    console.log(`- Parent account: ${parentUser[0].username}`);
    console.log(`- Children: Bryce (ID: ${bryceUser[0].id}), Kiki (ID: ${kikiUser[0].id})`);
    console.log(`- Active chores: ${choreData.length}`);
    console.log(`- Starting balance: 10 tickets each`);
    console.log("\n🚀 You can now login with username: 'parent', password: 'password'");

  } catch (error) {
    console.error("❌ Error during restore:", error);
    throw error;
  } finally {
    await db.$client.end();
  }
}

// Run the restoration
if (require.main === module) {
  cleanAndRestoreData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}