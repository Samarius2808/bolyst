// Bolyst basemap branding for the board map. Ported from the LevelUp website's
// `locmap.ts`: OpenFreeMap's Positron vector style, recolored layer-by-layer to
// the Bolyst palette (warm near-white land, sage parks, muted water), with a
// dark variant, localized labels and the clutter layers hidden. Pure functions
// over a MapLibre map instance — the React wiring lives in
// components/listings/BrandedBasemap.tsx, the pin markup in
// components/listings/ListingMap.tsx and the CSS in app/globals.css (`.bmap`).
import type { Map as MaplibreMap } from "maplibre-gl";

export const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export type MapTheme = "light" | "dark";

interface Palette {
  land: string;
  landAlt: string; // residential / landuse
  water: string;
  waterLine: string; // rivers, canals
  park: string;
  wood: string;
  building: string;
  roadMinor: string;
  roadMajor: string;
  roadCasing: string;
  path: string;
  rail: string;
  railDash: string;
  boundary: string;
  text: string; // towns, cities
  textStreet: string;
  textMinor: string; // countries, paths, airports
  textArea: string; // neighbourhoods / suburbs — the names people hunt by
  textWater: string;
  halo: string;
}

// Light: the page's warm off-white (#faf9f7) carried onto the land, sage-100
// for parks, a desaturated cool grey for water so it still reads as water
// without fighting the sage.
const LIGHT: Palette = {
  land: "#f4f2ed",
  landAlt: "#efece6",
  water: "#d4dcdd",
  waterLine: "#c7d2d4",
  park: "#e2e9dd",
  wood: "#dce4d7",
  building: "#e7e4dd",
  roadMinor: "#ffffff",
  roadMajor: "#ffffff",
  roadCasing: "#dcd8cf",
  path: "#f9f7f3",
  rail: "#d9d6ce",
  railDash: "#faf9f7",
  boundary: "#a7bd9c", // sage-300
  text: "#3f3f46", // zinc-700
  textStreet: "#6b6b73",
  textMinor: "#8e8e96",
  textArea: "#43583b", // sage-700
  textWater: "#7b8d93",
  halo: "#faf9f7",
};

// Dark: sits on the app's #111110 page / zinc-900 cards.
const DARK: Palette = {
  land: "#1b1b19",
  landAlt: "#1f1f1c",
  water: "#121416",
  waterLine: "#1a1e21",
  park: "#1e241c",
  wood: "#1b211a",
  building: "#242422",
  roadMinor: "#2b2b28",
  roadMajor: "#34342f",
  roadCasing: "#1b1b19",
  path: "#262623",
  rail: "#2e2e2b",
  railDash: "#1b1b19",
  boundary: "#43583b", // sage-700
  text: "#d4d4d8", // zinc-300
  textStreet: "#a1a1aa",
  textMinor: "#71717a",
  textArea: "#85a176", // sage-400
  textWater: "#6f8088",
  halo: "#111110",
};

export const PALETTES: Record<MapTheme, Palette> = { light: LIGHT, dark: DARK };

// Clutter hidden outright (exact Positron/OpenMapTiles layer ids). Unlike the
// LevelUp country-scale map, this one is viewed at neighbourhood zoom, so
// minor roads, street names, railways and district labels all stay — they
// are what an apartment hunter reads. Only route-number shields go.
const HIDE = new Set(["highway-shield-non-us", "highway-shield-us-interstate", "road_shield_us"]);

/** Recolor Positron to the Bolyst palette, hide clutter and localize labels. */
export function brandStyle(map: MaplibreMap, lang: string, theme: MapTheme) {
  const p = PALETTES[theme];
  const nameField = [
    "coalesce",
    ["get", `name:${lang}`],
    ["get", "name:latin"],
    ["get", "name"],
  ] as const;

  for (const layer of map.getStyle()?.layers ?? []) {
    const id = layer.id;
    const setPaint = (prop: string, value: unknown) => {
      try {
        map.setPaintProperty(id, prop, value);
      } catch {
        /* layer without that paint prop — skip */
      }
    };
    const setLayout = (prop: string, value: unknown) => {
      try {
        map.setLayoutProperty(id, prop, value);
      } catch {
        /* skip */
      }
    };
    if (HIDE.has(id)) {
      setLayout("visibility", "none");
      continue;
    }
    const has = (...words: string[]) => words.some((w) => id.toLowerCase().includes(w));

    switch (layer.type) {
      case "background":
        setPaint("background-color", p.land);
        break;

      case "fill":
        if (has("water")) setPaint("fill-color", p.water);
        else if (has("wood")) setPaint("fill-color", p.wood);
        else if (has("park", "grass", "green", "cemetery")) setPaint("fill-color", p.park);
        else if (has("building")) setPaint("fill-color", p.building);
        else if (has("residential", "landuse", "suburb", "urban"))
          setPaint("fill-color", p.landAlt);
        else if (has("aeroway")) setPaint("fill-color", p.landAlt);
        else setPaint("fill-color", p.land); // piers, glaciers, ice shelves
        setPaint("fill-outline-color", "rgba(0,0,0,0)");
        break;

      case "line":
        if (has("waterway", "river")) setPaint("line-color", p.waterLine);
        else if (has("boundary")) {
          setPaint("line-color", p.boundary);
          setPaint("line-opacity", 0.7);
        } else if (has("dashline")) setPaint("line-color", p.railDash);
        else if (has("railway")) setPaint("line-color", p.rail);
        else if (has("path")) {
          setPaint("line-color", p.path);
          setPaint("line-opacity", 0.8);
        } else if (has("casing", "subtle")) setPaint("line-color", p.roadCasing);
        else if (has("minor", "aeroway")) setPaint("line-color", p.roadMinor);
        else if (has("pier")) setPaint("line-color", p.land);
        else setPaint("line-color", p.roadMajor); // major / motorway / tunnel / bridge inner
        break;

      case "symbol":
        if (has("water")) setPaint("text-color", p.textWater);
        else if (has("country", "airport", "name-path")) setPaint("text-color", p.textMinor);
        else if (has("highway-name")) setPaint("text-color", p.textStreet);
        else if (id === "label_other") setPaint("text-color", p.textArea);
        else setPaint("text-color", p.text);
        setPaint("text-halo-color", p.halo);
        setPaint("text-halo-width", has("highway-name") ? 1.2 : 1.4);
        setPaint("text-halo-blur", 0.4);
        setLayout("text-field", nameField);
        break;
    }
  }
}

// ---- Pin markup --------------------------------------------------------------
// Rendered into a Leaflet divIcon. Three layers, for the same reason as the
// LevelUp pins: the wrap (Leaflet's `.leaflet-marker-icon`) carries Leaflet's
// inline positioning transform and must never be animated; `.bmap-pin-drop`
// carries the one-shot drop-in; `.bmap-pin` carries hover/active transforms.
// `--pin-color` feeds the active glow in CSS.

const TEARDROP = "M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z";
const TEARDROP_RING =
  "M12 1.2C6.04 1.2 1.2 6.04 1.2 12c0 3.9 2.6 8.6 5.3 12.3C9 27.7 11 30 12 31c1-1 3-3.3 5.5-6.7 2.7-3.7 5.3-8.4 5.3-12.3 0-5.96-4.84-10.8-10.8-10.8z";
// Material "favorite", scaled to ~11px and centred on the teardrop head.
const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
// Material "star", scaled to ~8px and centred in the reference-point disc.
const STAR =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

export interface PinOptions {
  color: string;
  favorite?: boolean;
  delayMs?: number;
}

export const PIN_SIZE: [number, number] = [30, 40];

/** Inner HTML for a listing pin divIcon (teardrop, sage or member-coloured). */
export function listingPinHtml({ color, favorite = false, delayMs = 0 }: PinOptions): string {
  const glyph = favorite
    ? `<path transform="translate(5.4 4.8) scale(0.55)" d="${HEART}" fill="#fff"/>`
    : `<circle cx="12" cy="11.5" r="4.2" fill="#fff"/>`;
  return `<div class="bmap-pin-drop" style="--pin-delay:${delayMs}ms;--pin-color:${color}">
    <div class="bmap-pin">
      <span class="bmap-pin__shadow"></span>
      <svg width="30" height="40" viewBox="0 0 24 32" fill="none" aria-hidden="true">
        <path class="bmap-pin__body" d="${TEARDROP}" fill="${color}"/>
        <path d="${TEARDROP_RING}" stroke="#fff" stroke-width="1.6" fill="none" opacity="0.9"/>
        ${glyph}
      </svg>
    </div>
  </div>`;
}

export const REF_PIN_SIZE: [number, number] = [24, 24];

/** Inner HTML for a reference-point divIcon (sage disc with a star). */
export function referencePinHtml(color: string, delayMs = 0): string {
  return `<div class="bmap-pin-drop" style="--pin-delay:${delayMs}ms;--pin-color:${color}">
    <div class="bmap-ref">
      <span class="bmap-ref__shadow"></span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>
        <path transform="translate(6.96 7.13) scale(0.42)" d="${STAR}" fill="#fff"/>
      </svg>
    </div>
  </div>`;
}

/**
 * Staggered drop-in delays, west-most point first (as on the LevelUp map), with
 * the whole entrance capped so a 100-listing board still lands within ~1.2s.
 * Returns delays indexed like `points`.
 */
export function dropDelays(points: { longitude: number }[], maxTotalMs = 1200): number[] {
  const n = points.length;
  if (n === 0) return [];
  const step = Math.min(70, maxTotalMs / n);
  const order = points.map((p, i) => ({ i, lng: p.longitude })).sort((a, b) => a.lng - b.lng);
  const delays = new Array<number>(n);
  order.forEach(({ i }, rank) => {
    delays[i] = Math.round(rank * step);
  });
  return delays;
}
