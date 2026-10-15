"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Map as MaplibreMap } from "maplibre-gl";
import "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { BASEMAP_STYLE_URL, brandStyle, type MapTheme } from "@/lib/map-style";

/**
 * Vector basemap inside the Leaflet map: OpenFreeMap Positron rendered by
 * MapLibre GL (via the official Leaflet bridge), recolored to the Bolyst
 * palette once the style has loaded and again whenever the theme or language
 * changes. Markers, popups and route lines stay plain Leaflet layers on top.
 */
export function BrandedBasemap() {
  const map = useMap();
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const theme: MapTheme = resolvedTheme === "dark" ? "dark" : "light";

  const glRef = useRef<MaplibreMap | null>(null);
  // Set from the one-shot `load` event. (`isStyleLoaded()` is no substitute:
  // it also reports false while tiles are still streaming in.)
  const [loadedMap, setLoadedMap] = useState<MaplibreMap | null>(null);

  useEffect(() => {
    const layer = L.maplibreGL({ style: BASEMAP_STYLE_URL });
    layer.addTo(map);
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
