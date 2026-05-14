'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export type UserRole = 'admin' | 'accounts' | 'support' | 'sales' | 'user';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  status: 'active' | 'inactive' | 'suspended';
}

/**
 * API login response
 */
type AuthData = {
  user: User;
  token: string;
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (data: AuthData) => void;
  logout: () => void;

  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Safe localStorage helpers (fixes TS + SSR issues)
 */
const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Hydrate auth state
   */
  useEffect(() => {
    const storedUser = storage.get('user');
    const storedToken = storage.get('token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        storage.remove('user');
        storage.remove('token');
      }
    }

    setIsLoading(false);
  }, []);

  /**
   * LOGIN (FIXED: accepts {user, token})
   */
  const login = (data: AuthData) => {
    setUser(data.user);
    setToken(data.token);

    storage.set('user', JSON.stringify(data.user));
    storage.set('token', data.token);
  };

  /**
   * LOGOUT
   */
  const logout = () => {
    setUser(null);
    setToken(null);

    storage.remove('user');
    storage.remove('token');
  };

  /**
   * ROLE CHECKS
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.some((r) => user.roles.includes(r));
    }

    return user.roles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.some((r) => user.roles.includes(r));
  };

  const isAdmin = user?.roles.includes('admin') ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        hasAnyRole,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;