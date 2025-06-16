# Test info

- Name: Parent Child Management Flow >> parent can manage children, archive/restore, and handle bonus wheel
- Location: /Users/andykoski/Documents/IntelliTicket/tests/parent-child-flow.spec.ts:4:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

    at /Users/andykoski/Documents/IntelliTicket/tests/parent-child-flow.spec.ts:6:16
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | test.describe("Parent Child Management Flow", () => {
   4 |   test("parent can manage children, archive/restore, and handle bonus wheel", async ({ page }) => {
   5 |     // Start at login page
>  6 |     await page.goto("http://localhost:5173/login");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
   7 |
   8 |     // Login as parent
   9 |     await page.fill('input[name="username"]', "parent");
   10 |     await page.fill('input[name="password"]', "password");
   11 |     await page.click('button:has-text("Sign in")');
   12 |
   13 |     // Wait for dashboard to load
   14 |     await page.waitForURL("**/dashboard", { timeout: 10000 });
   15 |
   16 |     // Navigate to manage children
   17 |     await page.click('text=Manage Children');
   18 |     await page.waitForURL("**/manage-children");
   19 |
   20 |     // Check that children are displayed
   21 |     const childrenBeforeArchive = await page.locator('[data-testid="child-card"]').count();
   22 |     expect(childrenBeforeArchive).toBeGreaterThan(0);
   23 |
   24 |     // Archive a child (find first archive button)
   25 |     const firstChildName = await page.locator('[data-testid="child-card"] h3').first().textContent();
   26 |     await page.locator('[data-testid="child-card"]').first().locator('button:has-text("Archive")').click();
   27 |     
   28 |     // Confirm archive in dialog
   29 |     await page.click('button:has-text("Archive Child")');
   30 |
   31 |     // Verify child is no longer in active list
   32 |     await expect(page.locator(`text=${firstChildName}`)).not.toBeVisible();
   33 |
   34 |     // Show archived children
   35 |     await page.click('text=Show archived');
   36 |     
   37 |     // Verify archived child appears
   38 |     await expect(page.locator(`text=${firstChildName}`)).toBeVisible();
   39 |
   40 |     // Restore the child
   41 |     await page.locator('[data-testid="child-card"]').filter({ hasText: firstChildName }).locator('button:has-text("Restore")').click();
   42 |     
   43 |     // Hide archived to see only active
   44 |     await page.click('text=Show archived');
   45 |     
   46 |     // Verify child is back in active list
   47 |     await expect(page.locator(`text=${firstChildName}`)).toBeVisible();
   48 |
   49 |     // Test account switcher - verify archived children don't appear
   50 |     await page.click('[data-testid="account-switcher"]');
   51 |     const dropdownChildren = await page.locator('[role="menuitem"]').filter({ hasText: "child" }).count();
   52 |     
   53 |     // Should only show active children
   54 |     expect(dropdownChildren).toBeGreaterThan(0);
   55 |     
   56 |     // Close dropdown
   57 |     await page.keyboard.press("Escape");
   58 |
   59 |     // Navigate to a child's view
   60 |     await page.click('[data-testid="account-switcher"]');
   61 |     await page.locator('[role="menuitem"]').filter({ hasText: firstChildName }).click();
   62 |
   63 |     // Verify banner color is applied (check for gradient class)
   64 |     const bannerElement = await page.locator('[data-banner-container]');
   65 |     const bannerClasses = await bannerElement.getAttribute('class');
   66 |     expect(bannerClasses).toContain('bg-gradient-to-r');
   67 |
   68 |     // Complete a chore to trigger bonus
   69 |     await page.click('text=Chores');
   70 |     
   71 |     // Find a chore with bonus indicator
   72 |     const bonusChore = page.locator('[data-testid="chore-card"]').filter({ has: page.locator('[data-testid="bonus-badge"]') }).first();
   73 |     
   74 |     if (await bonusChore.isVisible()) {
   75 |       // Get the base ticket value
   76 |       const choreTickets = await bonusChore.locator('[data-testid="chore-tickets"]').textContent();
   77 |       const baseTickets = parseInt(choreTickets?.match(/\d+/)?.[0] || "0");
   78 |       
   79 |       // Complete the chore
   80 |       await bonusChore.locator('button:has-text("Complete")').click();
   81 |       
   82 |       // Should trigger bonus wheel
   83 |       await expect(page.locator('text=Bonus Wheel')).toBeVisible({ timeout: 5000 });
   84 |       
   85 |       // Spin the wheel
   86 |       await page.click('button:has-text("Spin")');
   87 |       
   88 |       // Wait for spin result
   89 |       await page.waitForTimeout(3000); // Wait for animation
   90 |       
   91 |       // Check if we got x2 multiplier
   92 |       const resultText = await page.locator('[data-testid="spin-result"]').textContent();
   93 |       if (resultText?.includes("×2")) {
   94 |         // Verify the multiplier isn't capped at 10
   95 |         const bonusTickets = baseTickets * 2;
   96 |         await expect(page.locator(`text=${bonusTickets} tickets`)).toBeVisible();
   97 |       }
   98 |     }
   99 |
  100 |     // Return to parent view
  101 |     await page.click('[data-testid="account-switcher"]');
  102 |     await page.click('text=Return to Parent View');
  103 |
  104 |     // Verify we're back as parent
  105 |     await expect(page.locator('text=Parent Dashboard')).toBeVisible();
  106 |   });
```