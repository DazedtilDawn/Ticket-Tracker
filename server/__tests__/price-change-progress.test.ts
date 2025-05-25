import { describe, expect, test } from "bun:test";
import { calculateProgressPercent, getCurrentProductPrice, calculateBoostPercent } from "../lib/business-logic";
import type { Goal, Product } from "@shared/schema";

describe("Price changes affecting goal progress", () => {
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

  test("price increase should lower progress percentage", () => {
    // User has 50 tickets saved (worth $12.50)
    const goalBefore = createGoalWithProduct(2000, 50); // $20 product
    const progressBefore = calculateProgressPercent(
      goalBefore.tickets_saved,
      getCurrentProductPrice(goalBefore)
    );
    expect(progressBefore).toBe(62.5); // $12.50 / $20 = 62.5%

    // Price increases to $25
    const goalAfter = createGoalWithProduct(2500, 50);
    const progressAfter = calculateProgressPercent(
      goalAfter.tickets_saved,
      getCurrentProductPrice(goalAfter)
    );
    expect(progressAfter).toBe(50); // $12.50 / $25 = 50%
  });

  test("price decrease should increase progress percentage", () => {
    // User has 50 tickets saved (worth $12.50)
    const goalBefore = createGoalWithProduct(2000, 50); // $20 product
    const progressBefore = calculateProgressPercent(
      goalBefore.tickets_saved,
      getCurrentProductPrice(goalBefore)
    );
    expect(progressBefore).toBe(62.5); // $12.50 / $20 = 62.5%

    // Price decreases to $10
    const goalAfter = createGoalWithProduct(1000, 50);
    const progressAfter = calculateProgressPercent(
      goalAfter.tickets_saved,
      getCurrentProductPrice(goalAfter)
    );
    expect(progressAfter).toBe(100); // $12.50 / $10 = 125%, capped at 100%
  });

  test("price change should affect chore boost percentage", () => {
    const choreTickets = 10; // Chore gives 10 tickets

    // With $20 product
    const boost20 = calculateBoostPercent(choreTickets, 2000);
    expect(boost20).toBe(12.5); // 10 tickets * $0.25 = $2.50 / $20 = 12.5%

    // With $25 product (price increase)
    const boost25 = calculateBoostPercent(choreTickets, 2500);
    expect(boost25).toBe(10); // 10 tickets * $0.25 = $2.50 / $25 = 10%

    // With $10 product (price decrease)
    const boost10 = calculateBoostPercent(choreTickets, 1000);
    expect(boost10).toBe(25); // 10 tickets * $0.25 = $2.50 / $10 = 25%
  });

  test("getCurrentProductPrice always returns live price", () => {
    // Create goal with different price scenarios
    const goal = createGoalWithProduct(3000, 75);
    
    // Should always return the current price_cents from product
    expect(getCurrentProductPrice(goal)).toBe(3000);
    
    // Update the product price
    goal.product.price_cents = 3500;
    expect(getCurrentProductPrice(goal)).toBe(3500);
  });

  test("edge case: zero price should return 0% progress", () => {
    const goal = createGoalWithProduct(0, 50);
    const progress = calculateProgressPercent(
      goal.tickets_saved,
      getCurrentProductPrice(goal)
    );
    expect(progress).toBe(0);
  });

  test("edge case: very small price changes", () => {
    // User has 1 ticket ($0.25)
    const goal25Cents = createGoalWithProduct(25, 1);
    const progress25 = calculateProgressPercent(
      goal25Cents.tickets_saved,
      getCurrentProductPrice(goal25Cents)
    );
    expect(progress25).toBe(100); // $0.25 / $0.25 = 100%

    // Price increases to $0.26
    const goal26Cents = createGoalWithProduct(26, 1);
    const progress26 = calculateProgressPercent(
      goal26Cents.tickets_saved,
      getCurrentProductPrice(goal26Cents)
    );
    expect(progress26).toBe(96.2); // $0.25 / $0.26 = 96.15%, rounded to 96.2%
  });
});