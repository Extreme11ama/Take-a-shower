// lib/utils.ts
// These are small "pure" helper functions — they take inputs and return outputs
// with no side effects. Keeping them here means you can reuse them anywhere
// and test them easily.
 
import type { ScheduleInterval } from '../types'
 
// ─── Date helpers ────────────────────────────────────────────────────────────
 
// Returns today's date with the time zeroed out (midnight).
// We zero the time so that date comparisons don't accidentally fail because
// one date is 08:00 and another is 08:01.
export function getToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
 
// Converts a Date object into a "YYYY-MM-DD" string.
// We use this format as a dictionary key because it's unambiguous and sorts correctly.
// e.g. new Date(2025, 3, 17) → "2025-04-17"
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0') // months are 0-indexed!
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
 
// ─── Schedule logic ──────────────────────────────────────────────────────────
 
// Maps the human-readable schedule name to how many days between showers.
// A Record<K, V> is just a TypeScript way of saying "an object whose keys are
// type K and values are type V" — basically a typed dictionary.
const INTERVAL_DAYS: Record<ScheduleInterval, number> = {
  'daily': 1,
  'every-other': 2,
  'every-two': 3,
}
 
// Builds a Set of date strings for all scheduled shower days.
// A Set is like an array but: (1) no duplicates, and (2) checking if a value
// exists is O(1) — instant — instead of scanning the whole list.
//
// We loop from 14 days in the past to 8 weeks ahead.
// Any day whose offset from today is divisible by the interval gets added.
// e.g. with interval=2 (every other day), days 0, 2, 4, 6... are shower days.
export function buildShowerDays(
  interval: ScheduleInterval,
  overrides: Map<string, boolean> = new Map()
): Set<string> {
  const days = new Set<string>()
  const intervalDays = INTERVAL_DAYS[interval]
  const today = getToday()
 
  for (let i = -14; i < 56; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const key = toDateKey(d)
 
    // Check if the user manually overrode this day in the calendar
    if (overrides.has(key)) {
      if (overrides.get(key)) days.add(key)
      // if override is false, we intentionally don't add it (removing the day)
    } else if (i % intervalDays === 0) {
      days.add(key)
    }
  }
 
  return days
}
 
// ─── Countdown logic ─────────────────────────────────────────────────────────
 
// Finds the next upcoming shower datetime given a set of shower days.
// For today, we assume the shower is at the user's preferred time (default 8pm).
// For future days, we assume 8am.
export function getNextShowerDate(
  showerDays: Set<string>,
  showerTime: string = '20:00' ): Date | null { // HH:MM
  const now = new Date()
  const today = getToday()
  const todayKey = toDateKey(today)
  const [prefHour, prefMin] = showerTime.split(':').map(Number)
 
  for (let i = 0; i < 10; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const key = toDateKey(d)
 
    if (!showerDays.has(key)) continue
 
    // For today, use the user's preferred time
    if (i === 0) {
      const target = new Date(today)
      target.setHours(prefHour, prefMin, 0, 0)
      if (target > now) return target
    } else {
      // For future days, use 8am as the default shower time
      const target = new Date(d)
      target.setHours(8, 0, 0, 0)
      return target
    }
  }
 
  return null // No upcoming shower found within 10 days
}
 
// Formats a millisecond duration into a human-readable string.
// e.g. 24600000ms → "6h 50m"
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m'
  const totalMins = Math.floor(ms / 60000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}
 
// Formats seconds into MM:SS for the shower timer.
// e.g. 605 → "10:05"
export function formatTimerSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
 
// Returns a greeting based on the current hour.
export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
 
// ─── Ring math ───────────────────────────────────────────────────────────────
 
// Calculates the SVG stroke-dashoffset for a progress ring.
// circumference = 2 * π * radius
// When progress=1 (full), offset=0 (fully drawn)
// When progress=0 (empty), offset=circumference (stroke is hidden)
export function ringOffset(radius: number, progress: number): number {
  const circumference = 2 * Math.PI * radius
  return circumference * (1 - Math.max(0, Math.min(1, progress)))
}