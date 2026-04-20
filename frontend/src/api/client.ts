import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const ACCESS_TOKEN_KEY = "health-ai-access-token";
export const REFRESH_TOKEN_KEY = "health-ai-refresh-token";

export const isMockMode = () =>
  (import.meta.env.VITE_USE_MOCK_DATA ?? "true").toString().toLowerCase() === "true";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const getAccessToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(REFRESH_TOKEN_KEY);

export const setAuthTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearAuthTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const nextAccess = (data?.accessToken ?? data?.token) as string | undefined;
    const nextRefresh = data?.refreshToken as string | undefined;
    if (!nextAccess) return null;
    setAuthTokens(nextAccess, nextRefresh);
    return nextAccess;
  } catch {
    clearAuthTokens();
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const nextToken = await refreshPromise;
      if (nextToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${nextToken}`;
        return api(original);
      }

      clearAuthTokens();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string; errors?: unknown } | undefined;
    return {
      status: error.response?.status ?? 0,
      message: data?.error ?? data?.message ?? error.message,
      details: data?.errors,
    };
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }
  return { status: 0, message: "Unknown error" };
};

export default api;
