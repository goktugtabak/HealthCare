import api, { clearAuthTokens, setAuthTokens } from "./client";
import type { Role, User } from "@/data/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<Role, "admin">;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

const normalizeAuthResponse = (data: {
  user: User;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}): AuthResponse => ({
  user: data.user,
  accessToken: (data.accessToken ?? data.token) as string,
  refreshToken: data.refreshToken,
});

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/login", payload);
  const auth = normalizeAuthResponse(data);
  setAuthTokens(auth.accessToken, auth.refreshToken);
  return auth;
};

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post("/auth/register", payload);
  const auth = normalizeAuthResponse(data);
  if (auth.accessToken) {
    setAuthTokens(auth.accessToken, auth.refreshToken);
  }
  return auth;
};

export const verifyEmail = async (token: string): Promise<{ user: User }> => {
  const { data } = await api.post("/auth/verify-email", { token });
  return data;
};

export const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await api.get("/auth/me");
  return data.user ?? data;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post("/auth/logout");
  } finally {
    clearAuthTokens();
  }
};
