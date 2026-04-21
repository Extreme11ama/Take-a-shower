// lib/api.ts
//
// All your fetch() calls live here in one file. This is called an "API client"
// layer, and it's a really important pattern to learn.
//
// WHY do this instead of writing fetch() directly in components?
//
// 1. ONE place to change the base URL (dev vs production)
// 2. ONE place to add the auth token to every request — you don't repeat
//    that logic in every component
// 3. If the API changes, you fix it here, not in 10 different files
// 4. Your components stay clean — they just call api.getProfile() and
//    don't need to know anything about HTTP
 
import type { ScheduleInterval, UserProfile, ShowerOverride } from '../types'
 
// Base URL switches automatically between local dev and production.
// import.meta.env is Vite's way of reading environment variables.
// You'll add VITE_API_URL=https://your-railway-app.up.railway.app to a
// .env.local file for production. In dev, it falls back to localhost.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
 
// ── Token storage ─────────────────────────────────────────────────────────
// After login, we store the JWT token in localStorage so it survives a
// page refresh. localStorage is a simple key-value store built into every
// browser. The token is what proves to the backend that you're logged in.
 
export const tokenStorage = {
    get: () => localStorage.getItem('rinse_token'),
    set: (token: string) => localStorage.setItem('rinse_token', token),
    clear: () => localStorage.removeItem('rinse_token'),
}
 
// ── Base fetch helper ──────────────────────────────────────────────────────
// This is a wrapper around the native fetch() that:
//   - Prepends the base URL
//   - Automatically adds the auth token header
//   - Automatically parses JSON
//   - Throws a real Error on non-2xx responses (fetch doesn't do this by default!)
//
// Every other function below calls this instead of fetch() directly.
 
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
 
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // Only add the Authorization header if we actually have a token
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Spread any extra headers the caller passed in (they override the above)
      ...options.headers,
    },
  })
 
  // fetch() only rejects on network failure (no internet, server down), NOT
  // on 4xx/5xx responses. So we check response.ok manually and throw ourselves.
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
    // Store the token immediately so subsequent calls are authenticated
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
  // Returns a plain object like { "2025-04-17": true, "2025-04-19": false }
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