export interface ScrapedListing {
  title: string | null;
  price: number | null;
  size: number | null;
  location: string | null;
  description: string | null;
  imageUrls: string[];
  sourceUrl: string;
}

export async function scrapeListing(url: string): Promise<ScrapedListing> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Bolyst/1.0; +https://bolyst.app)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status}`);
  }

  const html = await res.text();

  return {
    title: extractTitle(html),
    price: extractPrice(html),
    size: extractSize(html),
    location: extractLocation(html),
    description: extractDescription(html),
    imageUrls: extractImages(html, url),
    sourceUrl: url,
  };
}

function getMeta(html: string, property: string): string | null {
  // Match both property="..." and name="..." variants
  const pattern = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']` +
      `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i"
  );
  const match = html.match(pattern);
  return match ? (match[1] || match[2] || null) : null;
}

function extractTitle(html: string): string | null {
  // Try OG title first, then <title> tag
  const og = getMeta(html, "og:title");
  if (og) return og.trim();

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function extractPrice(html: string): number | null {
  // Look for price in structured data or common patterns
  // Matches: €1,200, 1200€, €1.200, 1 200 kr, $1,200, etc.
  const pricePatterns = [
    /(?:price|pris|rent|miete|loyer|prix)[^€$£\d]{0,30}[€$£]\s?([\d\s.,]+)/i,
    /[€$£]\s?([\d\s.,]+)\s*(?:\/\s*(?:mo|month|mnd|måned|monat|mois))?/i,
    /([\d\s.,]+)\s*[€$£]\s*(?:\/\s*(?:mo|month|mnd|måned|monat|mois))?/i,
    /(?:price|pris|rent|miete|loyer|prix)[^0-9]{0,30}([\d\s.,]+)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/[\s.]/g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      if (num > 50 && num < 100000) return Math.round(num);
    }
  }

  return null;
}

function extractSize(html: string): number | null {
  // Match: 65 m², 65m2, 65 kvm, 65 sq m, 65 sqm
  const sizePatterns = [
    /([\d.,]+)\s*(?:m²|m2|kvm|sq\.?\s*m|sqm)/i,
    /(?:size|størrelse|areal|fläche|superficie|area)[^0-9]{0,20}([\d.,]+)\s*(?:m|sq)/i,
  ];

  for (const pattern of sizePatterns) {
    const match = html.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(",", "."));
      if (num > 5 && num < 10000) return num;
    }
  }

  return null;
}

function extractLocation(html: string): string | null {
  // Try structured data meta tags
  const ogLocality = getMeta(html, "og:locality");
  if (ogLocality) return ogLocality.trim();

  const ogRegion = getMeta(html, "og:region");
  if (ogRegion) return ogRegion.trim();

  // Try address patterns
  const addressPatterns = [
    /(?:address|adresse|adress|indirizzo)[^>]{0,5}>\s*([^<]{5,80})/i,
    /"address"[^"]*"([^"]{5,80})"/i,
    /"streetAddress"[^"]*"([^"]{5,80})"/i,
  ];

  for (const pattern of addressPatterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractDescription(html: string): string | null {
  const og = getMeta(html, "og:description");
  if (og) return og.trim().slice(0, 500);

  const meta = getMeta(html, "description");
  if (meta) return meta.trim().slice(0, 500);

  return null;
}

// URL path patterns that indicate a people/UI photo rather than a property photo
const PEOPLE_PATH = /\/(agent|broker|staff|team|person|profile|user|member|support|headshot|portrait|employee|realtor|consultant|advisor|contact|about)s?\//i;

// Generic noise patterns that are never property images
const NOISE_URL = /logo|icon|avatar|badge|button|sprite|pixel|track|1x1|placeholder|banner|favicon/i;

function isPropertyImage(url: string): boolean {
  if (PEOPLE_PATH.test(url)) return false;
  if (NOISE_URL.test(url)) return false;
  if (/\.(svg|gif|ico)(\?|$)/i.test(url)) return false;
  if (url.startsWith("data:")) return false;
  return true;
}

// Returns the exact hostname for affinity checks (e.g. "listingimages.wunderflats.com")
function imageHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function normalizeImageUrl(url: string): string {
  try {
    const u = new URL(url);
    // Extract filename stem for dedup — catches same image at different sizes/formats
    const filename = u.pathname.split("/").pop() || u.pathname;
    // Strip extension
    let stem = filename.replace(/\.[^.]+$/, "");
    // Strip common image format/size suffixes:
    //   wunderflats: {id}-original, {id}-large, {id}-og, {id}-thumbnail, etc.
    //   generic: {name}-800x600, {name}_large, {name}@2x, {name}-w1280, etc.
    stem = stem.replace(/-(?:original|large|medium|small|thumbnail|og|xl|xxl|tiny|micro|preview|full|main|hero|cover|featured|banner|w\d+|h\d+|\d+x\d+)$/i, "");
    stem = stem.replace(/_(?:large|medium|small|thumbnail|original)$/i, "");
    stem = stem.replace(/@\d+x$/i, "");
    return u.hostname + "/" + stem;
  } catch {
    return url;
  }
}

// Recursively walk a parsed JSON structure to find image URLs from a specific CDN host
function findCdnUrls(
  obj: unknown,
  host: string,
  add: (src: string) => void,
  depth = 0
): void {
  if (depth > 12) return; // prevent runaway recursion on deep structures
  if (typeof obj === "string") {
    if (obj.includes(host) && obj.startsWith("http")) {
      add(obj.split("?")[0]);
    }
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) findCdnUrls(item, host, add, depth + 1);
    return;
  }
  if (obj && typeof obj === "object") {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      findCdnUrls(val, host, add, depth + 1);
    }
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  function add(src: string) {
    const resolved = resolveUrl(src, baseUrl);
    if (!isPropertyImage(resolved)) return;
    const key = normalizeImageUrl(resolved);
    if (!seen.has(key)) {
      seen.add(key);
      images.push(resolved);
    }
  }

  // 1. OG images — curated by the site, almost always the main property photos
  const ogPattern =
    /<meta[^>]*(?:property=["']og:image["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*property=["']og:image["'])/gi;
  let match;
  while ((match = ogPattern.exec(html)) !== null) {
    const src = match[1] || match[2];
    if (src) add(src);
  }

  // 2. JSON-LD structured data images
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const ldImages = data.image || data.photo || data.photos;
      if (typeof ldImages === "string") add(ldImages);
      if (Array.isArray(ldImages)) {
        for (const img of ldImages) {
          if (typeof img === "string") add(img);
          else if (img?.url) add(img.url);
          else if (img?.contentUrl) add(img.contentUrl);
        }
      }
    } catch {
      // invalid JSON-LD, skip
    }
  }

  // If OG/JSON-LD gave us 5 images already, stop — don't risk pulling in non-property photos
  if (images.length >= 5) return images.slice(0, 5);

  // For <img> and inline scanning, only accept images from the same host as the
  // first image we found (hostname affinity). Support/team photos often come from
  // the main site domain while property photos come from a dedicated image CDN
  // (e.g. listingimages.wunderflats.com vs wunderflats.com).
  const primaryHost = images.length > 0 ? imageHostname(images[0]) : null;

  function isAffinityMatch(src: string): boolean {
    if (!primaryHost) return true; // no anchor yet, accept anything
    const h = imageHostname(src);
    return h === primaryHost;
  }

  // 3. <img> tags — lazy-load attributes and srcset
  const imgTagPattern = /<img[^>]*>/gi;
  while ((match = imgTagPattern.exec(html)) !== null && images.length < 10) {
    const tag = match[0];

    // Skip tiny images
    if (/width=["']?\d{1,2}['" ]/i.test(tag) || /height=["']?\d{1,2}['" ]/i.test(tag)) continue;

    const srcAttrs = ["data-src", "data-lazy-src", "data-original", "src"];
    for (const attr of srcAttrs) {
      const attrMatch = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
      if (attrMatch) {
        const src = attrMatch[1];
        if (!isPropertyImage(src) || !isAffinityMatch(resolveUrl(src, baseUrl))) break;
        add(src);
        break;
      }
    }

    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    if (srcsetMatch && images.length < 10) {
      const entries = srcsetMatch[1].split(",").map((s) => s.trim().split(/\s+/)[0]);
      const best = entries[entries.length - 1];
      if (best && isPropertyImage(best) && isAffinityMatch(resolveUrl(best, baseUrl))) {
        add(best);
      }
    }
  }

  // 4. Inline image URLs in JS/JSON — standard extension-based scan
  const inlineUrlPattern = /"(https?:\/\/[^"<\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"<\s]*)?)"/gi;
  while ((match = inlineUrlPattern.exec(html)) !== null && images.length < 10) {
    const src = match[1].split("?")[0]; // strip query string before checking/storing
    if (
      !isPropertyImage(src) ||
      !isAffinityMatch(src) ||
      /(?:_|\/)(?:thumb|tiny|micro|pt_\d+_\d+|smw_\d+|fspt_)\//i.test(src)
    ) continue;
    add(src);
  }

  // 5. Parse embedded JSON data blocks (__NEXT_DATA__, application/json scripts)
  //    for image CDN URLs. JSON.parse handles escaped slashes (\/) correctly, and
  //    catches extensionless URLs that regex-based scanning misses.
  if (images.length < 5 && primaryHost) {
    const jsonScriptPattern = /<script[^>]*(?:id=["']__NEXT_DATA__["']|type=["']application\/json["'])[^>]*>([\s\S]*?)<\/script>/gi;
    let jsonMatch;
    while ((jsonMatch = jsonScriptPattern.exec(html)) !== null && images.length < 10) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        findCdnUrls(data, primaryHost, add);
      } catch {
        // invalid JSON, skip
      }
    }
  }

  // 6. Fallback: regex scan for CDN URLs (handles pages without JSON data blocks)
  if (images.length < 5 && primaryHost && primaryHost !== imageHostname(baseUrl)) {
    const escapedHost = primaryHost.replace(/\./g, "\\.");
    // Match both normal slashes and JSON-escaped slashes (\/)
    const cdnRe = new RegExp(
      `"(https?:(?:\\\\/\\\\/|//)${escapedHost}(?:\\\\/|/)(?:[^"<\\s]{4,}))"`,
      "gi"
    );
    let cdnMatch;
    while ((cdnMatch = cdnRe.exec(html)) !== null && images.length < 10) {
      const src = cdnMatch[1].replace(/\\\//g, "/").split("?")[0];
      if (!isPropertyImage(src)) continue;
      add(src);
    }
  }

  return images.slice(0, 5);
}

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}
