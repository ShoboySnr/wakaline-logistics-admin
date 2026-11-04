"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/src/helpers/googleMaps";
import { RouteStop } from "@/src/types";

interface RouteMapProps {
  stops: RouteStop[];
  start: { lat: number; lng: number; label: string } | null;
  riderLocation?: { lat: number; lng: number } | null;
  className?: string;
}

const PRIMARY = "#c1666b";

export default function RouteMap({ stops, start, riderLocation, className }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(containerRef.current, {
            center: { lat: 6.5244, lng: 3.3792 },
            zoom: 11,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "greedy",
          });
        }
        draw();
      })
      .catch((e) => !cancelled && setError(e.message === "no key" ? "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map." : "Map could not be loaded."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, start, riderLocation]);

  const draw = () => {
    const g = window.google.maps;
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
    const bounds = new g.LatLngBounds();

    const path: { lat: number; lng: number }[] = [];
    const live = riderLocation ?? start;
    if (live) {
      path.push({ lat: live.lat, lng: live.lng });
      const marker = new g.Marker({
        position: { lat: live.lat, lng: live.lng },
        map: mapRef.current,
        title: "Rider location",
        zIndex: 999,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
      overlaysRef.current.push(marker);
      bounds.extend(marker.getPosition());
    }

    stops.forEach((stop) => {
      path.push({ lat: stop.lat, lng: stop.lng });
      const marker = new g.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: mapRef.current,
        label: { text: String(stop.seq), color: "#ffffff", fontSize: "12px", fontWeight: "700" },
        title: `${stop.seq}. ${stop.type === "pickup" ? "Pickup" : "Drop-off"} · ${stop.order_number}`,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: stop.type === "pickup" ? "#6b7280" : PRIMARY,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      overlaysRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    if (path.length > 1) {
      const line = new g.Polyline({
        path,
        map: mapRef.current,
        strokeColor: PRIMARY,
        strokeOpacity: 0.7,
        strokeWeight: 3,
      });
      overlaysRef.current.push(line);
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 48);
      if (stops.length <= 1) mapRef.current.setZoom(Math.min(mapRef.current.getZoom(), 14));
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-6 text-center text-sm text-gray-500 dark:text-gray-400 ${className ?? ""}`}>
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className={`rounded-2xl overflow-hidden ${className ?? ""}`} />;
}
