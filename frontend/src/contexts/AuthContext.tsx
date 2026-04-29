import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PreferredContact, Role, User } from "@/data/types";
import { usePlatformData } from "@/contexts/PlatformDataContext";
import { authApi, isMockMode, getAccessToken, clearAuthTokens, usersApi } from "@/api";

const STORAGE_KEY = "health-ai-current-user";

interface RegisterInput {
  fullName: string;
  email: string;
  role: Exclude<Role, "admin">;
  password?: string;
  honeypot?: string;
}

interface OnboardingInput {
  institution: string;
  city: string;
  country: string;
  bio: string;
  preferredContact: PreferredContact;
  interestTags?: string[];
  expertiseTags?: string[];
  portfolioSummary?: string;
  portfolioLinks?: string[];
}

interface LoginInput {
  email: string;
  password: string;
  honeypot?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (role: Role) => void;
  loginByEmail: (email: string) => boolean;
  loginAsUser: (userId: string) => void;
  loginWithCredentials: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User> | User;
  completeOnboarding: (input: OnboardingInput) => Promise<void> | void;
  updateCurrentUserProfile: (updates: Partial<User>) => Promise<void> | void;
  logout: () => void;
}

const emptyContext: AuthContextType = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  login: () => {},
  loginByEmail: () => false,
  loginAsUser: () => {},
  loginWithCredentials: async () => {
    throw new Error("loginWithCredentials called outside AuthProvider");
  },
  register: () => {
    throw new Error("register called outside AuthProvider");
  },
  completeOnboarding: () => {},
  updateCurrentUserProfile: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthContextType>(emptyContext);

const createUserId = () =>
  `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { users, addUser, updateUser, upsertUser } = usePlatformData();
  const realMode = !isMockMode();
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(STORAGE_KEY);
  });
  const [realCurrentUser, setRealCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(realMode && !!getAccessToken());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (currentUserId) {
      window.localStorage.setItem(STORAGE_KEY, currentUserId);
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [currentUserId]);

  // Real-mode: bootstrap currentUser from /api/auth/me when access token exists
  useEffect(() => {
    if (!realMode) return;
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authApi
      .fetchCurrentUser()
      .then((user) => {
        if (cancelled) return;
        upsertUser(user);
        setRealCurrentUser(user);
        setCurrentUserId(user.id);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthTokens();
        setRealCurrentUser(null);
        setCurrentUserId(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realMode]);

  const currentUser = useMemo(
    () =>
      realMode
        ? realCurrentUser
        : users.find((user) => user.id === currentUserId) ?? null,
    [realMode, realCurrentUser, currentUserId, users],
  );

  const login = (role: Role) => {
    if (realMode) return;
    const user = users.find((candidateUser) => candidateUser.role === role);
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loginByEmail = (email: string) => {
    if (realMode) return false;
    const user = users.find(
      (candidateUser) => candidateUser.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (!user) {
      return false;
    }

    setCurrentUserId(user.id);
    return true;
  };

  const loginAsUser = (userId: string) => {
    if (realMode) return;
    const user = users.find((candidateUser) => candidateUser.id === userId);
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loginWithCredentials = useCallback(
    async ({ email, password, honeypot }: LoginInput): Promise<User> => {
      if (!realMode) {
        const user = users.find(
          (candidateUser) => candidateUser.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!user) {
          throw new Error("Invalid credentials");
        }
        setCurrentUserId(user.id);
        return user;
      }
      const auth = await authApi.login({ email, password, honeypot });
      upsertUser(auth.user);
      setRealCurrentUser(auth.user);
      setCurrentUserId(auth.user.id);
      return auth.user;
    },
    [realMode, users, upsertUser],
  );

  const register = ({ fullName, email, role, password, honeypot }: RegisterInput) => {
    if (realMode) {
      if (!password) {
        throw new Error("Password is required in real-mode registration");
      }
      return authApi
        .register({ fullName, email, role, password, honeypot })
        .then(({ user }) => {
          upsertUser(user);
          return user;
        });
    }
    const user: User = {
      id: createUserId(),
      fullName,
      email,
      role,
      institution: "",
      city: "",
      country: "",
      expertiseTags: [],
      interestTags: [],
      profileCompleteness: 25,
      avatar: "",
      status: "active",
      onboardingCompleted: false,
      portfolioSummary: "",
      portfolioLinks: [],
      preferredContact: { method: "Email", value: email },
      notificationPreferences: { inApp: true, email: true },
      bio: "",
      createdAt: new Date().toISOString(),
      emailVerified: false,
      domainVerified: false,
    };

    addUser(user);
    setCurrentUserId(user.id);
    return user;
  };

  const completeOnboarding = (input: OnboardingInput) => {
    if (!currentUser || !currentUserId) return undefined;

    if (realMode) {
      return usersApi
        .completeOnboarding({
          institution: input.institution,
          city: input.city,
          country: input.country,
          bio: input.bio,
          preferredContact: input.preferredContact,
          interestTags: input.interestTags,
          expertiseTags: input.expertiseTags,
          portfolioSummary: input.portfolioSummary,
          portfolioLinks: input.portfolioLinks,
        })
        .then((user) => {
          upsertUser(user);
          setRealCurrentUser(user);
        });
    }

    updateUser(currentUserId, {
      institution: input.institution,
      city: input.city,
      country: input.country,
      bio: input.bio,
      preferredContact: input.preferredContact,
      interestTags: currentUser.role === "healthcare" ? input.interestTags ?? [] : [],
      expertiseTags:
        currentUser.role === "engineer"
          ? input.expertiseTags ?? currentUser.expertiseTags
          : currentUser.expertiseTags,
      portfolioSummary:
        currentUser.role === "engineer" ? input.portfolioSummary ?? "" : "",
      portfolioLinks: currentUser.role === "engineer" ? input.portfolioLinks ?? [] : [],
      onboardingCompleted: true,
    });
    return undefined;
  };

  const updateCurrentUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return undefined;
    if (realMode) {
      return usersApi.updateProfile(updates).then((user) => {
        upsertUser(user);
        setRealCurrentUser(user);
      });
    }
    if (currentUserId) {
      updateUser(currentUserId, updates);
    }
    return undefined;
  };

  const logout = () => {
    if (realMode) {
      authApi.logout().catch(() => {});
      clearAuthTokens();
      setRealCurrentUser(null);
    }
    setCurrentUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        loading,
        login,
        loginByEmail,
        loginAsUser,
        loginWithCredentials,
        register,
        completeOnboarding,
        updateCurrentUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
