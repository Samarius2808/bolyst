"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type ListingStatus = "NEW" | "VIEWING" | "APPLIED" | "REJECTED" | "ACCEPTED" | "DELISTED";

interface MapListing {
  id: string;
  title: string;
  price: number | null;
  size: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ListingStatus;
  imageUrls: string[];
  addedBy?: { id: string; name: string | null; email: string } | null;
}

interface MapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// Reference point icon (teal circle with star)
const pinIcon = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
  html: '<div style="width:28px;height:28px;border-radius:50%;background:#0d9488;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:bold;line-height:1;">★</div>',
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

// Violet drop pin for regular listings
const defaultIcon = L.divIcon({
  className: "",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
  html: `<div style="position:relative;width:30px;height:40px;">
    <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#7c3aed;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg);position:absolute;top:0;left:0;">
      <div style="width:10px;height:10px;border-radius:50%;background:white;position:absolute;top:8px;left:8px;"></div>
    </div>
  </div>`,
});

// Rose drop pin for favorited listings
const favoriteIcon = L.divIcon({
  className: "",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
  html: `<div style="position:relative;width:30px;height:40px;">
    <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#e11d48;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg);position:absolute;top:0;left:0;"></div>
    <div style="position:absolute;top:3px;left:0;width:30px;height:26px;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;line-height:1;">♥</div>
  </div>`,
});

// Grey pin for delisted listings
const delistedIcon = L.divIcon({
  className: "",
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -40],
  html: `<div style="position:relative;width:30px;height:40px;opacity:0.6;">
    <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#a1a1aa;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);transform:rotate(-45deg);position:absolute;top:0;left:0;">
      <div style="width:10px;height:10px;border-radius:50%;background:white;position:absolute;top:8px;left:8px;"></div>
    </div>
  </div>`,
});

// Member colors for color-coded pins
const memberColors = [
  "#7c3aed", // violet
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#e11d48", // rose
  "#7c3aed", // violet (repeat)
  "#0891b2", // cyan
  "#c026d3", // fuchsia
];

function makeMemberIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
    html: `<div style="position:relative;width:30px;height:40px;">
      <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg);position:absolute;top:0;left:0;">
        <div style="width:10px;height:10px;border-radius:50%;background:white;position:absolute;top:8px;left:8px;"></div>
      </div>
    </div>`,
  });
}

function makeMemberFavIcon(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
    html: `<div style="position:relative;width:30px;height:40px;">
      <div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:rotate(-45deg);position:absolute;top:0;left:0;"></div>
      <div style="position:absolute;top:3px;left:0;width:30px;height:26px;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;line-height:1;">♥</div>
    </div>`,
  });
}

// Cache icons by color to avoid recreating
const iconCache = new Map<string, L.DivIcon>();
function getCachedIcon(color: string, isFav: boolean) {
  const key = `${color}-${isFav}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, isFav ? makeMemberFavIcon(color) : makeMemberIcon(color));
  }
  return iconCache.get(key)!;
}

function getListingIcon(
  listing: MapListing,
  favoritedIds: Set<string>,
  memberColorMap: Map<string, string>
) {
  if (listing.status === "DELISTED") return delistedIcon;
  const isFav = favoritedIds.has(listing.id);
  const memberColor = listing.addedBy ? memberColorMap.get(listing.addedBy.id) : undefined;
  if (memberColor) return getCachedIcon(memberColor, isFav);
  return isFav ? favoriteIcon : defaultIcon;
}

interface MapMember {
  id: string;
  name: string | null;
  email: string;
}

export function ListingMap({
  listings,
  pins = [],
  favoritedIds = new Set(),
  members = [],
  onListingClick,
}: {
  listings: MapListing[];
  pins?: MapPin[];
  favoritedIds?: Set<string>;
  members?: MapMember[];
  onListingClick: (id: string) => void;
}) {
  // Build member → color map
  const memberColorMap = new Map<string, string>();
  members.forEach((m, i) => {
    memberColorMap.set(m.id, memberColors[i % memberColors.length]);
  });
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
                <p className="font-semibold text-sm text-teal-700 flex items-center gap-1">
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
            <Marker key={l.id} position={[l.latitude, l.longitude]} icon={getListingIcon(l, favoritedIds, memberColorMap)}>
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
