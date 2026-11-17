import { randomBytes } from "crypto";

/** Unguessable token for a board's shareable join link (~144 bits). */
export function generateInviteToken(): string {
  return randomBytes(18).toString("base64url");
}

/** Cheap shape check before touching the database. */
export function isPlausibleInviteToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(token);
}

/**
 * The redirect target after sign-in/up when it's an invite link. Only same-site
 * /join/… paths are honoured, and they win over the default "/boards" redirect
 * so someone signing up from an invite lands back on it.
 */
export function joinRedirect(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  let path: string;
  try {
    // Clerk may pass an absolute URL. Only the path is kept, so this can never
    // redirect off-site.
    path = new URL(v, "https://bolyst.invalid").pathname;
  } catch {
    return undefined;
  }
  return /^\/join\/[A-Za-z0-9_-]{16,64}$/.test(path) ? path : undefined;
}
