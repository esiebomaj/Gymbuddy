import {API_BASE_URL} from '@env';

// ── Response types ───────────────────────────────────────────────────────────

export interface SettingsResponse {
  weekly_goal: number;
  gym_days: number[];
  lock_start_time: string;
  lock_end_time: string;
}

export interface SettingsUpdate {
  weekly_goal?: number;
  gym_days?: number[];
  lock_start_time?: string;
  lock_end_time?: string;
}

export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  last_completed_week: string | null;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  photo_url: string | null;
  settings: SettingsResponse;
  streak: StreakResponse;
}

export interface VisitResponse {
  id: string;
  visit_date: string;
  workout_type: string;
  note: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface StatsResponse {
  weekly_visits: number;
  matching_weekly_visits: number;
  weekly_goal: number;
  current_streak: number;
  longest_streak: number;
  total_visits: number;
  visited_today: boolean;
  visit_dates_this_week: string[];
  matching_visit_dates_this_week: string[];
}

// ── API error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...headers(token),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? `Request failed (${res.status})`);
  }

  return res.json();
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export function fetchMe(token: string): Promise<MeResponse> {
  return request('/api/auth/me', token);
}

export function fetchSettings(token: string): Promise<SettingsResponse> {
  return request('/api/settings', token);
}

export function updateSettings(token: string, data: SettingsUpdate): Promise<SettingsResponse> {
  return request('/api/settings', token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function fetchStats(token: string): Promise<StatsResponse> {
  return request('/api/stats', token);
}

export async function submitVisit(
  token: string,
  workoutType: string,
  note?: string,
  photoUri?: string,
): Promise<VisitResponse> {
  const form = new FormData();
  form.append('workout_type', workoutType);
  if (note) {
    form.append('note', note);
  }
  if (photoUri) {
    const filename = photoUri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      ext === 'heic' ? 'image/heic' :
      'image/jpeg';
    form.append('photo', {
      uri: photoUri,
      name: filename,
      type: mimeType,
    } as any);
  }

  const res = await fetch(`${API_BASE_URL}/api/visits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? `Request failed (${res.status})`);
  }

  return res.json();
}
