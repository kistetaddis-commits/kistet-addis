import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { User } from '../types';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  ensureAuthenticatedUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const refreshProfile = useCallback(async () => {
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      console.error('[AuthContext] Refresh failed:', error);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem('kistet_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      console.error('[AuthContext] Session invalid:', error);
      localStorage.removeItem('kistet_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    initializeAuth();
  }, [initializeAuth]);

  const signOut = async () => {
    localStorage.removeItem('kistet_token');
    setUser(null);
    toast.info('Signed out successfully');
  };

  const ensureAuthenticatedUser = async (): Promise<User | null> => {
    if (!isLoading) return user;
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = () => {
        if (!isLoading || Date.now() - startTime > 3000) {
          resolve(user);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, signOut, refreshProfile, ensureAuthenticatedUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};