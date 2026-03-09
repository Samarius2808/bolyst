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
        "Mozilla/5.0 (compatible; SVEEN/1.0; +https://sveen.app)",
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

function normalizeImageUrl(url: string): string {
  try {
    const u = new URL(url);
    // Extract just the filename (last path segment) for dedup —
    // catches CDNs serving same image at different sizes/paths
    const filename = u.pathname.split("/").pop() || u.pathname;
    return u.hostname + "/" + filename;
  } catch {
    return url;
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  function add(src: string) {
    const resolved = resolveUrl(src, baseUrl);
    const key = normalizeImageUrl(resolved);
    if (!seen.has(key)) {
      seen.add(key);
      images.push(resolved);
    }
  }

  // 1. OG images (all of them)
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

  // 3. <img> tags — check src, data-src, data-lazy-src, srcset for lazy-loaded images
  const imgTagPattern = /<img[^>]*>/gi;
  while ((match = imgTagPattern.exec(html)) !== null && images.length < 20) {
    const tag = match[0];

    // Skip tiny images, icons, tracking pixels, SVGs, data URIs
    if (
      /width=["']?\d{1,2}['" ]/i.test(tag) ||
      /height=["']?\d{1,2}['" ]/i.test(tag)
    ) {
      continue;
    }

    // Try multiple attributes where the real image URL might be
    const srcAttrs = ["data-src", "data-lazy-src", "data-original", "src"];
    for (const attr of srcAttrs) {
      const attrMatch = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
      if (attrMatch) {
        const src = attrMatch[1];
        if (
          /\.(svg|gif|ico)(\?|$)/i.test(src) ||
          src.startsWith("data:") ||
          /logo|icon|avatar|badge|button|sprite|pixel|track|1x1|placeholder/i.test(src)
        ) {
          break; // skip this img tag entirely
        }
        add(src);
        break; // only add one URL per img tag
      }
    }

    // Also check srcset for high-res images
    const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
    if (srcsetMatch && images.length < 20) {
      // srcset format: "url1 1x, url2 2x" or "url1 300w, url2 600w"
      const entries = srcsetMatch[1].split(",").map((s) => s.trim().split(/\s+/)[0]);
      const best = entries[entries.length - 1]; // last entry is usually highest res
      if (best && !best.startsWith("data:") && !/\.(svg|gif|ico)(\?|$)/i.test(best)) {
        add(best);
      }
    }
  }

  // 4. Inline image URLs in JS/JSON (catches galleries loaded via JavaScript)
  const inlineUrlPattern = /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi;
  while ((match = inlineUrlPattern.exec(html)) !== null && images.length < 20) {
    const src = match[1];
    if (
      /logo|icon|avatar|badge|button|sprite|pixel|track|placeholder|favicon/i.test(src)
    ) {
      continue;
    }
    add(src);
  }

  // Limit to 5 images
  return images.slice(0, 5);
}

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}
