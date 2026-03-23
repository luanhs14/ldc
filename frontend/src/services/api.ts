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
