import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  authService,
  UserProfile,
  LoginCredentials,
  RegisterData,
} from '../services/auth.service';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session by verifying HTTP-only cookie with /api/auth/me
  const checkAuth = useCallback(async () => {
    try {
      const userProfile = await authService.getMe();
      setUser(userProfile);
    } catch {
      // 401 or network error -> unauthenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    await authService.login(credentials);
    // After login cookie is set, fetch full profile (with businessProfile)
    const profile = await authService.getMe();
    setUser(profile);
  };

  const register = async (data: RegisterData): Promise<void> => {
    await authService.register(data);
    // After register cookie is set, fetch full profile
    const profile = await authService.getMe();
    setUser(profile);
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    const profile = await authService.getMe();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

