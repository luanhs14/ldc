import { createContext } from 'react';

export interface User {
  id: string;
  nome: string;
  usuario: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
