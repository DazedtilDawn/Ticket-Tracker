import { describe, expect, test } from "bun:test";
import { calculateGoalProgressFromBalance, calculateOverSavedTickets } from "../lib/business-logic";
import { TICKET_CENT_VALUE } from "../../config/business";

describe("Balance-based goal progress", () => {
  test("progress should be calculated from balance, not stored tickets_saved", () => {
    // User has balance of 50 tickets ($12.50)
    const balance = 50;
    
    // Goal is for a $25 product
    const productPriceCents = 2500;
    
    const progress = calculateGoalProgressFromBalance(balance, productPriceCents);
    expect(progress).toBe(50); // $12.50 / $25 = 50%
  });

  test("earning tickets should increase progress", () => {
    // Start with balance of 20 tickets
    let balance = 20;
    const productPriceCents = 2000; // $20 product
    
    let progress = calculateGoalProgressFromBalance(balance, productPriceCents);
    expect(progress).toBe(25); // $5 / $20 = 25%
    
    // Earn 30 more tickets
    balance += 30;
    progress = calculateGoalProgressFromBalance(balance, productPriceCents);
    expect(progress).toBe(62.5); // $12.50 / $20 = 62.5%
    
    // Earn 30 more tickets (total 80)
    balance += 30;
    progress = calculateGoalProgressFromBalance(balance, productPriceCents);
    expect(progress).toBe(100); // $20 / $20 = 100%
  });

  test("spending tickets should decrease progress", () => {
    // Start with balance of 100 tickets
    let balance = 100;
    const productPriceCents = 2500; // $25 product
    
    let progress = calculateGoalProgressFromBalance(balance, productPriceCents);
    expect(progress).toBe(100); // $25 / $25 = 100%
    
    // Spend 20 tickets on something else
    balance -= 20;
    progress = calculateGoalProgressFromBalance(balance, productPriceCents);
    expect(progress).toBe(80); // $20 / $25 = 80%
    
    // Spend 40 more tickets
    balance -= 40;
    progress = calculateGoalProgressFromBalance(balance, productPriceCents);
    expect(progress).toBe(40); // $10 / $25 = 40%
  });

  test("switching goals should show correct progress for each", () => {
    const balance = 60; // User has 60 tickets ($15)
    
    // Goal A: $10 product
    const goalA_price = 1000;
    const progressA = calculateGoalProgressFromBalance(balance, goalA_price);
    expect(progressA).toBe(100); // $15 / $10 = 150%, capped at 100%
    expect(calculateOverSavedTickets(balance, goalA_price)).toBe(20); // 60 - 40 = 20 extra
    
    // Goal B: $30 product
    const goalB_price = 3000;
    const progressB = calculateGoalProgressFromBalance(balance, goalB_price);
    expect(progressB).toBe(50); // $15 / $30 = 50%
    expect(calculateOverSavedTickets(balance, goalB_price)).toBe(0); // No over-save
    
    // Goal C: $15 product (exact match)
    const goalC_price = 1500;
    const progressC = calculateGoalProgressFromBalance(balance, goalC_price);
    expect(progressC).toBe(100); // $15 / $15 = 100%
    expect(calculateOverSavedTickets(balance, goalC_price)).toBe(0); // Exact match
  });

  test("multiple users with same balance should have independent progress", () => {
    const user1Balance = 40;
    const user2Balance = 40;
    
    // User 1 has goal for $20 product
    const user1GoalPrice = 2000;
    const user1Progress = calculateGoalProgressFromBalance(user1Balance, user1GoalPrice);
    expect(user1Progress).toBe(50); // $10 / $20 = 50%
    
    // User 2 has goal for $10 product
    const user2GoalPrice = 1000;
    const user2Progress = calculateGoalProgressFromBalance(user2Balance, user2GoalPrice);
    expect(user2Progress).toBe(100); // $10 / $10 = 100%
  });

  test("progress should update immediately when balance changes", () => {
    let balance = 0;
    const productPriceCents = 1000; // $10 product
    
    // Start with no balance
    expect(calculateGoalProgressFromBalance(balance, productPriceCents)).toBe(0);
    
    // Complete a 5-ticket chore
    balance += 5;
    expect(calculateGoalProgressFromBalance(balance, productPriceCents)).toBe(12.5);
    
    // Complete a 10-ticket chore
    balance += 10;
    expect(calculateGoalProgressFromBalance(balance, productPriceCents)).toBe(37.5);
    
    // Complete a 15-ticket chore
    balance += 15;
    expect(calculateGoalProgressFromBalance(balance, productPriceCents)).toBe(75);
    
    // Complete a 10-ticket chore (reach goal)
    balance += 10;
    expect(calculateGoalProgressFromBalance(balance, productPriceCents)).toBe(100);
  });

  test("spending from goal should only affect balance", () => {
    let balance = 100; // Start with 100 tickets
    const productPriceCents = 2000; // $20 product
    
    // Initially at 100% progress with over-save
    expect(calculateGoalProgressFromBalance(balance, productPriceCents)).toBe(100);
    expect(calculateOverSavedTickets(balance, productPriceCents)).toBe(20);
    
    // Spend exactly what's needed for the goal (80 tickets)
    const ticketsNeeded = Math.ceil(productPriceCents / TICKET_CENT_VALUE);
    balance -= ticketsNeeded;
    
    // Should have 20 tickets left
    expect(balance).toBe(20);
    expect(calculateGoalProgressFromBalance(balance, productPriceCents)).toBe(25);
    expect(calculateOverSavedTickets(balance, productPriceCents)).toBe(0);
  });

  test("zero price product should handle gracefully", () => {
    const balance = 50;
    const zeroPriceProduct = 0;
    
    expect(calculateGoalProgressFromBalance(balance, zeroPriceProduct)).toBe(0);
    expect(calculateOverSavedTickets(balance, zeroPriceProduct)).toBe(50);
  });

  test("negative balance should be handled safely", () => {
    const negativeBalance = -10;
    const productPriceCents = 1000;
    
    // Should treat negative as 0
    expect(calculateGoalProgressFromBalance(negativeBalance, productPriceCents)).toBe(0);
    expect(calculateOverSavedTickets(negativeBalance, productPriceCents)).toBe(0);
  });
});