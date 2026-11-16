const MAX_IMAGES = 40;

/** Returns a clean list of http(s) image URLs, or null if the input is invalid. */
export function parseImageUrls(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_IMAGES) return null;
  const urls: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    try {
      const u = new URL(item);
      if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    } catch {
      return null;
    }
    urls.push(item);
  }
  return urls;
}
