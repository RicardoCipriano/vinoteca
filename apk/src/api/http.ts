import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = (() => {
  const local = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  return process.env.EXPO_PUBLIC_API_URL || local;
})();

async function getToken() {
  try {
    const t = await SecureStore.getItemAsync('token');
    return t || null;
  } catch {
    return null;
  }
}

export async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const token = await getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  async login(email: string, password: string) {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    await SecureStore.setItemAsync('token', data.token);
    return data;
  },
  async getWines() { return request('/wines'); },
  async getWine(id: number) { return request(`/wines/${id}`); },
  async createWine(payload: any) { return request('/wines', { method: 'POST', body: JSON.stringify(payload) }); },
  async updateWine(id: number, payload: any) { return request(`/wines/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  async getMe() { return request('/auth/me'); },
  async requestPasswordReset(email: string) { return request('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }); },
  async resetPassword(email: string, code: string, new_password: string) {
    return request('/auth/reset', { method: 'POST', body: JSON.stringify({ email, code, new_password }) });
  },
};