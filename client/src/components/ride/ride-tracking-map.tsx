"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

export type RideMapPoint = { lat: number; lng: number };

type RideTrackingMapProps = {
  pickup: RideMapPoint;
  drop: RideMapPoint;
  geometry: [number, number][];
  driverLocation: RideMapPoint | null;
};

const pickupIcon = L.divIcon({
  className: "ridex-pickup-icon",
  html: '<span class="ridex-map-pickup-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const dropIcon = L.divIcon({
  className: "ridex-drop-icon",
  html: '<span class="ridex-map-drop-pin"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

const driverIcon = L.divIcon({
  className: "ridex-driver-icon",
  html: '<span class="ridex-map-driver-car"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 11.1 6.7 6.8A2.9 2.9 0 0 1 9.4 5h5.2a2.9 2.9 0 0 1 2.7 1.8l1.5 4.3A2.4 2.4 0 0 1 21 13.4v4.1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.1a2.4 2.4 0 0 1 2.2-2.3ZM7 10.8h10l-1.2-3.3a1.3 1.3 0 0 0-1.2-.8h-5a1.3 1.3 0 0 0-1.2.8L7 10.8Zm-.5 2.1a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm11 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"/></svg></span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

function BoundsController({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  const boundsKey = points.map((point) => point.toString()).join("|");

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [boundsKey, map, points]);

  return null;
}

function AnimatedDriverMarker({ target }: { target: RideMapPoint | null }) {
  const [position, setPosition] = useState<RideMapPoint | null>(target);
  const positionRef = useRef<RideMapPoint | null>(target);
  const targetLat = target?.lat;
  const targetLng = target?.lng;

  useEffect(() => {
    if (targetLat === undefined || targetLng === undefined) return;

    const start = positionRef.current ?? { lat: targetLat, lng: targetLng };
    const startedAt = performance.now();
    const duration = 1000;
    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress * (2 - progress);
      const next = {
        lat: start.lat + (targetLat - start.lat) * eased,
        lng: start.lng + (targetLng - start.lng) * eased,
      };
      positionRef.current = next;
      setPosition(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [targetLat, targetLng]);

  return position ? <Marker position={[position.lat, position.lng]} icon={driverIcon} /> : null;
}

export default function RideTrackingMap({
  pickup,
  drop,
  geometry,
  driverLocation,
}: RideTrackingMapProps) {
  const routePositions = useMemo(
    () => geometry.map(([lng, lat]) => [lat, lng] as [number, number]),
    [geometry],
  );
  const bounds = useMemo<LatLngExpression[]>(
    () => routePositions.length > 1
      ? routePositions
      : [[pickup.lat, pickup.lng], [drop.lat, drop.lng]],
    [drop.lat, drop.lng, pickup.lat, pickup.lng, routePositions],
  );

  return (
    <div className="h-full min-h-[340px] w-full overflow-hidden bg-zinc-900">
      <MapContainer
        center={[pickup.lat, pickup.lng]}
        zoom={12}
        scrollWheelZoom
        className="ridex-leaflet-map z-0 h-full w-full"
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <BoundsController points={bounds} />
        {routePositions.length > 1 && (
          <>
            <Polyline positions={routePositions} pathOptions={{ color: "#7f1d1d", weight: 12, opacity: 0.5, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={routePositions} pathOptions={{ color: "#ef4444", weight: 5, opacity: 0.98, lineCap: "round", lineJoin: "round" }} />
          </>
        )}
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
        <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />
        <AnimatedDriverMarker target={driverLocation} />
      </MapContainer>
    </div>
  );
}
