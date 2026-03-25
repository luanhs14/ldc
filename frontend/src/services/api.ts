import axios from 'axios';
import { notifyUnauthorized } from './authSession';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');

    if (error.response?.status === 401 && !requestUrl.includes('/auth/login')) {
      notifyUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;

/** Extrai a mensagem de erro da resposta da API e loga o erro no console. */
export function apiErro(err: unknown, fallback: string): string {
  console.error(err)
  return (err as any)?.response?.data?.error || fallback
}
