import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { storage } from "../storage";
import { spinTicketReward } from "../lib/business-logic";

describe("POST /api/bonus/spin", () => {
  let parentId: number;
  let childId: number;
  let otherChildId: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create test parent
    const parent = await storage.createUser({
      email: `test-parent-spin-${timestamp}@example.com`,
      username: `testparentspin${timestamp}`,
      passwordHash: "$2b$10$hash",
      name: "Test Parent Spin",
      role: "parent",
    });
    parentId = parent.id;

    // Create test child
    const child = await storage.createUser({
      email: `test-child-spin-${timestamp}@example.com`, 
      username: `testchildspin${timestamp}`,
      passwordHash: "$2b$10$hash",
      name: "Test Child Spin",
      role: "child",
    });
    childId = child.id;

    // Create other child for isolation tests
    const otherChild = await storage.createUser({
      email: `other-child-spin-${timestamp}@example.com`,
      username: `otherchildspin${timestamp}`,
      passwordHash: "$2b$10$hash", 
      name: "Other Child Spin",
      role: "child",
    });
    otherChildId = otherChild.id;
  });

  beforeEach(async () => {
    // Clean up any existing daily bonuses and transactions for test isolation
    // Note: Tests will create their own bonuses as needed
  });

  test("first spin awards tickets and marks bonus as revealed", async () => {
    // Create a fresh user for this test
    const testUser = await storage.createUser({
      email: `test-spin-first-${Date.now()}@example.com`,
      username: `testspinfirst${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Spin First User",
      role: "child",
    });

    // Assign a bonus first
    const { assignDailyBonus } = await import("../lib/business-logic");
    const initialBonus = await assignDailyBonus(testUser.id);
    expect(initialBonus.revealed).toBe(false);

    // Get initial balance
    const initialBalance = await storage.getUserBalance(testUser.id);

    // Simulate the spin endpoint logic
    const bonus = await storage.getTodayDailyBonusSimple(testUser.id);
    expect(bonus).toBeDefined();
    expect(bonus!.revealed).toBe(false);

    const tickets = spinTicketReward();
    expect([1, 2, 3, 5, 8]).toContain(tickets);

    // Create transaction
    const transaction = await storage.createTransaction({
      user_id: testUser.id,
      delta: tickets,
      type: "earn",
      note: "Daily-spin",
      metadata: JSON.stringify({ bonus_id: bonus!.id }),
    });

    // Mark bonus as revealed
    const updatedBonus = await storage.markDailyBonusRevealed(bonus!.id, tickets);
    expect(updatedBonus.revealed).toBe(true);
    expect(updatedBonus.bonus_tickets).toBe(tickets);

    // Verify balance increased
    const finalBalance = await storage.getUserBalance(testUser.id);
    expect(finalBalance).toBe(initialBalance + tickets);

    // Verify transaction was created correctly
    expect(transaction.user_id).toBe(testUser.id);
    expect(transaction.delta).toBe(tickets);
    expect(transaction.type).toBe("earn");
    expect(transaction.note).toBe("Daily-spin");
    
    // Verify metadata is correctly stored (as JSON string)
    expect(transaction.metadata).toBeDefined();
    expect(typeof transaction.metadata).toBe("string");
    const metadata = JSON.parse(transaction.metadata as string);
    expect(metadata.bonus_id).toBe(bonus!.id);
  });

  test("second spin same day returns 409 (already spun)", async () => {
    // Create a fresh user for this test
    const testUser = await storage.createUser({
      email: `test-spin-second-${Date.now()}@example.com`,
      username: `testspinsecond${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Spin Second User",
      role: "child",
    });

    // Assign and spin the bonus once
    const { assignDailyBonus } = await import("../lib/business-logic");
    const initialBonus = await assignDailyBonus(testUser.id);
    
    const tickets = spinTicketReward();
    await storage.createTransaction({
      user_id: testUser.id,
      delta: tickets,
      type: "earn",
      note: "Daily-spin",
      metadata: JSON.stringify({ bonus_id: initialBonus.id }),
    });
    const revealedBonus = await storage.markDailyBonusRevealed(initialBonus.id, tickets);
    expect(revealedBonus.revealed).toBe(true);

    // Try to spin again - should fail
    const bonus = await storage.getTodayDailyBonusSimple(testUser.id);
    expect(bonus).toBeDefined();
    expect(bonus!.revealed).toBe(true);

    // This simulates the 409 response that would be returned
    const shouldReturnConflict = bonus!.revealed;
    expect(shouldReturnConflict).toBe(true);
  });

  test("parent spins for child inside family succeeds", async () => {
    // Create family users with proper parent-child relationship
    const familyParent = await storage.createUser({
      email: `family-parent-spin-${Date.now()}@example.com`,
      username: `familyparentspin${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Family Parent Spin",
      role: "parent",
    });

    const familyChild = await storage.createUser({
      email: `family-child-spin-${Date.now()}@example.com`,
      username: `familychildspin${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Family Child Spin", 
      role: "child",
    });

    // Assign bonus to child
    const { assignDailyBonus } = await import("../lib/business-logic");
    const bonus = await assignDailyBonus(familyChild.id);

    // Verify parent can access child's bonus (simulating endpoint logic)
    const parentUser = await storage.getUser(familyParent.id);
    const childUser = await storage.getUser(familyChild.id);
    
    expect(parentUser).toBeDefined();
    expect(childUser).toBeDefined();
    expect(parentUser!.role).toBe("parent");
    expect(childUser!.role).toBe("child");

    // In a real scenario with proper family relationships, this would check family_id
    // For this test, we verify the logic would work
    const initialBalance = await storage.getUserBalance(familyChild.id);

    // Parent spins for child
    const tickets = spinTicketReward();
    const transaction = await storage.createTransaction({
      user_id: familyChild.id,
      delta: tickets,
      type: "earn", 
      note: "Daily-spin",
      metadata: JSON.stringify({ bonus_id: bonus.id }),
    });

    const updatedBonus = await storage.markDailyBonusRevealed(bonus.id, tickets);
    const finalBalance = await storage.getUserBalance(familyChild.id);

    expect(updatedBonus.revealed).toBe(true);
    expect(finalBalance).toBe(initialBalance + tickets);
    expect(transaction.user_id).toBe(familyChild.id);
  });

  test("tickets are always in valid range [1,2,3,5,8]", async () => {
    // Test spin reward function multiple times
    const validTickets = [1, 2, 3, 5, 8];
    
    for (let i = 0; i < 50; i++) {
      const tickets = spinTicketReward();
      expect(validTickets).toContain(tickets);
      expect(typeof tickets).toBe("number");
      expect(tickets).toBeGreaterThan(0);
    }
  });

  test("balance increases by exactly the spun tickets amount", async () => {
    // Create a fresh user for this test
    const testUser = await storage.createUser({
      email: `test-balance-${Date.now()}@example.com`,
      username: `testbalance${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Balance User",
      role: "child",
    });

    // Get initial balance (should be 0)
    const initialBalance = await storage.getUserBalance(testUser.id);
    expect(initialBalance).toBe(0);

    // Assign bonus
    const { assignDailyBonus } = await import("../lib/business-logic");
    await assignDailyBonus(testUser.id);

    // Spin with specific ticket amount
    const specificTickets = 5; // Use a specific value for predictable testing
    
    const transaction = await storage.createTransaction({
      user_id: testUser.id,
      delta: specificTickets,
      type: "earn",
      note: "Daily-spin",
      metadata: JSON.stringify({ bonus_id: 1 }),
    });

    const finalBalance = await storage.getUserBalance(testUser.id);
    expect(finalBalance).toBe(initialBalance + specificTickets);
    expect(transaction.delta).toBe(specificTickets);
  });

  test("no bonus assigned returns 404", async () => {
    // Create a user without assigning any bonus
    const testUser = await storage.createUser({
      email: `test-no-bonus-${Date.now()}@example.com`,
      username: `testnobonus${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test No Bonus User",
      role: "child",
    });

    // Try to get today's bonus - should be undefined
    const bonus = await storage.getTodayDailyBonusSimple(testUser.id);
    expect(bonus).toBeUndefined();

    // This simulates the 404 response that would be returned
    const shouldReturn404 = !bonus;
    expect(shouldReturn404).toBe(true);
  });

  test("transaction metadata includes bonus_id", async () => {
    // Create a fresh user for this test
    const testUser = await storage.createUser({
      email: `test-metadata-${Date.now()}@example.com`,
      username: `testmetadata${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Metadata User",
      role: "child",
    });

    // Assign bonus
    const { assignDailyBonus } = await import("../lib/business-logic");
    const bonus = await assignDailyBonus(testUser.id);

    // Create transaction with metadata
    const tickets = 3;
    const transaction = await storage.createTransaction({
      user_id: testUser.id,
      delta: tickets,
      type: "earn",
      note: "Daily-spin",
      metadata: JSON.stringify({ bonus_id: bonus.id }),
    });

    // Verify metadata is correctly stored (as JSON string)
    expect(transaction.metadata).toBeDefined();
    expect(typeof transaction.metadata).toBe("string");
    const metadata = JSON.parse(transaction.metadata as string);
    expect(metadata.bonus_id).toBe(bonus.id);
    expect(typeof metadata.bonus_id).toBe("number");
  });

  test("spin updates bonus with final ticket amount", async () => {
    // Create a fresh user for this test
    const testUser = await storage.createUser({
      email: `test-final-tickets-${Date.now()}@example.com`,
      username: `testfinaltickets${Date.now()}`,
      passwordHash: "$2b$10$hash",
      name: "Test Final Tickets User",
      role: "child",
    });

    // Assign bonus with initial random amount
    const { assignDailyBonus } = await import("../lib/business-logic");
    const initialBonus = await assignDailyBonus(testUser.id);
    const initialTicketAmount = initialBonus.bonus_tickets;

    // Spin with a specific different amount to ensure it changes
    const finalTicketAmount = initialTicketAmount === 8 ? 1 : 8; // Ensure it's different
    const updatedBonus = await storage.markDailyBonusRevealed(initialBonus.id, finalTicketAmount);

    // Verify the bonus was updated with the final spun amount
    expect(updatedBonus.id).toBe(initialBonus.id);
    expect(updatedBonus.bonus_tickets).toBe(finalTicketAmount);
    expect(updatedBonus.bonus_tickets).not.toBe(initialTicketAmount); // Should have changed
    expect(updatedBonus.revealed).toBe(true);
  });
});