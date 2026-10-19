import axios, { AxiosError } from "axios";

export type ApiError = Error & {
  statusCode?: number;
  details?: unknown;
};

type ApiErrorBody = {
  message?: string;
  errors?: unknown;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
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
