
import type { ScheduleInterval, UserProfile, ShowerOverride } from '../types'
 
// Base URL switches automatically between local dev and production.
// import.meta.env is Vite's way of reading environment variables.
// You'll add VITE_API_URL=https://your-railway-app.up.railway.app to a
// .env.local file for production. In dev, it falls back to localhost.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
 
// ── Token storage ─────────────────────────────────────────────────────────
export const tokenStorage = {
    get: () => localStorage.getItem('rinse_token'),
    set: (token: string) => localStorage.setItem('rinse_token', token),
    clear: () => localStorage.removeItem('rinse_token'),
}
 
// ── Base fetch helper ──────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
 
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
 
  return response.json() as Promise<T>
}
 
// ── Auth API calls ─────────────────────────────────────────────────────────
 
export const auth = {
  async register(username: string, password: string) {
    const data = await request<{ access_token: string; username: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    )
    if (data.access_token) tokenStorage.set(data.access_token)
    return data
  },
 
  async login(username: string, password: string) {
    const data = await request<{ access_token: string; username: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    )
    if (data.access_token) tokenStorage.set(data.access_token)
    return data
  },
 
  async logout() {
    await request('/auth/logout', { method: 'POST' })
    tokenStorage.clear()
  },
}
 
// ── Profile API calls ──────────────────────────────────────────────────────
 
export const profile = {
  async get(): Promise<UserProfile> {
    return request<UserProfile>('/profile')
  },
 
  async update(updates: { schedule_interval?: ScheduleInterval; shower_time?: string }) {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },
}
 
// ── Overrides API calls ────────────────────────────────────────────────────
export const overrides = {
  async getAll(): Promise<Record<string, boolean>> {
    return request<Record<string, boolean>>('/overrides')
  },
 
  async set(date: string, is_shower_day: boolean) {
    return request('/overrides', {
      method: 'POST',
      body: JSON.stringify({ date, is_shower_day }),
    })
  },
 
  async remove(date: string) {
    return request(`/overrides/${date}`, { method: 'DELETE' })
  },
}
 
// ── Shower log API calls ───────────────────────────────────────────────────
 
export const showerLog = {
  async logShower(duration_seconds?: number) {
    return request('/log', {
      method: 'POST',
      body: JSON.stringify({ duration_seconds }),
    })
  },
 
  async getHistory() {
    return request('/log')
  },
}