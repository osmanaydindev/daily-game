import axios, { type AxiosInstance, type AxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // needed to send httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

// On 401, try to refresh once then retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = api
          .post<{ data: { accessToken: string } }>('/auth/refresh')
          .then((res) => {
            const newToken = res.data.data?.accessToken ?? null;
            setAccessToken(newToken);
            return newToken;
          })
          .catch(() => {
            setAccessToken(null);
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);
