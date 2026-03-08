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

function FitBounds({
  listings,
}: {
  listings: { latitude: number; longitude: number }[];
}) {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) return;

    if (listings.length === 1) {
      map.setView([listings[0].latitude, listings[0].longitude], 14);
    } else {
      const bounds = L.latLngBounds(
        listings.map((l) => [l.latitude, l.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, listings]);

  return null;
}

export function ListingMap({
  listings,
  onListingClick,
}: {
  listings: MapListing[];
  onListingClick: (id: string) => void;
}) {
  const geocoded = listings.filter(
    (l): l is MapListing & { latitude: number; longitude: number } =>
      l.latitude != null && l.longitude != null
  );

  if (geocoded.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white border border-zinc-100 rounded-2xl">
        <p className="text-zinc-400 text-sm">
          No listings with locations to show on the map.
        </p>
      </div>
    );
  }

  const center: [number, number] = [geocoded[0].latitude, geocoded[0].longitude];

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
        <FitBounds listings={geocoded} />
        {geocoded.map((l) => (
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
                <button
                  onClick={() => onListingClick(l.id)}
                  className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-700"
                >
                  View details &rarr;
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
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
