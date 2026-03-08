/** Haversine distance in km between two lat/lng points */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Returns distance to the nearest pin, or null if no pins */
export function nearestPinDistance(
  lat: number,
  lng: number,
  pins: { latitude: number; longitude: number }[]
): number | null {
  if (pins.length === 0) return null;
  let min = Infinity;
  for (const p of pins) {
    const d = haversineKm(lat, lng, p.latitude, p.longitude);
    if (d < min) min = d;
  }
  return Math.round(min * 10) / 10; // round to 1 decimal
}
