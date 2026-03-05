const LOCATION_FALLBACK = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.hostname}`
  : "http://localhost";

const API_HOST_FALLBACK = `${LOCATION_FALLBACK}:4000`;

const normalizeBaseUrl = (value?: string) => (value || "").trim().replace(/\/$/, "");

const socketBaseFromApiBase = (apiBase: string) => apiBase.replace(/\/api\/?$/, "");

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || `${API_HOST_FALLBACK}/api`,
);

export const SOCKET_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_SOCKET_BASE_URL || socketBaseFromApiBase(API_BASE_URL),
);
