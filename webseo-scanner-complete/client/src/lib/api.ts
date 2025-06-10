export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface ApiError {
  error: string;
  message?: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
      message: response.statusText,
    }));
    throw new Error(errorData.message || errorData.error);
  }

  return response.json();
}

export const auditAPI = {
  startAudit: (url: string) =>
    apiRequest('/api/audit', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  getSpeed: (url: string) =>
    apiRequest(`/api/speed?url=${encodeURIComponent(url)}`),

  getMeta: (url: string) =>
    apiRequest(`/api/meta?url=${encodeURIComponent(url)}`),

  getLinks: (url: string) =>
    apiRequest(`/api/links?url=${encodeURIComponent(url)}`),

  getRobots: (url: string) =>
    apiRequest(`/api/robots?url=${encodeURIComponent(url)}`),

  getHeaders: (url: string) =>
    apiRequest(`/api/headers?url=${encodeURIComponent(url)}`),

  getHealth: () =>
    apiRequest('/api/health'),
};
