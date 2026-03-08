"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapListing {
  id: string;
  title: string;
  price: number | null;
  size: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrls: string[];
}

interface MapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

const pinIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="%237c3aed" stroke="white" stroke-width="3"/><text x="14" y="18" text-anchor="middle" fill="white" font-size="14" font-weight="bold">★</text></svg>'
    ),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

function FitBounds({
  points,
}: {
  points: { latitude: number; longitude: number }[];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 14);
    } else {
      const bounds = L.latLngBounds(
        points.map((l) => [l.latitude, l.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

export function ListingMap({
  listings,
  pins = [],
  onListingClick,
}: {
  listings: MapListing[];
  pins?: MapPin[];
  onListingClick: (id: string) => void;
}) {
  const geocoded = listings.filter(
    (l): l is MapListing & { latitude: number; longitude: number } =>
      l.latitude != null && l.longitude != null
  );

  if (geocoded.length === 0 && pins.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white border border-zinc-100 rounded-2xl">
        <p className="text-zinc-400 text-sm">
          No listings with locations to show on the map.
        </p>
      </div>
    );
  }

  const allPoints = [
    ...geocoded.map((l) => ({ latitude: l.latitude, longitude: l.longitude })),
    ...pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
  ];
  const center: [number, number] = [allPoints[0].latitude, allPoints[0].longitude];

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-100 bg-white h-full">
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full"
        style={{ minHeight: "400px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />

        {/* Reference pins */}
        {pins.map((p) => (
          <Marker key={`pin-${p.id}`} position={[p.latitude, p.longitude]} icon={pinIcon}>
            <Popup>
              <div className="min-w-[140px]">
                <p className="font-semibold text-sm text-violet-700 flex items-center gap-1">
                  <span>★</span> {p.name}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">Reference point</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Listing markers */}
        {geocoded.map((l) => {
          const dist =
            pins.length > 0
              ? Math.min(
                  ...pins.map((p) => {
                    const R = 6371;
                    const dLat = ((p.latitude - l.latitude) * Math.PI) / 180;
                    const dLng = ((p.longitude - l.longitude) * Math.PI) / 180;
                    const a =
                      Math.sin(dLat / 2) ** 2 +
                      Math.cos((l.latitude * Math.PI) / 180) *
                        Math.cos((p.latitude * Math.PI) / 180) *
                        Math.sin(dLng / 2) ** 2;
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                  })
                )
              : null;
          return (
            <Marker key={l.id} position={[l.latitude, l.longitude]}>
              <Popup>
                <div className="min-w-[180px]">
                  {l.imageUrls.length > 0 && (
                    <img
                      src={l.imageUrls[0]}
                      alt={l.title}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <p className="font-semibold text-sm text-zinc-900 mb-0.5">
                    {l.title}
                  </p>
                  {l.price != null && (
                    <p className="text-sm font-bold text-zinc-700">
                      &euro;{l.price.toLocaleString()}/mo
                    </p>
                  )}
                  {l.location && (
                    <p className="text-xs text-zinc-400 mt-0.5">{l.location}</p>
                  )}
                  {dist != null && (
                    <p className="text-xs text-violet-500 font-medium mt-1">
                      ★ {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`} from nearest pin
                    </p>
                  )}
                  <button
                    onClick={() => onListingClick(l.id)}
                    className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-700"
                  >
                    View details &rarr;
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {geocoded.length < listings.length && (
        <p className="text-xs text-zinc-400 px-4 py-2">
          Showing {geocoded.length} of {listings.length} listings on map.{" "}
          {listings.length - geocoded.length} missing location data.
        </p>
      )}
    </div>
  );
}
