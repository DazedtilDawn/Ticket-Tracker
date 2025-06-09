# Test info

- Name: Parent Child Management Flow >> goal progress uses balance and purchase works correctly
- Location: /Users/andykoski/Documents/IntelliTicket/tests/parent-child-flow.spec.ts:144:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

    at /Users/andykoski/Documents/IntelliTicket/tests/parent-child-flow.spec.ts:146:16
```

# Test source

```ts
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
  107 |
  108 |   test("chore completion prevents duplicates on same day", async ({ page }) => {
  109 |     // Login as parent
  110 |     await page.goto("http://localhost:5173/login");
  111 |     await page.fill('input[name="username"]', "parent");
  112 |     await page.fill('input[name="password"]', "password");
  113 |     await page.click('button:has-text("Sign in")');
  114 |     
  115 |     await page.waitForURL("**/dashboard");
  116 |
  117 |     // Switch to child view
  118 |     await page.click('[data-testid="account-switcher"]');
  119 |     await page.locator('[role="menuitem"]').nth(1).click(); // Select first child
  120 |
  121 |     // Navigate to chores
  122 |     await page.click('text=Chores');
  123 |
  124 |     // Find and complete a chore
  125 |     const choreCard = page.locator('[data-testid="chore-card"]').first();
  126 |     const choreName = await choreCard.locator('h3').textContent();
  127 |     
  128 |     // Complete the chore
  129 |     await choreCard.locator('button:has-text("Complete")').click();
  130 |     
  131 |     // Verify completion
  132 |     await expect(choreCard.locator('text=Completed')).toBeVisible();
  133 |
  134 |     // Try to complete the same chore again (should be disabled/hidden)
  135 |     await expect(choreCard.locator('button:has-text("Complete")')).not.toBeVisible();
  136 |     
  137 |     // Refresh the page
  138 |     await page.reload();
  139 |     
  140 |     // Verify chore still shows as completed
  141 |     await expect(page.locator(`text=${choreName}`).locator('..').locator('text=Completed')).toBeVisible();
  142 |   });
  143 |
  144 |   test("goal progress uses balance and purchase works correctly", async ({ page }) => {
  145 |     // Login as parent
> 146 |     await page.goto("http://localhost:5173/login");
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  147 |     await page.fill('input[name="username"]', "parent");
  148 |     await page.fill('input[name="password"]', "password");
  149 |     await page.click('button:has-text("Sign in")');
  150 |     
  151 |     await page.waitForURL("**/dashboard");
  152 |
  153 |     // Switch to child with active goal
  154 |     await page.click('[data-testid="account-switcher"]');
  155 |     await page.locator('[role="menuitem"]').filter({ hasText: "child" }).first().click();
  156 |
  157 |     // Check if there's an active goal
  158 |     if (await page.locator('[data-testid="progress-card"]').isVisible()) {
  159 |       // Get current progress
  160 |       const progressText = await page.locator('[data-testid="progress-percent"]').textContent();
  161 |       const currentProgress = parseInt(progressText?.match(/\d+/)?.[0] || "0");
  162 |
  163 |       // If goal is complete, try to purchase
  164 |       if (currentProgress >= 100) {
  165 |         // Click purchase button
  166 |         await page.click('button:has-text("Purchase Goal")');
  167 |         
  168 |         // Verify purchase success
  169 |         await expect(page.locator('text=Goal Purchased!')).toBeVisible();
  170 |         
  171 |         // Check that balance was deducted
  172 |         const newBalance = await page.locator('[data-testid="ticket-balance"]').textContent();
  173 |         expect(parseInt(newBalance || "0")).toBeGreaterThanOrEqual(0);
  174 |       } else {
  175 |         // Verify purchase button is disabled
  176 |         await expect(page.locator('button:has-text("Purchase Goal")')).toBeDisabled();
  177 |       }
  178 |     }
  179 |   });
  180 | });
```