export interface ProfileSnapshotResponse {
  nickname: string;
  coins: number;
  upgrades: Record<string, number>;
  stats: Record<string, number>;
  updatedAt?: string | null;
}

export interface AuthResponse {
  token: string;
  nickname: string;
  profile: ProfileSnapshotResponse;
}

export interface SyncPayload {
  coins: number;
  upgrades: Record<string, number>;
  stats: Record<string, number>;
}

export interface LeaderboardEntryResponse {
  nickname: string;
  coins: number;
  updatedAt?: string | null;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntryResponse[];
}

const DEFAULT_BASE_URL = 'http://localhost:5000/api';
const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;
const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, '');

function buildUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(buildUrl(path), { ...options, headers });
  const data = await parseJson<T>(response);

  if (!response.ok) {
    const message = (data as Record<string, unknown> | null)?.message;
    throw new Error(message && typeof message === 'string' ? message : `Запрос к API завершился ошибкой ${response.status}`);
  }

  if (!data) {
    throw new Error('Ответ API не содержит данных.');
  }

  return data;
}

export function registerRequest(payload: { nickname: string; password: string }): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginRequest(payload: { nickname: string; password: string }): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function profileRequest(token: string): Promise<ProfileSnapshotResponse> {
  return apiRequest<ProfileSnapshotResponse>('/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function syncRequest(token: string, payload: SyncPayload): Promise<ProfileSnapshotResponse> {
  return apiRequest<ProfileSnapshotResponse>('/sync', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function leaderboardRequest(token: string, limit: number = 25): Promise<LeaderboardResponse> {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const params = new URLSearchParams({ limit: String(safeLimit) });
  return apiRequest<LeaderboardResponse>(`/leaderboard?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
};
