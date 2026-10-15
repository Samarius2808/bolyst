import { clerk } from "@clerk/testing/playwright";
import { type Page } from "@playwright/test";

/** E2E user (`tester01`) in the Clerk dev instance; CI and .env.local carry that instance's keys. */
const E2E_USER_EMAIL = "name@example.com";

/**
 * Signs the E2E user in with a sign-in token ("ticket") instead of the password form.
 *
 * Clerk's Device Trust protection treats every fresh browser context as a new
 * device and demands an emailed verification code after a password sign-in,
 * which a test cannot complete. Ticket sign-ins are exempt from it. The helper
 * looks the user up by email with CLERK_SECRET_KEY, mints a short-lived token
 * via the Backend API and activates the session inside the page.
 */
export async function signIn(page: Page) {
  // The helper needs a public page that has loaded Clerk; /sign-in is one.
  await page.goto("/sign-in");
  await clerk.signIn({ page, emailAddress: E2E_USER_EMAIL });

  await page.goto("/boards");
  await page.waitForURL("**/boards", { timeout: 10_000 });
}
