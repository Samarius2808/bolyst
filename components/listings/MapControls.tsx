"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type L from "leaflet";
import { useTranslations } from "next-intl";

// Map chrome rendered as React overlays inside the `.bmap` frame (outside the
// Leaflet container, like the pin nudge and the route panel), so clicks never
// reach Leaflet's drag/zoom handlers. Leaflet's own controls stay disabled.

const noop = () => {};

/** Zoom buttons, top-right. Disabled at the map's zoom limits. */
export function ZoomControl({ map }: { map: L.Map | null }) {
  const t = useTranslations("map");
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!map) return noop;
      map.on("zoomend zoomlevelschange", onChange);
      return () => {
        map.off("zoomend zoomlevelschange", onChange);
      };
    },
    [map],
  );
  const zoom = useSyncExternalStore(
    subscribe,
    () => map?.getZoom() ?? 0,
    () => 0,
  );
  const canZoomIn = !!map && zoom < map.getMaxZoom();
  const canZoomOut = !!map && zoom > map.getMinZoom();

  const button =
    "flex h-9 w-9 items-center justify-center text-zinc-600 transition-colors hover:bg-sage-100 hover:text-sage-700 focus-visible:bg-sage-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35 pointer-coarse:h-10 pointer-coarse:w-10 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-sage-400 dark:focus-visible:bg-zinc-800";

  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        aria-label={t("zoomIn")}
        title={t("zoomIn")}
        disabled={!canZoomIn}
        onClick={() => map?.zoomIn()}
        className={button}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M7 1.5v11M1.5 7h11" />
        </svg>
      </button>
      <div className="mx-2 h-px bg-zinc-100 dark:bg-zinc-800" />
      <button
        type="button"
        aria-label={t("zoomOut")}
        title={t("zoomOut")}
        disabled={!canZoomOut}
        onClick={() => map?.zoomOut()}
        className={button}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M1.5 7h11" />
        </svg>
      </button>
    </div>
  );
}

const CREDITS = [
  { label: "© OpenStreetMap", href: "https://www.openstreetmap.org/copyright" },
  { label: "OpenMapTiles", href: "https://openmaptiles.org/" },
  { label: "OpenFreeMap", href: "https://openfreemap.org/" },
];

// Credits for the raster fallback basemap (no WebGL): tiles served by OSM itself.
const RASTER_CREDITS = [
  { label: "© OpenStreetMap contributors", href: "https://www.openstreetmap.org/copyright" },
];

/**
 * Compact attribution, bottom-left: a small ⓘ disc that expands into a pill
 * with the required OSM / OpenMapTiles / OpenFreeMap credit on hover, focus or
 * tap — the same pattern as MapLibre's compact control on the LevelUp map.
 */
export function CompactAttribution({ raster = false }: { raster?: boolean }) {
  const t = useTranslations("map");
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`group absolute bottom-2 left-2 z-[1000] flex h-6 items-center rounded-full border border-zinc-100 bg-white/85 text-[10px] leading-none text-zinc-500 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/85 dark:text-zinc-400 ${
        open ? "pr-2.5" : "hover:pr-2.5 focus-within:pr-2.5"
      }`}
    >
      <button
        type="button"
        aria-label={t("credits")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-700 focus-visible:text-sage-600 focus-visible:outline-none dark:hover:text-zinc-200"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="5" />
          <path d="M6 5.5v3M6 3.6v.01" />
        </svg>
      </button>
      <span
        className={`whitespace-nowrap pl-0.5 ${
          open ? "" : "hidden group-hover:inline group-focus-within:inline"
        }`}
      >
        {(raster ? RASTER_CREDITS : CREDITS).map((c, i) => (
          <span key={c.href}>
            {i > 0 && " · "}
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:text-zinc-800 hover:underline dark:hover:text-zinc-100"
            >
              {c.label}
            </a>
          </span>
        ))}
      </span>
    </div>
  );
}
