import { type Page } from "@playwright/test";

const E2E_PREFIX = "[E2E]";

/**
 * Delete all boards created by E2E tests (those with the [E2E] prefix).
 * Navigates to /boards, finds test boards, and deletes them via the settings modal.
 */
export async function cleanupTestBoards(page: Page) {
  await page.goto("/boards");
  await page.waitForURL("**/boards", { timeout: 10_000 });

  // Find all board links with the E2E prefix
  const testBoardLinks = page.locator(`a:has-text("${E2E_PREFIX}")`);
  const count = await testBoardLinks.count();

  for (let i = 0; i < count; i++) {
    // Re-navigate each time since deleting a board changes the page
    await page.goto("/boards");
    await page.waitForURL("**/boards", { timeout: 10_000 });

    const link = page.locator(`a:has-text("${E2E_PREFIX}")`).first();
    if ((await link.count()) === 0) break;

    await link.click();
    await page.waitForURL(/\/boards\/.+/, { timeout: 10_000 });

    // Open settings
    await page.getByRole("button", { name: /settings/i }).click();

    // Accept the native confirm dialog when it appears
    page.once("dialog", (dialog) => dialog.accept());

    // Click delete board (triggers window.confirm)
    await page.getByRole("button", { name: /delete this board/i }).click();

    // Wait for redirect back to boards
    await page.waitForURL("**/boards", { timeout: 10_000 });
  }
}

export { E2E_PREFIX };
