const API_HOST_FALLBACK = "https://campusride-backend.onrender.com";

const normalizeBaseUrl = (value?: string) => (value || "").trim().replace(/\/$/, "");

const socketBaseFromApiBase = (apiBase: string) => apiBase.replace(/\/api\/?$/, "");

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || `${API_HOST_FALLBACK}/api`,
);

export const SOCKET_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_SOCKET_BASE_URL || socketBaseFromApiBase(API_BASE_URL),
);
