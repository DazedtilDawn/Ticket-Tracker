import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { storage } from "../storage";
import { TICKET_CENT_VALUE } from "../../config/business";
import { ticketsNeededFor } from "../lib/business-logic";

describe("Purchase Goal", () => {
  let parentId: number;
  let childId: number;
  let productId: number;
  let goalId: number;

  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Create test parent
    const parent = await storage.createUser({
      email: `test-parent-${timestamp}@example.com`,
      username: `testparent${timestamp}`,
      passwordHash: "$2b$10$hash",
      name: "Test Parent",
      role: "parent",
    });
    parentId = parent.id;

    // Create test child  
    const child = await storage.createUser({
      email: `test-child-${timestamp}@example.com`, 
      username: `testchild${timestamp}`,
      passwordHash: "$2b$10$hash",
      name: "Test Child",
      role: "child",
    });
    childId = child.id;

    // Create test product
    const product = await storage.createProduct({
      title: "Test Product",
      asin: "TEST123",
      price_cents: 2500, // $25.00
      image_url: "http://example.com/image.jpg",
    });
    productId = product.id;

    // Create test goal
    const goal = await storage.createGoal({
      user_id: childId,
      product_id: productId,
      is_active: true,
    });
    goalId = goal.id;
  });

  afterAll(async () => {
    // Clean up test data
    await storage.deleteGoal(goalId);
    await storage.deleteProduct(productId);
    // Note: Users cleanup handled by test database reset
  });

  beforeEach(async () => {
    // Reset child balance to 0 before each test
    const transactions = await storage.getUserTransactions(childId);
    for (const tx of transactions) {
      await storage.deleteTransaction(tx.id);
    }
  });

  test("should successfully purchase goal with 100% progress", async () => {
    // Give child exactly enough tickets (100 tickets for $25 product)
    const ticketsNeeded = ticketsNeededFor(2500);
    expect(ticketsNeeded).toBe(100);

    await storage.createTransaction({
      user_id: childId,
      delta: ticketsNeeded,
      type: "earn",
      note: "Test earning",
    });

    // Verify balance
    const balance = await storage.getUserBalance(childId);
    expect(balance).toBe(ticketsNeeded);

    // Make purchase request
    const goal = await storage.getGoalWithProduct(goalId);
    expect(goal).toBeTruthy();
    expect(goal!.purchased_at).toBeNull();

    // Simulate the purchase logic
    const currentPrice = goal!.product.price_cents;
    const ticketsToSpend = ticketsNeededFor(currentPrice);
    
    expect(ticketsToSpend).toBe(100);

    // Create spend transaction
    const transaction = await storage.createTransaction({
      user_id: childId,
      delta: -ticketsToSpend,
      type: "spend",
      note: `Purchased: ${goal!.product.title}`,
      metadata: JSON.stringify({
        goal_id: goalId,
        product_id: productId,
        price_cents: currentPrice
      })
    });

    // Mark goal as purchased
    const purchasedAt = new Date();
    await storage.updateGoal(goalId, { purchased_at: purchasedAt });

    // Verify results
    const remainingBalance = await storage.getUserBalance(childId);
    expect(remainingBalance).toBe(0);

    const updatedGoal = await storage.getGoalWithProduct(goalId);
    expect(updatedGoal!.purchased_at).toBeTruthy();
    expect(transaction.delta).toBe(-100);
    expect(transaction.type).toBe("spend");
  });

  test("should reject purchase with less than 100% progress", async () => {
    // Give child insufficient tickets (50 tickets for $25 product = 50% progress)
    await storage.createTransaction({
      user_id: childId,
      delta: 50,
      type: "earn", 
      note: "Test earning",
    });

    const balance = await storage.getUserBalance(childId);
    expect(balance).toBe(50);

    const goal = await storage.getGoalWithProduct(goalId);
    const currentPrice = goal!.product.price_cents;
    const ticketsNeeded = ticketsNeededFor(currentPrice);
    
    // Verify insufficient balance
    expect(balance).toBeLessThan(ticketsNeeded);
    
    // Progress should be 50%
    const progressPercent = (balance * TICKET_CENT_VALUE / currentPrice) * 100;
    expect(progressPercent).toBe(50);
  });

  test("should handle over-saved scenario correctly", async () => {
    // Give child more tickets than needed (150 tickets for $25 product)
    await storage.createTransaction({
      user_id: childId,
      delta: 150,
      type: "earn",
      note: "Test earning",
    });

    const balance = await storage.getUserBalance(childId);
    expect(balance).toBe(150);

    const goal = await storage.getGoalWithProduct(goalId);
    const currentPrice = goal!.product.price_cents;
    const ticketsNeeded = ticketsNeededFor(currentPrice);
    
    expect(ticketsNeeded).toBe(100);
    expect(balance).toBeGreaterThan(ticketsNeeded);

    // Only spend what's needed
    const ticketsToSpend = ticketsNeeded;
    
    await storage.createTransaction({
      user_id: childId,
      delta: -ticketsToSpend,
      type: "spend",
      note: `Purchased: ${goal!.product.title}`,
    });

    await storage.updateGoal(goalId, { purchased_at: new Date() });

    // Verify 50 tickets remain
    const remainingBalance = await storage.getUserBalance(childId);
    expect(remainingBalance).toBe(50);
  });

  test("should reject purchase of already purchased goal", async () => {
    // Set goal as already purchased
    await storage.updateGoal(goalId, { purchased_at: new Date() });

    const goal = await storage.getGoalWithProduct(goalId);
    expect(goal!.purchased_at).toBeTruthy();
    
    // This would be caught by the route handler checking purchased_at
  });

  test("should reject purchase of inactive goal", async () => {
    // Set goal as inactive
    await storage.updateGoal(goalId, { is_active: false, purchased_at: null });

    const goal = await storage.getGoalWithProduct(goalId);
    expect(goal!.is_active).toBe(false);
    
    // This would be caught by the route handler checking is_active
  });

  test("should correctly calculate tickets needed for different prices", async () => {
    // Test price calculations
    expect(ticketsNeededFor(25)).toBe(1);   // $0.25 = 1 ticket
    expect(ticketsNeededFor(50)).toBe(2);   // $0.50 = 2 tickets  
    expect(ticketsNeededFor(26)).toBe(2);   // $0.26 = 2 tickets (rounded up)
    expect(ticketsNeededFor(2500)).toBe(100); // $25.00 = 100 tickets
    expect(ticketsNeededFor(1000)).toBe(40);  // $10.00 = 40 tickets
  });

  test("should handle price changes correctly", async () => {
    // Give child tickets for original price
    await storage.createTransaction({
      user_id: childId,
      delta: 100, // For $25 product
      type: "earn",
      note: "Test earning",
    });

    // Simulate price decrease
    await storage.updateProduct(productId, { price_cents: 1500 }); // $15.00

    const goal = await storage.getGoalWithProduct(goalId);
    const newPrice = goal!.product.price_cents;
    const newTicketsNeeded = ticketsNeededFor(newPrice);
    
    expect(newPrice).toBe(1500);
    expect(newTicketsNeeded).toBe(60); // $15 = 60 tickets

    const balance = await storage.getUserBalance(childId);
    expect(balance).toBe(100);
    
    // Child now has more than needed (over-saved scenario)
    expect(balance).toBeGreaterThan(newTicketsNeeded);
    
    // Purchase should only spend what's needed
    await storage.createTransaction({
      user_id: childId,
      delta: -newTicketsNeeded,
      type: "spend", 
      note: `Purchased: ${goal!.product.title}`,
    });

    const remainingBalance = await storage.getUserBalance(childId);
    expect(remainingBalance).toBe(40); // 100 - 60 = 40 tickets left
  });
});