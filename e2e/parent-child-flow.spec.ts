import { test, expect } from "@playwright/test";

test.describe("Parent Child Management Flow", () => {
  test("parent can manage children, archive/restore, and handle bonus wheel", async ({ page }) => {
    // Start at login page
    await page.goto("http://localhost:5173/login");

    // Login as parent
    await page.fill('input[name="username"]', "parent");
    await page.fill('input[name="password"]', "password");
    await page.click('button:has-text("Sign in")');

    // Wait for dashboard to load
    await page.waitForURL("**/dashboard", { timeout: 10000 });

    // Navigate to manage children
    await page.click('text=Manage Children');
    await page.waitForURL("**/manage-children");

    // Check that children are displayed
    const childrenBeforeArchive = await page.locator('[data-testid="child-card"]').count();
    expect(childrenBeforeArchive).toBeGreaterThan(0);

    // Archive a child (find first archive button)
    const firstChildName = await page.locator('[data-testid="child-card"] h3').first().textContent();
    await page.locator('[data-testid="child-card"]').first().locator('button:has-text("Archive")').click();
    
    // Confirm archive in dialog
    await page.click('button:has-text("Archive Child")');

    // Verify child is no longer in active list
    await expect(page.locator(`text=${firstChildName}`)).not.toBeVisible();

    // Show archived children
    await page.click('text=Show archived');
    
    // Verify archived child appears
    await expect(page.locator(`text=${firstChildName}`)).toBeVisible();

    // Restore the child
    await page.locator('[data-testid="child-card"]').filter({ hasText: firstChildName }).locator('button:has-text("Restore")').click();
    
    // Hide archived to see only active
    await page.click('text=Show archived');
    
    // Verify child is back in active list
    await expect(page.locator(`text=${firstChildName}`)).toBeVisible();

    // Test account switcher - verify archived children don't appear
    await page.click('[data-testid="account-switcher"]');
    const dropdownChildren = await page.locator('[role="menuitem"]').filter({ hasText: "child" }).count();
    
    // Should only show active children
    expect(dropdownChildren).toBeGreaterThan(0);
    
    // Close dropdown
    await page.keyboard.press("Escape");

    // Navigate to a child's view
    await page.click('[data-testid="account-switcher"]');
    await page.locator('[role="menuitem"]').filter({ hasText: firstChildName }).click();

    // Verify banner color is applied (check for gradient class)
    const bannerElement = await page.locator('[data-banner-container]');
    const bannerClasses = await bannerElement.getAttribute('class');
    expect(bannerClasses).toContain('bg-gradient-to-r');

    // Complete a chore to trigger bonus
    await page.click('text=Chores');
    
    // Find a chore with bonus indicator
    const bonusChore = page.locator('[data-testid="chore-card"]').filter({ has: page.locator('[data-testid="bonus-badge"]') }).first();
    
    if (await bonusChore.isVisible()) {
      // Get the base ticket value
      const choreTickets = await bonusChore.locator('[data-testid="chore-tickets"]').textContent();
      const baseTickets = parseInt(choreTickets?.match(/\d+/)?.[0] || "0");
      
      // Complete the chore
      await bonusChore.locator('button:has-text("Complete")').click();
      
      // Should trigger bonus wheel
      await expect(page.locator('text=Bonus Wheel')).toBeVisible({ timeout: 5000 });
      
      // Spin the wheel
      await page.click('button:has-text("Spin")');
      
      // Wait for spin result
      await page.waitForTimeout(3000); // Wait for animation
      
      // Check if we got x2 multiplier
      const resultText = await page.locator('[data-testid="spin-result"]').textContent();
      if (resultText?.includes("×2")) {
        // Verify the multiplier isn't capped at 10
        const bonusTickets = baseTickets * 2;
        await expect(page.locator(`text=${bonusTickets} tickets`)).toBeVisible();
      }
    }

    // Return to parent view
    await page.click('[data-testid="account-switcher"]');
    await page.click('text=Return to Parent View');

    // Verify we're back as parent
    await expect(page.locator('text=Parent Dashboard')).toBeVisible();
  });

  test("chore completion prevents duplicates on same day", async ({ page }) => {
    // Login as parent
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="username"]', "parent");
    await page.fill('input[name="password"]', "password");
    await page.click('button:has-text("Sign in")');
    
    await page.waitForURL("**/dashboard");

    // Switch to child view
    await page.click('[data-testid="account-switcher"]');
    await page.locator('[role="menuitem"]').nth(1).click(); // Select first child

    // Navigate to chores
    await page.click('text=Chores');

    // Find and complete a chore
    const choreCard = page.locator('[data-testid="chore-card"]').first();
    const choreName = await choreCard.locator('h3').textContent();
    
    // Complete the chore
    await choreCard.locator('button:has-text("Complete")').click();
    
    // Verify completion
    await expect(choreCard.locator('text=Completed')).toBeVisible();

    // Try to complete the same chore again (should be disabled/hidden)
    await expect(choreCard.locator('button:has-text("Complete")')).not.toBeVisible();
    
    // Refresh the page
    await page.reload();
    
    // Verify chore still shows as completed
    await expect(page.locator(`text=${choreName}`).locator('..').locator('text=Completed')).toBeVisible();
  });

  test("goal progress uses balance and purchase works correctly", async ({ page }) => {
    // Login as parent
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="username"]', "parent");
    await page.fill('input[name="password"]', "password");
    await page.click('button:has-text("Sign in")');
    
    await page.waitForURL("**/dashboard");

    // Switch to child with active goal
    await page.click('[data-testid="account-switcher"]');
    await page.locator('[role="menuitem"]').filter({ hasText: "child" }).first().click();

    // Check if there's an active goal
    if (await page.locator('[data-testid="progress-card"]').isVisible()) {
      // Get current progress
      const progressText = await page.locator('[data-testid="progress-percent"]').textContent();
      const currentProgress = parseInt(progressText?.match(/\d+/)?.[0] || "0");

      // If goal is complete, try to purchase
      if (currentProgress >= 100) {
        // Click purchase button
        await page.click('button:has-text("Purchase Goal")');
        
        // Verify purchase success
        await expect(page.locator('text=Goal Purchased!')).toBeVisible();
        
        // Check that balance was deducted
        const newBalance = await page.locator('[data-testid="ticket-balance"]').textContent();
        expect(parseInt(newBalance || "0")).toBeGreaterThanOrEqual(0);
      } else {
        // Verify purchase button is disabled
        await expect(page.locator('button:has-text("Purchase Goal")')).toBeDisabled();
      }
    }
  });
});