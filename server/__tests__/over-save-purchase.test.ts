import { describe, expect, test } from "bun:test";
import { calculateProgressPercent, getCurrentProductPrice, calculateOverSavedTickets } from "../lib/business-logic";
import type { Goal, Product } from "@shared/schema";
import { TICKET_CENT_VALUE } from "../../config/business";

describe("Over-save purchase scenarios", () => {
  const createGoalWithProduct = (priceCents: number, ticketsSaved: number): Goal & { product: Product } => ({
    id: 1,
    user_id: 1,
    product_id: 1,
    tickets_saved: ticketsSaved,
    is_active: true,
    product: {
      id: 1,
      title: "Test Product",
      asin: "B123456789",
      image_url: "https://example.com/image.jpg",
      price_cents: priceCents,
      last_checked: new Date(),
      camel_last_checked: null,
    },
  });

  test("when price decreases, progress should reach 100% for over-saved tickets", () => {
    // User saved 100 tickets for a $25 product (needs 100 tickets)
    const goalBefore = createGoalWithProduct(2500, 100);
    const progressBefore = calculateProgressPercent(
      goalBefore.tickets_saved,
      getCurrentProductPrice(goalBefore)
    );
    expect(progressBefore).toBe(100); // Exactly 100%

    // Price drops to $20 (now only needs 80 tickets)
    const goalAfter = createGoalWithProduct(2000, 100);
    const progressAfter = calculateProgressPercent(
      goalAfter.tickets_saved,
      getCurrentProductPrice(goalAfter)
    );
    expect(progressAfter).toBe(100); // Still 100% (capped)
    
    // Calculate over-saved tickets
    const overSaved = calculateOverSavedTickets(
      goalAfter.tickets_saved,
      getCurrentProductPrice(goalAfter)
    );
    expect(overSaved).toBe(20); // 100 saved - 80 needed = 20 extra
  });

  test("calculateOverSavedTickets should return correct values", () => {
    // No over-save case
    const goal1 = createGoalWithProduct(2500, 50); // Need 100, have 50
    expect(calculateOverSavedTickets(50, 2500)).toBe(0);

    // Exact match case
    const goal2 = createGoalWithProduct(2500, 100); // Need 100, have 100
    expect(calculateOverSavedTickets(100, 2500)).toBe(0);

    // Over-save case
    const goal3 = createGoalWithProduct(2000, 100); // Need 80, have 100
    expect(calculateOverSavedTickets(100, 2000)).toBe(20);

    // Large over-save case
    const goal4 = createGoalWithProduct(500, 100); // Need 20, have 100
    expect(calculateOverSavedTickets(100, 500)).toBe(80);

    // Edge case: zero price
    expect(calculateOverSavedTickets(50, 0)).toBe(50);
  });

  test("purchase should only deduct needed tickets when over-saved", () => {
    // Simulate the spend logic
    const goal = createGoalWithProduct(1500, 80); // $15 product, user has 80 tickets
    const currentPrice = getCurrentProductPrice(goal);
    const maxTicketsNeeded = Math.ceil(currentPrice / TICKET_CENT_VALUE);
    const ticketsToSpend = Math.min(goal.tickets_saved, maxTicketsNeeded);
    
    expect(maxTicketsNeeded).toBe(60); // $15 = 60 tickets
    expect(ticketsToSpend).toBe(60); // Should only spend 60, not all 80
    expect(goal.tickets_saved - ticketsToSpend).toBe(20); // 20 tickets remain
  });

  test("price decrease during saving should handle edge cases", () => {
    // User starts saving for $100 product (needs 400 tickets)
    let goal = createGoalWithProduct(10000, 200); // Has 200 tickets
    expect(calculateProgressPercent(goal.tickets_saved, getCurrentProductPrice(goal))).toBe(50);

    // Price drops to $40 (needs 160 tickets)
    goal = createGoalWithProduct(4000, 200);
    expect(calculateProgressPercent(goal.tickets_saved, getCurrentProductPrice(goal))).toBe(100);
    expect(calculateOverSavedTickets(goal.tickets_saved, getCurrentProductPrice(goal))).toBe(40);

    // Price drops further to $25 (needs 100 tickets)
    goal = createGoalWithProduct(2500, 200);
    expect(calculateProgressPercent(goal.tickets_saved, getCurrentProductPrice(goal))).toBe(100);
    expect(calculateOverSavedTickets(goal.tickets_saved, getCurrentProductPrice(goal))).toBe(100);
  });

  test("fractional ticket calculations should round up correctly", () => {
    // $10.01 product = 41 tickets (40.04 rounded up)
    const goal1 = createGoalWithProduct(1001, 50);
    const needed1 = Math.ceil(1001 / TICKET_CENT_VALUE);
    expect(needed1).toBe(41);
    expect(calculateOverSavedTickets(50, 1001)).toBe(9);

    // $0.26 product = 2 tickets (1.04 rounded up)
    const goal2 = createGoalWithProduct(26, 5);
    const needed2 = Math.ceil(26 / TICKET_CENT_VALUE);
    expect(needed2).toBe(2);
    expect(calculateOverSavedTickets(5, 26)).toBe(3);
  });

  test("edge cases: negative values should be handled safely", () => {
    // Negative tickets saved should return 0
    expect(calculateOverSavedTickets(-10, 1000)).toBe(0);
    
    // Negative price should treat as 0 (all tickets are over-saved)
    expect(calculateOverSavedTickets(50, -100)).toBe(50);
    
    // Both negative should return 0
    expect(calculateOverSavedTickets(-50, -100)).toBe(0);
  });

  test("concurrent price updates should be handled correctly", () => {
    // Simulate multiple price updates happening quickly
    const goal = createGoalWithProduct(5000, 150); // Start with $50 product, 150 tickets
    
    // First check
    expect(calculateProgressPercent(goal.tickets_saved, goal.product.price_cents)).toBe(75);
    expect(calculateOverSavedTickets(goal.tickets_saved, goal.product.price_cents)).toBe(0);
    
    // Price drops to $30 (concurrent update 1)
    goal.product.price_cents = 3000;
    expect(calculateProgressPercent(goal.tickets_saved, goal.product.price_cents)).toBe(100);
    expect(calculateOverSavedTickets(goal.tickets_saved, goal.product.price_cents)).toBe(30);
    
    // Price drops further to $20 (concurrent update 2)
    goal.product.price_cents = 2000;
    expect(calculateProgressPercent(goal.tickets_saved, goal.product.price_cents)).toBe(100);
    expect(calculateOverSavedTickets(goal.tickets_saved, goal.product.price_cents)).toBe(70);
    
    // Price goes back up to $40 (concurrent update 3)
    goal.product.price_cents = 4000;
    expect(calculateProgressPercent(goal.tickets_saved, goal.product.price_cents)).toBe(93.8);
    expect(calculateOverSavedTickets(goal.tickets_saved, goal.product.price_cents)).toBe(0); // 150 tickets < 160 needed
  });

  test("spend logic should never deduct more than available tickets", () => {
    // User has 50 tickets, product costs 20 tickets
    const goal = createGoalWithProduct(500, 50);
    const currentPrice = getCurrentProductPrice(goal);
    const maxTicketsNeeded = Math.ceil(currentPrice / TICKET_CENT_VALUE);
    const ticketsToSpend = Math.min(goal.tickets_saved, maxTicketsNeeded);
    
    expect(maxTicketsNeeded).toBe(20);
    expect(ticketsToSpend).toBe(20);
    
    // Edge case: product costs more than user has
    const expensiveGoal = createGoalWithProduct(5000, 50); // $50 product, only 50 tickets
    const expensiveMaxNeeded = Math.ceil(5000 / TICKET_CENT_VALUE);
    const expensiveToSpend = Math.min(expensiveGoal.tickets_saved, expensiveMaxNeeded);
    
    expect(expensiveMaxNeeded).toBe(200);
    expect(expensiveToSpend).toBe(50); // Can only spend what they have
  });
});