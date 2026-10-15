"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Map as MaplibreMap } from "maplibre-gl";
import "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { BASEMAP_STYLE_URL, brandStyle, type MapTheme } from "@/lib/map-style";

/**
 * Whether this browser can create a WebGL context, which MapLibre needs.
 * Fails on blocklisted GPUs, with WebGL disabled, and in GPU-less headless
 * Chrome (CI). The probe context is released immediately: browsers cap how
 * many can be alive at once.
 */
export function supportsWebGL(): boolean {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Vector basemap inside the Leaflet map: OpenFreeMap Positron rendered by
 * MapLibre GL (via the official Leaflet bridge), recolored to the Bolyst
 * palette once the style has loaded and again whenever the theme or language
 * changes. Markers, popups and route lines stay plain Leaflet layers on top.
 *
 * Only mount this when `supportsWebGL()` is true. If MapLibre still fails to
 * start, the layer is detached and `onUnavailable` is called so the parent can
 * switch to `FallbackBasemap`.
 */
export function BrandedBasemap({ onUnavailable }: { onUnavailable: () => void }) {
  const map = useMap();
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const theme: MapTheme = resolvedTheme === "dark" ? "dark" : "light";

  const glRef = useRef<MaplibreMap | null>(null);
  // Set from the one-shot `load` event. (`isStyleLoaded()` is no substitute:
  // it also reports false while tiles are still streaming in.)
  const [loadedMap, setLoadedMap] = useState<MaplibreMap | null>(null);

  const reportUnavailable = useEffectEvent(onUnavailable);

  useEffect(() => {
    const layer = L.maplibreGL({ style: BASEMAP_STYLE_URL });
    try {
      layer.addTo(map);
    } catch {
      // MapLibre threw inside the bridge's onAdd (no usable WebGL context),
      // after Leaflet had already registered the layer and its move/zoom
      // handlers. The bridge's onRemove assumes a live GL map, so hand it a
      // no-op one and let Leaflet unregister the layer normally.
      (layer as unknown as { _glMap?: { remove(): void } })._glMap = { remove() {} };
      map.removeLayer(layer);
      reportUnavailable();
      return;
    }
    const glMap = layer.getMaplibreMap();
    glRef.current = glMap;
    const onLoad = () => setLoadedMap(glMap);
    glMap.once("load", onLoad);
    return () => {
      glMap.off("load", onLoad);
      glRef.current = null;
      map.removeLayer(layer); // the bridge disposes the GL map and its WebGL context
    };
  }, [map]);

  useEffect(() => {
    if (!loadedMap || loadedMap !== glRef.current) return;
    brandStyle(loadedMap, locale, theme);
  }, [loadedMap, locale, theme]);

  return null;
}

/**
 * Raster stand-in for browsers without WebGL: OpenStreetMap's own tiles, which
 * need no API key and allow light use with attribution (CARTO's free tiles now
 * return an "API key required" placeholder). `.bmap-raster` in globals.css
 * mutes them toward the vector palette. Pair with `<CompactAttribution raster />`.
 */
export function FallbackBasemap() {
  return (
    <TileLayer
      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={19}
      className="bmap-raster"
    />
  );
}
