export async function geocodeLocation(
  location: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Bolyst/1.0 (https://bolyst.app)",
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.length) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}
