"use client";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { LocateFixed, MapPin, MousePointer2 } from "lucide-react";
import type { Place } from "@/types/maps";

type RideMapProps = {
  pickup: Place | null;
  drop: Place | null;
  geometry: [number, number][] | null;
  target: "pickup" | "drop";
  onTargetChange: (target: "pickup" | "drop") => void;
  onMapSelect: (lat: number, lng: number) => void;
  onUseMyLocation: () => void;
  locationLoading: boolean;
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

export const driverIcon = L.divIcon({
  className: "ridex-driver-icon",
  html: '<span class="ridex-map-driver-car" aria-label="Driver location"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 11.1 6.7 6.8A2.9 2.9 0 0 1 9.4 5h5.2a2.9 2.9 0 0 1 2.7 1.8l1.5 4.3A2.4 2.4 0 0 1 21 13.4v4.1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4.1a2.4 2.4 0 0 1 2.2-2.3ZM7 10.8h10l-1.2-3.3a1.3 1.3 0 0 0-1.2-.8h-5a1.3 1.3 0 0 0-1.2.8L7 10.8Zm-.5 2.1a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm11 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"/></svg></span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const defaultCenter: LatLngExpression = [23.8388, 78.7378];

function MapClickHandler({ onMapSelect }: { onMapSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onMapSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RouteBounds({
  pickup,
  drop,
  geometry,
}: {
  pickup: Place | null;
  drop: Place | null;
  geometry: [number, number][] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (geometry?.length) {
      map.fitBounds(L.latLngBounds(geometry.map(([lng, lat]) => [lat, lng])), {
        padding: [48, 48],
        maxZoom: 15,
      });
      return;
    }

    if (pickup && drop) {
      map.fitBounds(
        [
          [pickup.lat, pickup.lng],
          [drop.lat, drop.lng],
        ],
        { padding: [56, 56], maxZoom: 14 },
      );
      return;
    }

    const location = pickup ?? drop;
    if (location) {
      map.setView([location.lat, location.lng], 14, { animate: true });
    }
  }, [drop, geometry, map, pickup]);

  return null;
}

export default function RideMap({
  pickup,
  drop,
  geometry,
  target,
  onTargetChange,
  onMapSelect,
  onUseMyLocation,
  locationLoading,
}: RideMapProps) {
  const routePositions = geometry?.map(([lng, lat]) => [lat, lng] as [number, number]);

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden bg-zinc-900">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom
        className="ridex-leaflet-map z-0 h-full w-full"
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapClickHandler onMapSelect={onMapSelect} />
        <RouteBounds pickup={pickup} drop={drop} geometry={geometry} />
        {routePositions && (
          <>
            <Polyline
              positions={routePositions}
              pathOptions={{ color: "#7f1d1d", weight: 12, opacity: 0.5, lineCap: "round", lineJoin: "round" }}
            />
            <Polyline
              positions={routePositions}
              pathOptions={{ color: "#ef4444", weight: 5, opacity: 0.98, lineCap: "round", lineJoin: "round" }}
            />
          </>
        )}
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} bubblingMouseEvents={false} />}
        {drop && <Marker position={[drop.lat, drop.lng]} icon={dropIcon} bubblingMouseEvents={false} />}
      </MapContainer>

      <div className="absolute left-3 right-3 top-3 z-[400] flex flex-wrap items-center justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
        <div className="inline-flex rounded-xl border border-white/10 bg-zinc-950/85 p-1 shadow-lg backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onTargetChange("pickup")}
            aria-pressed={target === "pickup"}
            className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition ${target === "pickup" ? "bg-emerald-500/15 text-emerald-200" : "text-zinc-400 hover:text-white"}`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Pickup
          </button>
          <button
            type="button"
            onClick={() => onTargetChange("drop")}
            aria-pressed={target === "drop"}
            className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition ${target === "drop" ? "bg-red-500/15 text-red-200" : "text-zinc-400 hover:text-white"}`}
          >
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> Drop-off
          </button>
        </div>
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={locationLoading}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/85 px-3.5 text-xs font-semibold text-zinc-100 shadow-lg backdrop-blur-xl transition hover:border-red-400/40 hover:bg-zinc-900 disabled:cursor-wait disabled:opacity-70"
        >
          {locationLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <LocateFixed aria-hidden="true" className="h-4 w-4 text-red-300" />
          )}
          Use my location
        </button>
      </div>

      {!pickup && !drop && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[400] flex justify-center px-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/80 px-3 py-2 text-[11px] text-zinc-300 shadow-xl backdrop-blur-xl">
            <MousePointer2 aria-hidden="true" className="h-3.5 w-3.5 text-red-300" />
            Search a place or click the map to set {target === "pickup" ? "pickup" : "drop-off"}
          </div>
        </div>
      )}
    </div>
  );
}
