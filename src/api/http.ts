export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e: any) {
    const msg = `API indisponível em ${API_URL}. Verifique se o servidor está ativo.`;
    throw new Error(e?.message?.includes('Failed to fetch') ? msg : (e?.message || msg));
  }
}

export const api = {
  async register(name: string, email: string, password: string, accept_terms: boolean, policy_version?: string) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, accept_terms, policy_version }),
    });
  },
  async login(email: string, password: string) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async requestPasswordReset(email: string) {
    return request('/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(email: string, code: string, new_password: string) {
    return request('/auth/reset', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password }),
    });
  },
  async getWines() {
    return request('/wines');
  },
  async getWineSummary() {
    return request('/wines/summary');
  },
  async getWine(id: number) {
    return request(`/wines/${id}`);
  },
  async getMe() {
    return request('/auth/me');
  },
  async getAccount() {
    return request('/account');
  },
  async saveAccount(payload: any) {
    return request('/account', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async uploadImage(imageData: string) {
    return request('/upload', {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  },
  async ocr(imageData: string) {
    return request('/ocr', {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  },
  async getHarmonizations() {
    return request('/harmonizations');
  },
  async getGrapes() {
    return request('/grapes');
  },
  async getRegions(params?: { country?: string; country_id?: number }) {
    const q = new URLSearchParams();
    if (params?.country) q.set('country', String(params.country));
    if (params?.country_id) q.set('country_id', String(params.country_id));
    return request(`/regions?${q.toString()}`);
  },
  async getWineries(params?: { region_id?: number; region?: string; country?: string; country_id?: number }) {
    const q = new URLSearchParams();
    if (params?.region_id) q.set('region_id', String(params.region_id));
    if (params?.region) q.set('region', String(params.region));
    if (params?.country) q.set('country', String(params.country));
    if (params?.country_id) q.set('country_id', String(params.country_id));
    return request(`/wineries?${q.toString()}`);
  },
  async createWine(payload: any) {
    return request('/wines', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async updateWine(id: number, payload: any) {
    return request(`/wines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async deleteWine(id: number) {
    const headers = new Headers();
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${API_URL}/wines/${id}`, { method: 'DELETE', headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return { ok: true };
  },
  async toggleFavorite(id: number) {
    return request(`/wines/${id}/favorite`, { method: 'PATCH' });
  },
  async getTasteProfile() {
    return request('/taste-profile');
  },
  async saveTasteProfile(payload: any) {
    return request('/taste-profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async getRecommendations() {
    return request('/wines/recommendations');
  },
  async getPrivacyPolicy() {
    return request('/legal/privacy');
  },
  async deleteAccount() {
    return request('/account', { method: 'DELETE' });
  },
  async getUserLevel() {
    return request('/user/level');
  },
};
