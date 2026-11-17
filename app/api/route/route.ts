import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// All routing goes through Transitous (MOTIS v2): public transport itineraries,
// plus plain walking/cycling routes via its OSM street router ("direct" modes).
const TRANSITOUS_URL = "https://api.transitous.org/api/v5/plan";
const USER_AGENT = "Bolyst/1.0 (hello@bolyst.eu)";

const DIRECT_MODES: Record<string, string> = {
  walking: "WALK",
  cycling: "BIKE",
};

// Street routes between fixed points barely change, so they are cached on the
// server for a week. Transit depends on the current timetable, so only briefly.
const STREET_REVALIDATE_S = 7 * 24 * 60 * 60;
const TRANSIT_REVALIDATE_S = 30 * 60;
// Upper bound for walk/bike-only routes (Transitous defaults to 30 minutes)
const MAX_DIRECT_TIME_S = 6 * 60 * 60;
// Transitous rate-limits per IP: ~10 requests pass at once, further ones are
// queued (released ~1 per 3 s) and the overflow is rejected with a 429. So
// allow for queueing time, and wait a moment before retrying a 429.
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_BACKOFF_MS = 3000;
const ERROR_BACKOFF_MS = 1000;

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const startLat = parseCoord(searchParams.get("startLat"));
  const startLng = parseCoord(searchParams.get("startLng"));
  const endLat = parseCoord(searchParams.get("endLat"));
  const endLng = parseCoord(searchParams.get("endLng"));
  const mode = searchParams.get("mode") || "walking";

  if (startLat == null || startLng == null || endLat == null || endLng == null) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  if (mode === "transit") {
    return handleTransit(startLat, startLng, endLat, endLng);
  }

  const directMode = DIRECT_MODES[mode];
  if (!directMode) {
    return NextResponse.json(
      { error: "Invalid mode. Use: walking, cycling, transit" },
      { status: 400 },
    );
  }

  const route = await fetchDirectRoute(startLat, startLng, endLat, endLng, directMode);
  if (route === "error") {
    return NextResponse.json({ error: "Routing request failed" }, { status: 502 });
  }
  if (!route) {
    return NextResponse.json({ error: "No route found" }, { status: 404 });
  }

  return NextResponse.json(route, {
    headers: { "Cache-Control": `private, max-age=${STREET_REVALIDATE_S}` },
  });
}

/** Parse a coordinate, rounded to ~1 m so equivalent requests share a cache entry. */
function parseCoord(value: string | null): number | null {
  if (value == null) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 1e5) / 1e5 : null;
}

/**
 * Call the Transitous planner. Successful responses are kept in Next's data
 * cache for `revalidateS`; a 429, 5xx or timeout is retried after a short wait.
 */
async function fetchPlan(params: URLSearchParams, revalidateS: number): Promise<unknown | null> {
  const url = `${TRANSITOUS_URL}?${params}`;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let backoffMs = ERROR_BACKOFF_MS;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        next: { revalidate: revalidateS },
      });
      if (res.ok) return await res.json();
      await res.body?.cancel();
      console.error(`Transitous error (attempt ${attempt}):`, res.status);
      if (res.status === 429) {
        const retryAfterS = Number(res.headers.get("retry-after"));
        backoffMs = retryAfterS > 0 ? retryAfterS * 1000 : RATE_LIMIT_BACKOFF_MS;
      } else if (res.status < 500) {
        return null;
      }
    } catch (err) {
      console.error(`Transitous fetch error (attempt ${attempt}):`, err);
    }
    if (attempt < MAX_ATTEMPTS) {
      // Jitter so a burst of rejected requests doesn't retry in lockstep
      await new Promise((r) => setTimeout(r, backoffMs + Math.random() * 1000));
    }
  }
  return null;
}

interface LegGeometry {
  points: string;
  precision: number;
}

interface PlanLeg {
  mode: string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  duration?: number;
  distance?: number;
  legGeometry?: LegGeometry;
}

interface Itinerary {
  duration?: number;
  legs?: PlanLeg[];
}

interface PlanResponse {
  itineraries?: Itinerary[];
  direct?: Itinerary[];
}

interface StreetRoute {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

/** Walk or bike route between two points. null = no route, "error" = upstream failure. */
async function fetchDirectRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  directMode: string,
): Promise<StreetRoute | null | "error"> {
  const params = new URLSearchParams({
    fromPlace: `${fromLat},${fromLng}`,
    toPlace: `${toLat},${toLng}`,
    directModes: directMode,
    transitModes: "",
    maxDirectTime: String(MAX_DIRECT_TIME_S),
  });
  const data = (await fetchPlan(params, STREET_REVALIDATE_S)) as PlanResponse | null;
  if (!data) return "error";
  return streetRoute(data.direct?.[0]);
}

/** Flatten a walk/bike-only itinerary into a drawable route. */
function streetRoute(itin: Itinerary | undefined): StreetRoute | null {
  const legs = itin?.legs ?? [];
  if (!itin || legs.length === 0) return null;

  const coordinates: [number, number][] = [];
  let distance = 0;
  for (const leg of legs) {
    coordinates.push(...legCoordinates(leg));
    distance += leg.distance ?? 0;
  }
  if (distance === 0) distance = pathLength(coordinates);

  return { coordinates, distance, duration: itin.duration ?? 0 };
}

// Decode Google polyline encoding
function decodePolyline(encoded: string, precision: number = 5): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lat / factor, lng / factor]);
  }

  return coords;
}

/** A leg's path, or a straight line between its ends when it has no geometry. */
function legCoordinates(leg: PlanLeg): [number, number][] {
  const geom = leg.legGeometry;
  if (geom?.points) return decodePolyline(geom.points, geom.precision || 5);
  return [
    [leg.from.lat, leg.from.lon],
    [leg.to.lat, leg.to.lon],
  ];
}

// Haversine distance in meters between two [lat, lng] points
function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function pathLength(coordinates: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineMeters(coordinates[i - 1], coordinates[i]);
  }
  return total;
}

async function handleTransit(startLat: number, startLng: number, endLat: number, endLng: number) {
  const params = new URLSearchParams({
    fromPlace: `${startLat},${startLng}`,
    toPlace: `${endLat},${endLng}`,
    // Also return the walk-only route ("direct"), so the client can compare
    // transit against walking without a second request
    maxDirectTime: String(MAX_DIRECT_TIME_S),
  });
  const data = (await fetchPlan(params, TRANSIT_REVALIDATE_S)) as PlanResponse | null;
  if (!data) {
    return NextResponse.json({ error: "Transit routing failed" }, { status: 502 });
  }

  const itineraries = [...(data.itineraries || []), ...(data.direct || [])];
  if (itineraries.length === 0) {
    return NextResponse.json({ error: "No transit route found" }, { status: 404 });
  }

  // Use the first itinerary
  const itin = itineraries[0];
  const legs = itin.legs || [];

  // Walking legs without a polyline get a real street route (fetched in
  // parallel); the rest decode their own geometry or fall back to a straight line.
  const walkRoutes = await Promise.all(
    legs.map(async (leg) => {
      if (leg.legGeometry?.points || leg.mode !== "WALK") return null;
      const route = await fetchDirectRoute(
        leg.from.lat,
        leg.from.lon,
        leg.to.lat,
        leg.to.lon,
        "WALK",
      );
      return route && route !== "error" ? route : null;
    }),
  );

  const coordinates: [number, number][] = [];
  // Duration: use itinerary-level if available, otherwise sum legs
  let totalDuration = itin.duration || legs.reduce((sum, leg) => sum + (leg.duration || 0), 0);

  legs.forEach((leg, i) => {
    const walkRoute = walkRoutes[i];
    if (walkRoute) {
      coordinates.push(...walkRoute.coordinates);
      // Swap the planner's walking estimate for the routed one
      totalDuration += walkRoute.duration - (leg.duration || 0);
    } else {
      coordinates.push(...legCoordinates(leg));
    }
  });

  if (coordinates.length === 0) {
    coordinates.push([startLat, startLng], [endLat, endLng]);
  }

  return NextResponse.json({
    distance: pathLength(coordinates),
    duration: totalDuration,
    coordinates,
    // Build transit leg summary for the UI
    transitLegs: legs.map((leg) => ({ mode: leg.mode })),
    walking: streetRoute(data.direct?.find((d) => d.legs?.every((leg) => leg.mode === "WALK"))),
  });
}
