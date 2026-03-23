import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  nome: string;
  usuario: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function parseUserFromStorage(): User | null {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(parseUserFromStorage);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
  };

  useEffect(() => {
    if (token) {
      api.get('/auth/me').then((res) => {
        setUser(res.data);
      }).catch(() => {
        logout();
      });
    }
  }, [token]);

  const login = async (usuario: string, senha: string) => {
    const res = await api.post('/auth/login', { usuario, senha });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
