import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => void;
  ensureAuthenticatedUser: () => Promise<User | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data);
    } catch (err) {
      setUser(null);
      localStorage.removeItem('kistet_auth_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const token = localStorage.getItem('kistet_auth_token');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const signOut = () => {
    api.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const ensureAuthenticatedUser = async (): Promise<User | null> => {
    if (!isLoading) return user;
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = () => {
        if (!isLoading || Date.now() - startTime > 5000) {
          resolve(user);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, signOut, ensureAuthenticatedUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};