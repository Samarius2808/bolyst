import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const ORS_KEY = process.env.OPENROUTESERVICE_API_KEY;

const ORS_PROFILES: Record<string, string> = {
  walking: "foot-walking",
  cycling: "cycling-regular",
};

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const startLng = searchParams.get("startLng");
  const startLat = searchParams.get("startLat");
  const endLng = searchParams.get("endLng");
  const endLat = searchParams.get("endLat");
  const mode = searchParams.get("mode") || "walking";

  if (!startLng || !startLat || !endLng || !endLat) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  // Transit routing via Transitous (MOTIS v2)
  if (mode === "transit") {
    return handleTransit(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng),
    );
  }

  // Walking / cycling via OpenRouteService
  if (!ORS_KEY) {
    return NextResponse.json({ error: "Routing service not configured" }, { status: 503 });
  }

  const profile = ORS_PROFILES[mode];
  if (!profile) {
    return NextResponse.json(
      { error: "Invalid mode. Use: walking, cycling, transit" },
      { status: 400 },
    );
  }

  const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_KEY}&start=${startLng},${startLat}&end=${endLng},${endLat}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    return NextResponse.json({ error: "Routing request timed out" }, { status: 504 });
  }
  if (!res.ok) {
    const text = await res.text();
    console.error("ORS error:", res.status, text);
    return NextResponse.json({ error: "Routing request failed" }, { status: 502 });
  }

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) {
    return NextResponse.json({ error: "No route found" }, { status: 404 });
  }

  const { distance, duration } = feature.properties.summary;
  const coordinates: [number, number][] = feature.geometry.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng],
  );

  return NextResponse.json({ distance, duration, coordinates });
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

interface TransitLeg {
  mode: string;
  from: { lat: number; lon: number; departure?: string };
  to: { lat: number; lon: number; arrival?: string };
  duration?: number;
  legGeometry?: { points: string; precision: number };
}

// Fetch a walking route from ORS for legs with missing geometry
async function fetchWalkingGeometry(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
  if (!ORS_KEY) return null;

  try {
    const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_KEY}&start=${fromLng},${fromLat}&end=${toLng},${toLat}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    const { distance, duration } = feature.properties.summary;
    const coordinates: [number, number][] = feature.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng],
    );

    return { coordinates, distance, duration };
  } catch {
    return null;
  }
}

async function handleTransit(startLat: number, startLng: number, endLat: number, endLng: number) {
  const params = new URLSearchParams({
    fromPlace: `${startLat},${startLng}`,
    toPlace: `${endLat},${endLng}`,
  });

  const url = `https://api.transitous.org/api/v5/plan?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Bolyst/1.0 (hello@bolyst.eu)",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Transitous error:", res.status, text);
      return NextResponse.json({ error: "Transit routing failed" }, { status: 502 });
    }

    const data = await res.json();

    const itineraries = [...(data.itineraries || []), ...(data.direct || [])];

    if (itineraries.length === 0) {
      return NextResponse.json({ error: "No transit route found" }, { status: 404 });
    }

    // Use the first itinerary
    const itin = itineraries[0];
    const legs: TransitLeg[] = itin.legs || [];

    const coordinates: [number, number][] = [];
    let walkingDuration = 0;

    // Process legs — fetch real walking geometry for WALK legs with no polyline
    for (const leg of legs) {
      const geom = leg.legGeometry;
      const hasGeometry = geom && geom.points && geom.points.length > 0;

      if (hasGeometry) {
        const precision = geom!.precision || 5;
        coordinates.push(...decodePolyline(geom!.points, precision));
      } else if (leg.mode === "WALK") {
        // Fetch real walking route from ORS
        const walkRoute = await fetchWalkingGeometry(
          leg.from.lat,
          leg.from.lon,
          leg.to.lat,
          leg.to.lon,
        );
        if (walkRoute) {
          coordinates.push(...walkRoute.coordinates);
          walkingDuration += walkRoute.duration;
        } else {
          // ORS failed — fall back to straight line
          coordinates.push([leg.from.lat, leg.from.lon]);
          coordinates.push([leg.to.lat, leg.to.lon]);
        }
      } else {
        // Non-walk leg with no geometry — straight line fallback
        coordinates.push([leg.from.lat, leg.from.lon]);
        coordinates.push([leg.to.lat, leg.to.lon]);
      }
    }

    // Duration: use itinerary-level if available, otherwise sum legs
    // Replace walking leg durations with real ORS durations
    let totalDuration = itin.duration || 0;

    if (totalDuration === 0) {
      for (const leg of legs) {
        totalDuration += leg.duration || 0;
      }
    }

    // If we got real walking data, replace the Transitous walking estimates
    // with ORS walking durations (more accurate, based on actual paths)
    if (walkingDuration > 0) {
      // Subtract Transitous walking estimates, add ORS walking durations
      let transitousWalkDuration = 0;
      for (const leg of legs) {
        if (leg.mode === "WALK") {
          transitousWalkDuration += leg.duration || 0;
        }
      }
      totalDuration = totalDuration - transitousWalkDuration + walkingDuration;
    }

    // Estimate total distance from coordinates
    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      totalDistance += haversineMeters(coordinates[i - 1], coordinates[i]);
    }

    if (coordinates.length === 0) {
      coordinates.push([startLat, startLng], [endLat, endLng]);
    }

    // Build transit leg summary for the UI
    const transitLegs = legs.map((leg) => ({ mode: leg.mode }));

    return NextResponse.json({
      distance: totalDistance,
      duration: totalDuration,
      coordinates,
      transitLegs,
    });
  } catch (err) {
    console.error("Transitous fetch error:", err);
    return NextResponse.json({ error: "Transit routing failed" }, { status: 502 });
  }
}
