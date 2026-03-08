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

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];

  // OG image first
  const ogImage = getMeta(html, "og:image");
  if (ogImage) images.push(resolveUrl(ogImage, baseUrl));

  // Additional OG images
  const ogPattern =
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/gi;
  let match;
  while ((match = ogPattern.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (!images.includes(resolved)) images.push(resolved);
  }

  // Limit to first 5
  return images.slice(0, 5);
}

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}
