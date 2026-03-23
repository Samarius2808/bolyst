import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { type Page } from "@playwright/test";

export async function signIn(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/sign-in");

  // Fill Clerk sign-in form
  await page.getByLabel(/email/i).fill("tester01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Password" }).fill("playwrighttest1234");
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Wait for sign-in to complete — may redirect to / or /boards
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 15_000 });

  // Navigate to boards if not already there
  if (!page.url().includes("/boards")) {
    await page.goto("/boards");
    await page.waitForURL("**/boards", { timeout: 10_000 });
  }
}
