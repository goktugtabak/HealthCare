import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PreferredContact, Role, User } from "@/data/types";
import { usePlatformData } from "@/contexts/PlatformDataContext";

const STORAGE_KEY = "health-ai-current-user";

interface RegisterInput {
  fullName: string;
  email: string;
  role: Exclude<Role, "admin">;
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

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  loginByEmail: (email: string) => boolean;
  loginAsUser: (userId: string) => void;
  register: (input: RegisterInput) => User;
  completeOnboarding: (input: OnboardingInput) => void;
  updateCurrentUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

const emptyContext: AuthContextType = {
  currentUser: null,
  isAuthenticated: false,
  login: () => {},
  loginByEmail: () => false,
  loginAsUser: () => {},
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
  const { users, addUser, updateUser } = usePlatformData();
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(STORAGE_KEY);
  });

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

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [currentUserId, users],
  );

  const login = (role: Role) => {
    const user = users.find((candidateUser) => candidateUser.role === role);
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loginByEmail = (email: string) => {
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
    const user = users.find((candidateUser) => candidateUser.id === userId);
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const register = ({ fullName, email, role }: RegisterInput) => {
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
    if (!currentUserId || !currentUser) {
      return;
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
  };

  const updateCurrentUserProfile = (updates: Partial<User>) => {
    if (!currentUserId) {
      return;
    }

    updateUser(currentUserId, updates);
  };

  const logout = () => setCurrentUserId(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        loginByEmail,
        loginAsUser,
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
