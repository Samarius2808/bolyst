import { test, expect } from "@playwright/test";
import { signIn } from "./helpers/auth";
import { cleanupTestBoards, E2E_PREFIX } from "./helpers/cleanup";

const BOARD_NAME = `${E2E_PREFIX} Test Board ${Date.now()}`;
let boardUrl: string;

test.describe.serial("Critical path", () => {
  test("1. Sign in → lands on /boards", async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/boards/);
    // Should see the greeting
    await expect(page.locator("text=Hi,")).toBeVisible();
  });

  test("2. Create board → appears in list", async ({ page }) => {
    await signIn(page);

    // Click create board button (works for both empty and non-empty states)
    const newBoardBtn = page.getByRole("button", { name: /new board|create board/i });
    await newBoardBtn.click();

    // Fill board name
    await page.getByPlaceholder(/e\.g\. Berlin/i).fill(BOARD_NAME);

    // Submit
    await page.getByRole("button", { name: /^create board$/i }).click();

    // Should redirect to the new board page
    await page.waitForURL(/\/boards\/.+/, { timeout: 10_000 });
    boardUrl = page.url();

    // Board name should be visible
    await expect(page.locator(`text=${BOARD_NAME}`)).toBeVisible();
  });

  test("3. Add listing manually → card appears", async ({ page }) => {
    await signIn(page);
    await page.goto(boardUrl);

    // Click add listing
    await page.getByRole("button", { name: /add listing/i }).click();

    // Switch to manual entry
    await page.getByRole("button", { name: /manual entry/i }).click();

    // Fill listing details
    await page.getByPlaceholder("Title *").fill(`${E2E_PREFIX} Test Apartment`);
    await page.getByPlaceholder(/price/i).fill("1500");
    await page.getByPlaceholder(/size/i).fill("65");
    await page.getByPlaceholder(/location/i).fill("Berlin Mitte");

    // Submit
    await page.getByRole("button", { name: /^add listing$/i }).click();

    // Wait for modal to close and card to appear
    await expect(page.locator(`text=${E2E_PREFIX} Test Apartment`)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("4. Tag a listing → tag visible", async ({ page }) => {
    await signIn(page);
    await page.goto(boardUrl);

    // Click on the listing card to open detail
    await page.locator(`text=${E2E_PREFIX} Test Apartment`).click();

    // Wait for detail modal to open
    await expect(page.getByPlaceholder(/new tag/i)).toBeVisible({ timeout: 5_000 });

    // Create a new tag
    await page.getByPlaceholder(/new tag/i).fill("great-location");
    await page.getByRole("button", { name: /^add$/i }).click();

    // Tag should appear as a pill/badge
    await expect(page.locator("text=great-location")).toBeVisible();

    // Close the detail modal
    await page.keyboard.press("Escape");
  });

  test("5. Comment on listing → comment appears", async ({ page }) => {
    await signIn(page);
    await page.goto(boardUrl);

    // Open listing detail
    await page.locator(`text=${E2E_PREFIX} Test Apartment`).click();

    // Wait for comment input
    await expect(page.getByPlaceholder(/add a comment/i)).toBeVisible({ timeout: 5_000 });

    // Type and submit a comment
    await page.getByPlaceholder(/add a comment/i).fill("Great location, close to U-Bahn!");
    // Submit via the send button (last button in the comment form)
    await page.getByPlaceholder(/add a comment/i).press("Enter");

    // Comment should appear
    await expect(page.locator("text=Great location, close to U-Bahn!")).toBeVisible({
      timeout: 5_000,
    });

    // Close modal
    await page.keyboard.press("Escape");
  });

  test("6. Compare view → selected listings display", async ({ page }) => {
    await signIn(page);
    await page.goto(boardUrl);

    // First, add a second listing so we can compare
    await page.getByRole("button", { name: /add listing/i }).click();
    await page.getByRole("button", { name: /manual entry/i }).click();
    await page.getByPlaceholder("Title *").fill(`${E2E_PREFIX} Second Apartment`);
    await page.getByPlaceholder(/price/i).fill("1200");
    await page.getByPlaceholder(/size/i).fill("50");
    await page.getByPlaceholder(/location/i).fill("Berlin Kreuzberg");
    await page.getByRole("button", { name: /^add listing$/i }).click();
    await expect(page.locator(`text=${E2E_PREFIX} Second Apartment`)).toBeVisible({
      timeout: 10_000,
    });

    // Enable compare mode
    await page.getByRole("button", { name: /compare/i }).click();

    // Select both listings (click the checkboxes/selectors on the cards)
    const cards = page.locator('[data-testid="listing-card"], .group\\/card');
    const cardCount = await cards.count();
    // Click each card's select area (the checkbox overlay in compare mode)
    for (let i = 0; i < Math.min(cardCount, 2); i++) {
      await cards.nth(i).click();
    }

    // Click the compare button in the floating bar
    await page
      .getByRole("button", { name: /compare.*→|compare/i })
      .last()
      .click();

    // Should navigate to compare page
    await expect(page).toHaveURL(/\/compare/, { timeout: 5_000 });

    // Both listings should be visible in the comparison
    await expect(page.locator(`text=${E2E_PREFIX} Test Apartment`)).toBeVisible();
    await expect(page.locator(`text=${E2E_PREFIX} Second Apartment`)).toBeVisible();
  });

  test("7. Invite collaborator → UI confirms invite", async ({ page }) => {
    await signIn(page);
    await page.goto(boardUrl);

    // Open board settings
    await page.getByRole("button", { name: /settings/i }).click();

    // Wait for settings modal
    await expect(page.getByPlaceholder(/invite by email/i)).toBeVisible({ timeout: 5_000 });

    // Type an email to invite
    await page.getByPlaceholder(/invite by email/i).fill("collaborator@example.com");
    await page.getByRole("button", { name: /^invite$/i }).click();

    // Should show the invited email in pending section or member list
    await expect(page.locator("text=collaborator@example.com")).toBeVisible({ timeout: 5_000 });

    // Close settings
    await page.keyboard.press("Escape");
  });

  // Cleanup: delete test boards after all tests
  test("cleanup: delete test boards", async ({ page }) => {
    await signIn(page);
    await cleanupTestBoards(page);
  });
});
