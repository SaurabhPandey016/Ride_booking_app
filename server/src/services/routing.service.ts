import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import type { Coordinates } from "../validators/maps.validator.js";

export type RouteResult = {
  distanceKm: number;
  durationMin: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

type OsrmResponse = {
  code?: unknown;
  routes?: Array<{
    distance?: unknown;
    duration?: unknown;
    geometry?: {
      type?: unknown;
      coordinates?: unknown;
    };
  }>;
};

const routeError = () => new AppError(502, "Route service is temporarily unavailable");

export const getRoute = async (pickup: Coordinates, drop: Coordinates): Promise<RouteResult> => {
  const coordinates = `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}`;
  const url = new URL(`/route/v1/driving/${coordinates}`, env.OSRM_BASE_URL);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw routeError();
  }

  if (!response.ok) {
    throw routeError();
  }

  let data: OsrmResponse;
  try {
    data = (await response.json()) as OsrmResponse;
  } catch {
    throw routeError();
  }

  const route = data.routes?.[0];
  const geometry = route?.geometry;
  if (
    data.code !== "Ok" ||
    typeof route?.distance !== "number" ||
    !Number.isFinite(route.distance) ||
    typeof route.duration !== "number" ||
    !Number.isFinite(route.duration) ||
    geometry?.type !== "LineString" ||
    !Array.isArray(geometry.coordinates)
  ) {
    throw routeError();
  }

  const routeCoordinates = geometry.coordinates.filter(
    (coordinate): coordinate is [number, number] =>
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      typeof coordinate[0] === "number" &&
      Number.isFinite(coordinate[0]) &&
      typeof coordinate[1] === "number" &&
      Number.isFinite(coordinate[1]),
  );

  if (routeCoordinates.length < 2) {
    throw routeError();
  }

  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.ceil(route.duration / 60),
    geometry: { type: "LineString", coordinates: routeCoordinates },
  };
};
