import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

test.skip("product image is visible in progress card", async ({ page }) => {
  await page.goto("/");
  const img = page.locator('[data-testid="goal-image"]');
  await expect(img).toBeVisible({ timeout: 5000 });
});
