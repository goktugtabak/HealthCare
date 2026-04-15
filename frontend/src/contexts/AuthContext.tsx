import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, Role } from '@/data/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (role: Role) => void;
  loginAsUser: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  login: () => {},
  loginAsUser: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = useCallback((role: Role) => {
    const user = mockUsers.find(u => u.role === role);
    if (user) setCurrentUser(user);
  }, []);

  const loginAsUser = useCallback((userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, loginAsUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
