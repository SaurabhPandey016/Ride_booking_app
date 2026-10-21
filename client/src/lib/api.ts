import axios, { AxiosError } from "axios";

export type ApiError = Error & {
  statusCode?: number;
  details?: unknown;
};

type ApiErrorBody = {
  message?: string;
  errors?: unknown;
};

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || undefined;
const resolvedApiUrl =
  configuredApiUrl ??
  (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : undefined);

if (!resolvedApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be configured for production builds.");
}

export const apiBaseUrl: string = resolvedApiUrl;

if (process.env.VERCEL === "1" && !apiBaseUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_API_URL must use HTTPS for Vercel deployments.");
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
