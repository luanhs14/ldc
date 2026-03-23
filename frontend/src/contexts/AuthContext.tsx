import { useCallback, useEffect, useState, type ReactNode } from 'react';
import api from '../services/api';
import { subscribeToUnauthorized } from '../services/authSession';
import { AuthContext, type User } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    api.get('/auth/me').then((res) => {
        setUser(res.data);
      }).catch(() => {
        logout();
      }).finally(() => {
        setIsLoading(false);
      });
  }, [logout]);

  useEffect(() => subscribeToUnauthorized(logout), [logout]);

  const login = async (usuario: string, senha: string) => {
    const res = await api.post('/auth/login', { usuario, senha });
    setUser(res.data.user);
    setIsLoading(false);
  };

  const handleLogout = useCallback(() => {
    void api.post('/auth/logout').catch(() => undefined);
    logout();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout: handleLogout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
