"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { MapContainer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";
import {
  PIN_SIZE,
  REF_PIN_SIZE,
  dropDelays,
  listingPinHtml,
  referencePinHtml,
} from "@/lib/map-style";
import { BrandedBasemap } from "./BrandedBasemap";
import { CompactAttribution, ZoomControl } from "./MapControls";

type TransportMode = "walking" | "cycling" | "transit";

interface TransitLegInfo {
  mode: string; // e.g. "WALK", "BUS", "SUBWAY", "TRAM", "RAIL", "FERRY"
}

interface RouteInfo {
  listingId: string;
  pinId: string;
  mode: TransportMode;
  coordinates: [number, number][];
  distance: number; // meters
  duration: number; // seconds
  transitLegs?: TransitLegInfo[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `<1 min`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

const ROUTE_COLORS: Record<TransportMode, string> = {
  walking: "#55704a",
  cycling: "#55704a",
  transit: "#55704a",
};

const ROUTE_DASH: Record<TransportMode, string | undefined> = {
  walking: "2, 8",
  cycling: "12, 6",
  transit: undefined,
};

function ModeIcon({ mode, size = 12 }: { mode: TransportMode; size?: number }) {
  if (mode === "walking") {
    // Material Design: directions_walk
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
      </svg>
    );
  }
  if (mode === "cycling") {
    // Material Design: directions_bike
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
      </svg>
    );
  }
  // Material Design: directions_transit (train)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  );
}

// SVG icons for individual transit leg modes (from Transitous API)
function TransitLegModeIcon({ mode, size = 12 }: { mode: string; size?: number }) {
  switch (mode) {
    case "BUS":
      // Material Design: directions_bus
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
        </svg>
      );
    case "TRAM":
      // Material Design: tram
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 16.94V8.5c0-2.79-2.61-3.4-5.5-3.5l.9-1.64L13 2l-1.9 3.36C8.6 5.46 6 6.09 6 8.5v8.44c0 .99.81 1.81 1.81 1.81l-1.28 1.28L6 20.56l.72.72 2.12-2.12h6.32l2.12 2.12.72-.72-.53-.53-1.28-1.28c1 0 1.81-.82 1.81-1.81zM8.5 16c-.83 0-1.5-.67-1.5-1.5S7.67 13 8.5 13s1.5.67 1.5 1.5S9.33 16 8.5 16zM13 11H8V8h5v3zm2.5 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-5h-5V8h5v3z" />
        </svg>
      );
    case "SUBWAY":
      // Material Design: subway (metro/U-Bahn)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      );
    case "RAIL":
    case "TRAIN":
      // Material Design: train
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
      );
    case "FERRY":
      // Material Design: directions_boat
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.14.52-.05.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z" />
        </svg>
      );
    case "WALK":
      // Material Design: directions_walk (same as ModeIcon walking)
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
        </svg>
      );
    default:
      // Fallback: generic transit icon
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
      );
  }
}

// Compact leg sequence display: walk → metro → bus → walk
function TransitLegSequence({ legs, size = 11 }: { legs: TransitLegInfo[]; size?: number }) {
  // Deduplicate consecutive same-mode legs
  const deduped: string[] = [];
  for (const leg of legs) {
    if (deduped.length === 0 || deduped[deduped.length - 1] !== leg.mode) {
      deduped.push(leg.mode);
    }
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      {deduped.map((mode, i) => (
        <span key={i} className="inline-flex items-center gap-0.5">
          {i > 0 && (
            <svg
              width={7}
              height={7}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-zinc-300"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          )}
          <TransitLegModeIcon mode={mode} size={size} />
        </span>
      ))}
    </span>
  );
}

// Closes all popups when the route panel is open
function ClosePopups({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return;
    map.closePopup();
    const handler = () => map.closePopup();
    map.on("popupopen", handler);
    return () => {
      map.off("popupopen", handler);
    };
  }, [active, map]);
  return null;
}

// Fits the map to show the full route whenever coordinates change
function FitRoute({
  coordinates,
  bottomPadding,
}: {
  coordinates: [number, number][];
  bottomPadding: number;
}) {
  const map = useMap();
  // Serialize coordinates to a string so we only fit when they actually change
  const coordKey =
    coordinates.length > 0
      ? `${coordinates[0][0]},${coordinates[0][1]}-${coordinates[coordinates.length - 1][0]},${coordinates[coordinates.length - 1][1]}-${coordinates.length}`
      : "";
  const lastCoordKey = useRef("");
  useEffect(() => {
    if (!coordKey || coordKey === lastCoordKey.current) return;
    lastCoordKey.current = coordKey;
    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, {
      paddingTopLeft: [40, 40],
      paddingBottomRight: [40, bottomPadding + 20],
      animate: true,
      duration: 0.3,
    });
  }, [map, coordKey, coordinates, bottomPadding]);
  return null;
}

function RouteLayer({ route }: { route: RouteInfo }) {
  return (
    <Polyline
      positions={route.coordinates}
      pathOptions={{
        color: ROUTE_COLORS[route.mode],
        weight: 4,
        opacity: 0.8,
        dashArray: ROUTE_DASH[route.mode],
      }}
    />
  );
}

type ListingStatus =
  | "NEW"
  | "VIEWING"
  | "APPLIED"
  | "REJECTED"
  | "ACCEPTED"
  | "UNAVAILABLE_TIMEFRAME"
  | "DELISTED";

// Statuses that are no longer live options — rendered as muted grey pins
const INACTIVE_STATUSES: ReadonlySet<ListingStatus> = new Set([
  "DELISTED",
  "UNAVAILABLE_TIMEFRAME",
]);

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

const PIN_COLOR = "#55704a"; // sage-600
const DELISTED_COLOR = "#a1a1aa"; // zinc-400

// Reference point: sage disc with a star (see referencePinHtml for the markup)
function makeRefIcon(delayMs: number) {
  return L.divIcon({
    className: "bmap-pin-wrap",
    iconSize: REF_PIN_SIZE,
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: referencePinHtml(PIN_COLOR, delayMs),
  });
}

function FitBounds({ points }: { points: { latitude: number; longitude: number }[] }) {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current || points.length === 0) return;
    hasFit.current = true;

    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 14);
    } else {
      const bounds = L.latLngBounds(points.map((l) => [l.latitude, l.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}

// Member colors for color-coded pins
const memberColors = [
  "#55704a", // sage
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#e11d48", // rose
  "#6b8a5e", // sage-500
  "#0891b2", // cyan
  "#c026d3", // fuchsia
];

function pinColorFor(listing: MapListing, memberColorMap: Map<string, string>) {
  if (INACTIVE_STATUSES.has(listing.status)) return DELISTED_COLOR;
  const memberColor = listing.addedBy ? memberColorMap.get(listing.addedBy.id) : undefined;
  return memberColor ?? PIN_COLOR;
}

interface MapMember {
  id: string;
  name: string | null;
  email: string;
}

// Listing pin. The divIcon is stable per (colour, favourite, muted, delay);
// the hovered state is a class toggled on the existing marker element rather
// than a swapped icon, so the CSS scale transition actually runs. Leaflet
// resets the element's className whenever the icon changes, hence `icon` in
// the effect deps.
function ListingMarker({
  position,
  color,
  favorite,
  muted,
  delayMs,
  active,
  children,
}: {
  position: [number, number];
  color: string;
  favorite: boolean;
  muted: boolean;
  delayMs: number;
  active: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<L.Marker>(null);
  const icon = useMemo(
    () =>
      L.divIcon({
        className: `bmap-pin-wrap${muted ? " bmap-pin-wrap--muted" : ""}`,
        iconSize: PIN_SIZE,
        iconAnchor: [15, 40],
        popupAnchor: [0, -36],
        html: listingPinHtml({ color, favorite, delayMs }),
      }),
    [color, favorite, muted, delayMs],
  );
  useEffect(() => {
    ref.current?.getElement()?.classList.toggle("bmap-pin-wrap--active", active);
  }, [active, icon]);
  return (
    <Marker ref={ref} position={position} icon={icon} zIndexOffset={active ? 1000 : 0}>
      {children}
    </Marker>
  );
}

// Cache route results so switching modes doesn't re-fetch
type RouteCache = Record<string, RouteInfo>; // key: `${listingId}:${pinId}:${mode}`

function routeCacheKey(listingId: string, pinId: string, mode: TransportMode) {
  return `${listingId}:${pinId}:${mode}`;
}

export function ListingMap({
  listings,
  pins = [],
  favoritedIds = new Set(),
  members = [],
  hoveredId = null,
  commuteListingId = null,
  hidePinNudge = false,
  onListingClick,
  onCommuteClose,
}: {
  listings: MapListing[];
  pins?: MapPin[];
  favoritedIds?: Set<string>;
  members?: MapMember[];
  hoveredId?: string | null;
  commuteListingId?: string | null;
  hidePinNudge?: boolean;
  onListingClick: (id: string) => void;
  onCommuteClose?: () => void;
}) {
  const t = useTranslations("map");
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState<string | null>(null); // pinId being loaded
  const [transportMode, setTransportMode] = useState<TransportMode>("walking");
  const [routePanelListingId, setRoutePanelListingId] = useState<string | null>(null);
  const [routeCache, setRouteCache] = useState<RouteCache>({});
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const routePanelRef = useRef<HTMLDivElement>(null);
  const [routePanelHeight, setRoutePanelHeight] = useState(0);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);

  // Allow parent to open the route panel for a specific listing
  useEffect(() => {
    if (commuteListingId) {
      setRoutePanelListingId(commuteListingId);
      setRoute(null);
    }
  }, [commuteListingId]);

  const fetchRoute = useCallback(
    async (
      listingId: string,
      listingLat: number,
      listingLng: number,
      pin: MapPin,
      mode: TransportMode,
    ) => {
      // Check cache first
      const cacheKey = routeCacheKey(listingId, pin.id, mode);
      setActivePinId(pin.id);
      const cached = routeCache[cacheKey];
      if (cached) {
        const walkKey = routeCacheKey(listingId, pin.id, "walking");
        const walkCached = routeCache[walkKey];
        if (mode === "transit" && walkCached && cached.duration >= walkCached.duration) {
          setRoute(null);
        } else {
          setRoute(cached);
        }
        return;
      }

      setRouteLoading(pin.id);
      try {
        const params = new URLSearchParams({
          startLng: listingLng.toString(),
          startLat: listingLat.toString(),
          endLng: pin.longitude.toString(),
          endLat: pin.latitude.toString(),
          mode,
        });
        const res = await fetch(`/api/route?${params}`);
        if (!res.ok) throw new Error("Route fetch failed");
        const data = await res.json();
        const result: RouteInfo = {
          listingId,
          pinId: pin.id,
          mode,
          coordinates: data.coordinates,
          distance: data.distance,
          duration: data.duration,
          transitLegs: data.transitLegs,
        };
        setRouteCache((prev) => ({ ...prev, [cacheKey]: result }));
        const walkKey = routeCacheKey(listingId, pin.id, "walking");
        const walkCached = routeCache[walkKey];
        if (mode === "transit" && walkCached && result.duration >= walkCached.duration) {
          setRoute(null);
        } else {
          setRoute(result);
        }
      } catch {
        setRoute(null);
      } finally {
        setRouteLoading(null);
      }
    },
    [routeCache],
  );

  const closeRoutePanel = useCallback(() => {
    setRoutePanelListingId(null);
    setRoute(null);
    setActivePinId(null);
    onCommuteClose?.();
  }, [onCommuteClose]);

  // Build member → color map
  const memberColorMap = new Map<string, string>();
  members.forEach((m, i) => {
    memberColorMap.set(m.id, memberColors[i % memberColors.length]);
  });
  const geocoded = listings.filter(
    (l): l is MapListing & { latitude: number; longitude: number } =>
      l.latitude != null && l.longitude != null,
  );

  // Measure route panel height for map padding
  useEffect(() => {
    if (routePanelRef.current) {
      setRoutePanelHeight(routePanelRef.current.offsetHeight);
    } else {
      setRoutePanelHeight(0);
    }
  }, []);

  // Pins drop in west-to-east on mount; once the entrance has played the
  // container is marked settled so later icon changes (favourite, hover,
  // new listings) appear instantly instead of re-animating.
  const delays = dropDelays(geocoded);
  const refIcons = useMemo(() => {
    const refDelays = dropDelays(pins);
    return pins.map((_, i) => makeRefIcon(refDelays[i]));
  }, [pins]);
  const [settled, setSettled] = useState(false);
  const entranceMs = delays.length > 0 ? Math.max(...delays) + 500 : 0;
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(true), entranceMs);
    return () => window.clearTimeout(id);
  }, [entranceMs]);

  if (geocoded.length === 0 && pins.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
        <p className="text-zinc-400 text-sm">{t("noListings")}</p>
      </div>
    );
  }

  const allPoints = [
    ...geocoded.map((l) => ({ latitude: l.latitude, longitude: l.longitude })),
    ...pins.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
  ];
  const center: [number, number] = [allPoints[0].latitude, allPoints[0].longitude];

  const routePanelListing = routePanelListingId
    ? geocoded.find((l) => l.id === routePanelListingId)
    : null;

  return (
    <>
      <div
        className={`bmap${settled ? " pins-settled" : ""} rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 h-full relative`}
      >
        <MapContainer
          ref={setLeafletMap}
          center={center}
          zoom={13}
          maxZoom={19}
          className="h-full w-full"
          style={{ minHeight: "400px" }}
          scrollWheelZoom={true}
          attributionControl={false}
          zoomControl={false}
        >
          <BrandedBasemap />
          <FitBounds points={allPoints} />
          <ClosePopups active={routePanelListingId !== null} />
          {route && <RouteLayer route={route} />}
          {route && <FitRoute coordinates={route.coordinates} bottomPadding={routePanelHeight} />}

          {/* Reference pins */}
          {pins.map((p, i) => (
            <Marker key={`pin-${p.id}`} position={[p.latitude, p.longitude]} icon={refIcons[i]}>
              <Popup>
                <div className="min-w-[140px]">
                  <p className="font-semibold text-sm text-sage-700 dark:text-sage-400 flex items-center gap-1">
                    <span>★</span> {p.name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {t("referencePoint")}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Listing markers */}
          {geocoded.map((l, i) => {
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
                    }),
                  )
                : null;
            const distStr =
              dist != null
                ? dist < 1
                  ? `${Math.round(dist * 1000)}m`
                  : `${dist.toFixed(1)} km`
                : null;
            return (
              <ListingMarker
                key={l.id}
                position={[l.latitude, l.longitude]}
                color={pinColorFor(l, memberColorMap)}
                favorite={favoritedIds.has(l.id)}
                muted={INACTIVE_STATUSES.has(l.status)}
                delayMs={delays[i]}
                active={hoveredId === l.id}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    {l.imageUrls.length > 0 && (
                      <img
                        src={l.imageUrls[0]}
                        alt={l.title}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    )}
                    <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-0.5">
                      {l.title}
                    </p>
                    {l.price != null && (
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        &euro;{l.price.toLocaleString()}/mo
                      </p>
                    )}
                    {l.location && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {l.location}
                      </p>
                    )}
                    {distStr != null && (
                      <p className="text-xs text-sage-500 dark:text-sage-400 font-medium mt-1">
                        ★ {t("fromNearestPin", { distance: distStr })}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => onListingClick(l.id)}
                        className="text-xs font-medium text-sage-600 dark:text-sage-400 hover:text-sage-700"
                      >
                        {t("viewDetails")}
                      </button>
                      {pins.length > 0 && (
                        <>
                          <span className="text-zinc-200 dark:text-zinc-700">|</span>
                          <button
                            onClick={() => {
                              setRoutePanelListingId(routePanelListingId === l.id ? null : l.id);
                              if (routePanelListingId !== l.id) setRoute(null);
                            }}
                            className="text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="6" cy="19" r="3" />
                              <circle cx="18" cy="5" r="3" />
                              <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12" />
                            </svg>
                            {t("commute")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Popup>
              </ListingMarker>
            );
          })}
        </MapContainer>
        <ZoomControl map={leafletMap} />
        <CompactAttribution />

        {/* Empty pins nudge */}
        {pins.length === 0 && geocoded.length > 0 && !routePanelListingId && !hidePinNudge && (
          <div className="absolute top-3 left-3 right-14 z-[1000] bg-white dark:bg-zinc-900 backdrop-blur-sm rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-800 px-3 py-2 flex items-center gap-2">
            <span className="text-sage-600 dark:text-sage-500 flex-shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.5 10.5 1.5 8 1.5Z" />
                <circle cx="8" cy="6" r="1.5" />
              </svg>
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("addPinNudge")}</p>
          </div>
        )}

        {/* Floating route panel */}
        {routePanelListing && pins.length > 0 && (
          <div
            ref={routePanelRef}
            className="absolute bottom-2 left-2 right-2 z-[1000] bg-white dark:bg-zinc-900 backdrop-blur-sm rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 p-3"
          >
            {/* Header: listing name + mode tabs + close */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate flex-1">
                {routePanelListing.title}
              </p>
              <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                {(["walking", "cycling", "transit"] as TransportMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setTransportMode(m);
                      // Re-fetch active route with new mode
                      if (activePinId && routePanelListing) {
                        const pin = pins.find((p) => p.id === activePinId);
                        if (pin) {
                          fetchRoute(
                            routePanelListing.id,
                            routePanelListing.latitude,
                            routePanelListing.longitude,
                            pin,
                            m,
                          );
                        }
                      }
                    }}
                    className={`p-1.5 rounded-md transition-all ${
                      transportMode === m
                        ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-700 dark:text-zinc-200"
                        : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                    }`}
                    title={t(`mode_${m}`)}
                  >
                    <ModeIcon mode={m} size={14} />
                  </button>
                ))}
              </div>
              <button
                onClick={closeRoutePanel}
                className="p-1 text-zinc-300 hover:text-zinc-500 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4L12 12M12 4L4 12" />
                </svg>
              </button>
            </div>

            {/* Pin rows */}
            <div className="space-y-1">
              {pins.map((p) => {
                const cacheKey = routeCacheKey(routePanelListing.id, p.id, transportMode);
                const cached = routeCache[cacheKey];
                const isActive = route?.pinId === p.id && route?.listingId === routePanelListing.id;
                const isLoading = routeLoading === p.id;

                // If transit is slower than walking, show a hint instead
                const walkCacheKey = routeCacheKey(routePanelListing.id, p.id, "walking");
                const walkCached = routeCache[walkCacheKey];
                const transitSlowerThanWalk =
                  transportMode === "transit" &&
                  cached &&
                  walkCached &&
                  cached.duration >= walkCached.duration;

                return (
                  <button
                    key={p.id}
                    disabled={isLoading || transitSlowerThanWalk}
                    onClick={() =>
                      fetchRoute(
                        routePanelListing.id,
                        routePanelListing.latitude,
                        routePanelListing.longitude,
                        p,
                        transportMode,
                      )
                    }
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                      transitSlowerThanWalk
                        ? "opacity-50 border border-transparent"
                        : isActive
                          ? "bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-800"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent"
                    }`}
                  >
                    <span className="text-sage-600 text-xs flex-shrink-0">★</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-300 flex-1 truncate">
                      {p.name}
                    </span>
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                      {isLoading ? (
                        <span className="inline-block w-3 h-3 border-2 border-zinc-300 border-t-sage-500 rounded-full animate-spin" />
                      ) : transitSlowerThanWalk ? (
                        <span className="text-zinc-400">{t("fasterToWalk")}</span>
                      ) : cached ? (
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{ color: ROUTE_COLORS[transportMode] }}
                        >
                          {cached.transitLegs && cached.transitLegs.length > 0 && (
                            <TransitLegSequence legs={cached.transitLegs} />
                          )}
                          {formatDuration(cached.duration)}
                          <span className="text-zinc-300">·</span>
                          {formatDistance(cached.distance)}
                        </span>
                      ) : (
                        t("calculate")
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {geocoded.length < listings.length && (
        <p className="px-1 pt-1 text-[10px] text-zinc-300">
          {t("showingCount", {
            shown: geocoded.length,
            total: listings.length,
            missing: listings.length - geocoded.length,
          })}
        </p>
      )}
    </>
  );
}
