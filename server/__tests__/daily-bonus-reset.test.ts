import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { storage } from "../storage";
import { assignDailyBonus } from "../lib/business-logic";

describe("Daily Bonus Reset Job", () => {
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create test users
    const user1 = await storage.createUser({
      email: `test-reset-user1-${timestamp}@example.com`,
      username: `testresetuser1${timestamp}`,
      passwordHash: "$2b$10$hash",
      name: "Test Reset User 1",
      role: "child",
    });
    user1Id = user1.id;

    const user2 = await storage.createUser({
      email: `test-reset-user2-${timestamp}@example.com`, 
      username: `testresetuser2${timestamp}`,
      passwordHash: "$2b$10$hash",
      name: "Test Reset User 2",
      role: "child",
    });
    user2Id = user2.id;

    const user3 = await storage.createUser({
      email: `test-reset-user3-${timestamp}@example.com`,
      username: `testresetuser3${timestamp}`,
      passwordHash: "$2b$10$hash", 
      name: "Test Reset User 3",
      role: "child",
    });
    user3Id = user3.id;
  });

  beforeEach(async () => {
    // Clean up any existing bonuses before each test
    // In a real scenario, we'd have a cleanup method
  });

  test("should reset all revealed bonuses back to unrevealed state", async () => {
    // Assign bonuses to all three users
    const bonus1 = await assignDailyBonus(user1Id);
    const bonus2 = await assignDailyBonus(user2Id);
    const bonus3 = await assignDailyBonus(user3Id);

    // Mark bonus1 and bonus2 as revealed (simulating they were spun)
    await storage.markDailyBonusRevealed(bonus1.id, 5);
    await storage.markDailyBonusRevealed(bonus2.id, 3);
    // Leave bonus3 unrevealed

    // Verify the current states
    const revealedBonus1 = await storage.getTodayDailyBonusSimple(user1Id);
    const revealedBonus2 = await storage.getTodayDailyBonusSimple(user2Id);
    const unrevealedBonus3 = await storage.getTodayDailyBonusSimple(user3Id);

    expect(revealedBonus1!.revealed).toBe(true);
    expect(revealedBonus2!.revealed).toBe(true);
    expect(unrevealedBonus3!.revealed).toBe(false);

    // Run the reset
    const affectedRows = await storage.resetRevealedDailyBonuses();
    expect(affectedRows).toBeGreaterThanOrEqual(2); // Should reset at least our 2 bonuses

    // Verify all bonuses are now unrevealed
    const afterBonus1 = await storage.getTodayDailyBonusSimple(user1Id);
    const afterBonus2 = await storage.getTodayDailyBonusSimple(user2Id);
    const afterBonus3 = await storage.getTodayDailyBonusSimple(user3Id);

    expect(afterBonus1!.revealed).toBe(false);
    expect(afterBonus2!.revealed).toBe(false);
    expect(afterBonus3!.revealed).toBe(false);

    // Verify ticket amounts are preserved
    expect(afterBonus1!.bonus_tickets).toBe(5);
    expect(afterBonus2!.bonus_tickets).toBe(3);
  });

  test("should return 0 when no revealed bonuses exist", async () => {
    // Create a fresh user with no bonus
    const freshUser = await storage.createUser({
      email: `test-reset-fresh-${Date.now()}@example.com`,
      username: `testresetfresh${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Reset Fresh User",
      role: "child",
    });

    // Assign but don't reveal
    await assignDailyBonus(freshUser.id);

    // Run reset - should affect 0 rows
    const affectedRows = await storage.resetRevealedDailyBonuses();
    expect(affectedRows).toBe(0);
  });

  test("should preserve bonus_tickets values during reset", async () => {
    // Create a user and assign bonus
    const testUser = await storage.createUser({
      email: `test-preserve-${Date.now()}@example.com`,
      username: `testpreserve${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Preserve User",
      role: "child",
    });

    const bonus = await assignDailyBonus(testUser.id);
    const originalTickets = bonus.bonus_tickets;

    // Mark as revealed with specific ticket amount
    const revealedTickets = 8;
    await storage.markDailyBonusRevealed(bonus.id, revealedTickets);

    // Verify it was updated
    const beforeReset = await storage.getTodayDailyBonusSimple(testUser.id);
    expect(beforeReset!.bonus_tickets).toBe(revealedTickets);
    expect(beforeReset!.revealed).toBe(true);

    // Run reset
    await storage.resetRevealedDailyBonuses();

    // Verify tickets are preserved but revealed is false
    const afterReset = await storage.getTodayDailyBonusSimple(testUser.id);
    expect(afterReset!.bonus_tickets).toBe(revealedTickets); // Preserved
    expect(afterReset!.revealed).toBe(false); // Reset
  });

  test("should handle multiple resets correctly", async () => {
    // Create a user with bonus
    const testUser = await storage.createUser({
      email: `test-multiple-${Date.now()}@example.com`,
      username: `testmultiple${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Multiple User",
      role: "child",
    });

    const bonus = await assignDailyBonus(testUser.id);
    
    // Mark as revealed
    await storage.markDailyBonusRevealed(bonus.id, 5);
    
    // First reset
    const firstResetCount = await storage.resetRevealedDailyBonuses();
    expect(firstResetCount).toBeGreaterThan(0);

    // Second reset should affect 0 (already reset)
    const secondResetCount = await storage.resetRevealedDailyBonuses();
    expect(secondResetCount).toBe(0);

    // Mark as revealed again
    await storage.markDailyBonusRevealed(bonus.id, 3);

    // Third reset should affect 1
    const thirdResetCount = await storage.resetRevealedDailyBonuses();
    expect(thirdResetCount).toBeGreaterThan(0);
  });

  test("should only reset bonuses with revealed=true", async () => {
    // This test ensures we don't accidentally reset unrevealed bonuses
    const testUsers = [];
    
    // Create 5 users
    for (let i = 0; i < 5; i++) {
      const user = await storage.createUser({
        email: `test-selective-${Date.now()}-${i}@example.com`,
        username: `testselective${Date.now()}${i}`,
        passwordHash: "$2b$10$hash",
        name: `Test Selective User ${i}`,
        role: "child",
      });
      testUsers.push(user);
    }

    // Assign bonuses to all
    const bonuses = [];
    for (const user of testUsers) {
      const bonus = await assignDailyBonus(user.id);
      bonuses.push(bonus);
    }

    // Mark only first 3 as revealed
    await storage.markDailyBonusRevealed(bonuses[0].id, 1);
    await storage.markDailyBonusRevealed(bonuses[1].id, 2);
    await storage.markDailyBonusRevealed(bonuses[2].id, 3);

    // Run reset
    const affectedRows = await storage.resetRevealedDailyBonuses();
    expect(affectedRows).toBe(3); // Only the 3 revealed ones

    // Verify states
    for (let i = 0; i < testUsers.length; i++) {
      const bonus = await storage.getTodayDailyBonusSimple(testUsers[i].id);
      expect(bonus!.revealed).toBe(false); // All should be unrevealed after reset
    }
  });
});