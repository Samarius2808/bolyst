import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { type Page } from "@playwright/test";

export async function signIn(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/sign-in");

  // Fill Clerk sign-in form
  await page.getByLabel(/email/i).fill("name@example.com");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByLabel(/password/i).fill("playwrighttest1234");
  await page.getByRole("button", { name: /continue/i }).click();

  // Wait for redirect to boards page
  await page.waitForURL("**/boards", { timeout: 15_000 });
}
