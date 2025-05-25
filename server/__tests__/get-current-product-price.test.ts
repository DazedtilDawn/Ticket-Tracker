import { describe, expect, test } from "bun:test";
import { getCurrentProductPrice, calculateProgressPercent } from "../lib/business-logic";
import type { Goal, Product } from "@shared/schema";

describe("getCurrentProductPrice", () => {
  test("should always return live product price", () => {
    const goal = {
      id: 1,
      user_id: 1,
      product_id: 1,
      tickets_saved: 50,
      is_active: true,
      product: {
        id: 1,
        title: "Test Product",
        asin: "B123456789",
        image_url: "https://example.com/image.jpg",
        price_cents: 2500, // Live price: $25
        price_locked_cents: 2000, // Old locked price: $20
        last_checked: new Date().toISOString(),
        camel_last_checked: null,
      },
    } as Goal & { product: Product };

    const currentPrice = getCurrentProductPrice(goal);
    expect(currentPrice).toBe(2500); // Should return live price, not locked price
  });

  test("should handle price changes affecting progress", () => {
    const goal = {
      id: 1,
      user_id: 1,
      product_id: 1,
      tickets_saved: 50, // User has 50 tickets saved (worth $12.50 at 25¢/ticket)
      is_active: true,
      product: {
        id: 1,
        title: "Test Product",
        asin: "B123456789",
        image_url: "https://example.com/image.jpg",
        price_cents: 2500, // Live price: $25
        price_locked_cents: 2000, // Old locked price: $20
        last_checked: new Date().toISOString(),
        camel_last_checked: null,
      },
    } as Goal & { product: Product };

    // With old locked price: 50 tickets * 25¢ = $12.50 / $20 = 62.5%
    const oldProgress = calculateProgressPercent(goal.tickets_saved, goal.product.price_locked_cents || 0);
    expect(oldProgress).toBe(62.5);

    // With new live price: 50 tickets * 25¢ = $12.50 / $25 = 50%
    const currentPrice = getCurrentProductPrice(goal);
    const newProgress = calculateProgressPercent(goal.tickets_saved, currentPrice);
    expect(newProgress).toBe(50);

    // Simulate price decrease
    goal.product.price_cents = 1000; // Price drops to $10
    const decreasedPrice = getCurrentProductPrice(goal);
    const increasedProgress = calculateProgressPercent(goal.tickets_saved, decreasedPrice);
    expect(increasedProgress).toBe(100); // Progress capped at 100%
  });
});