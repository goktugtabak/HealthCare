import api, { clearAuthTokens, getRefreshToken, setAuthTokens } from "./client";
import { normalizeUser } from "./transforms";
import type { Role, User } from "@/data/types";

export interface LoginPayload {
  email: string;
  password: string;
  honeypot?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<Role, "admin">;
  institution?: string;
  city?: string;
  country?: string;
  honeypot?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const normalizeAuthResponse = (data: {
  user: unknown;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}): AuthResponse => ({
  user: normalizeUser(data.user as Parameters<typeof normalizeUser>[0]),
  accessToken: (data.accessToken ?? data.token) as string,
  refreshToken: data.refreshToken,
});

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/login", payload);
  const auth = normalizeAuthResponse(data);
  setAuthTokens(auth.accessToken, auth.refreshToken);
  return auth;
};

export const register = async (payload: RegisterPayload): Promise<{ user: User }> => {
  const { firstName, lastName } = splitName(payload.fullName);
  const { data } = await api.post("/auth/register", {
    email: payload.email,
    password: payload.password,
    firstName,
    lastName,
    role: payload.role,
    institution: payload.institution,
    city: payload.city,
    country: payload.country,
    honeypot: payload.honeypot,
  });
  return { user: normalizeUser(data.user) };
};

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const { data } = await api.post("/auth/verify-email", { token });
  return data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await api.get("/auth/me");
  return normalizeUser(data.user ?? data);
};

export const logout = async (): Promise<void> => {
  // N6: send the device's own refreshToken so the backend revokes only
  // this Session row. Other devices' sessions stay alive.
  const refreshToken = getRefreshToken();
  try {
    await api.post("/auth/logout", refreshToken ? { refreshToken } : {});
  } finally {
    clearAuthTokens();
  }
};
