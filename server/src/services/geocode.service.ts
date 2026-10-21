import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export type Place = {
  label: string;
  lat: number;
  lng: number;
};

type NominatimResult = {
  display_name?: unknown;
  lat?: unknown;
  lon?: unknown;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const MIN_REQUEST_INTERVAL_MS = 1000;
const cache = new Map<string, CacheEntry<Place | Place[]>>();
let requestQueue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

const getCached = <T extends Place | Place[]>(key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.value as T;
};

const setCached = <T extends Place | Place[]>(key: string, value: T): void => {
  const now = Date.now();
  for (const [cachedKey, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(cachedKey);
    }
  }

  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const requestNominatim = (url: URL): Promise<Response> => {
  const request = requestQueue.then(async () => {
    const delay = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (delay > 0) {
      await wait(delay);
    }

    lastRequestAt = Date.now();

    try {
      return await fetch(url, {
        headers: {
          "User-Agent": env.NOMINATIM_USER_AGENT,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      console.error("Nominatim request failed before receiving a response");
      throw new AppError(502, "Location search is temporarily unavailable");
    }
  });

  requestQueue = request.then(
    () => undefined,
    () => undefined,
  );

  return request;
};

const readPlace = (result: NominatimResult): Place | undefined => {
  const lat = typeof result.lat === "string" ? Number(result.lat) : NaN;
  const lng = typeof result.lon === "string" ? Number(result.lon) : NaN;
  if (
    typeof result.display_name !== "string" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return undefined;
  }

  return { label: result.display_name, lat, lng };
};

const fetchNominatim = async (url: URL): Promise<unknown> => {
  const response = await requestNominatim(url);
  if (!response.ok) {
    console.error("Nominatim returned an unsuccessful response", {
      status: response.status,
    });
    if (response.status === 429 || response.status === 503) {
      throw new AppError(503, "Location search is busy. Please wait a moment and try again.");
    }
    throw new AppError(502, "Location search is temporarily unavailable");
  }

  try {
    return await response.json();
  } catch {
    throw new AppError(502, "Location search returned an invalid response");
  }
};

export const search = async (query: string): Promise<Place[]> => {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `search:${normalizedQuery}`;
  const cached = getCached<Place[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL("/search", env.NOMINATIM_BASE_URL);
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "1");
  if (env.NOMINATIM_COUNTRYCODES?.trim()) {
    url.searchParams.set("countrycodes", env.NOMINATIM_COUNTRYCODES.trim());
  }

  const data = await fetchNominatim(url);
  if (!Array.isArray(data)) {
    throw new AppError(502, "Location search returned an invalid response");
  }

  const places = data
    .map((entry) => readPlace(entry as NominatimResult))
    .filter((place): place is Place => place !== undefined);
  setCached(cacheKey, places);
  return places;
};

export const reverse = async (lat: number, lng: number): Promise<Place> => {
  const cacheKey = `reverse:${lat}:${lng}`;
  const cached = getCached<Place>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL("/reverse", env.NOMINATIM_BASE_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  const data = await fetchNominatim(url);
  if (typeof data !== "object" || data === null) {
    throw new AppError(404, "No address was found for these coordinates");
  }

  const place = readPlace(data as NominatimResult);
  if (!place) {
    throw new AppError(404, "No address was found for these coordinates");
  }

  setCached(cacheKey, place);
  return place;
};
