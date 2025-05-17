import { test, expect } from "bun:test";
import { calculateTier } from "../lib/business-logic";

test("fewer than 3 chores maps tickets to tiers", () => {
  const chores = [
    { tickets: 2, is_active: true },
    { tickets: 7, is_active: true }
  ] as any;

  expect(calculateTier(3, chores)).toBe("common");
  expect(calculateTier(7, chores)).toBe("rare");
  expect(calculateTier(11, chores)).toBe("epic");
});

test("larger set categorizes relative to median", () => {
  const chores = [
    { tickets: 2, is_active: true },
    { tickets: 4, is_active: true },
    { tickets: 6, is_active: true },
    { tickets: 8, is_active: true },
    { tickets: 10, is_active: true },
  ] as any;

  expect(calculateTier(2, chores)).toBe("common");
  expect(calculateTier(6, chores)).toBe("rare");
  expect(calculateTier(10, chores)).toBe("epic");
});
