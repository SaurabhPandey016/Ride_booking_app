import axios, { AxiosError } from "axios";

export type ApiError = Error & {
  statusCode?: number;
  details?: unknown;
};

type ApiErrorBody = {
  message?: string;
  errors?: unknown;
};

const normalizeConfiguredUrl = (
  name: string,
  value: string,
  expectedPath: string,
): string => {
  const normalized = value.trim().replace(/\/+$/, "");
  if (normalized.includes(",")) {
    throw new Error(`${name} must contain one URL only; do not separate environments with commas.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${name} must be a valid absolute HTTP or HTTPS URL.`);
  }

  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.pathname.replace(/\/+$/, "") !== expectedPath ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${name} must use HTTP(S) and end with ${expectedPath} without a query or fragment.`);
  }

  return normalized;
};

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const resolvedApiUrl = configuredApiUrl
  ? normalizeConfiguredUrl("NEXT_PUBLIC_API_URL", configuredApiUrl, "/api")
  : process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : undefined;

if (!resolvedApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be configured for production builds.");
}

export const apiBaseUrl: string = resolvedApiUrl;

if (process.env.VERCEL === "1" && !apiBaseUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_API_URL must use HTTPS for Vercel deployments.");
}

const configuredSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
export const socketBaseUrl = configuredSocketUrl
  ? normalizeConfiguredUrl("NEXT_PUBLIC_SOCKET_URL", configuredSocketUrl, "")
  : new URL(apiBaseUrl).origin;

if (process.env.VERCEL === "1" && !socketBaseUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_SOCKET_URL must use HTTPS for Vercel deployments.");
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const normalized = new Error(
      error.response?.data?.message ??
        (error.code === "ERR_NETWORK"
          ? "Unable to reach RideX. Check your connection and try again."
          : "The request could not be completed."),
    ) as ApiError;
    normalized.statusCode = error.response?.status;
    normalized.details = error.response?.data?.errors;
    return normalized;
  }

  if (error instanceof Error) {
    return error as ApiError;
  }

  return new Error("An unexpected error occurred.") as ApiError;
};

export const getApiErrorStatus = (error: unknown): number | undefined =>
  error instanceof AxiosError ? error.response?.status : undefined;
