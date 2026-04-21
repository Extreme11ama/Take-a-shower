
import type { ScheduleInterval } from '../types'
 
// ─── Date helpers ────────────────────────────────────────────────────────────
export function getToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
 
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0') // months are 0 indexed
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
 
// ─── Schedule logic ──────────────────────────────────────────────────────────
 
const INTERVAL_DAYS: Record<ScheduleInterval, number> = {
  'daily': 1,
  'every-other': 2,
  'every-two': 3,
}
 
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
 
    if (overrides.has(key)) {
      if (overrides.get(key)) days.add(key)
    } else if (i % intervalDays === 0) {
      days.add(key)
    }
  }
 
  return days
}
 
// ─── Countdown logic ─────────────────────────────────────────────────────────
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
 
    if (i === 0) {
      const target = new Date(today)
      target.setHours(prefHour, prefMin, 0, 0)
      if (target > now) return target
    } else {
      const target = new Date(d)
      target.setHours(8, 0, 0, 0)
      return target
    }
  }
 
  return null 
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0m'
  const totalMins = Math.floor(ms / 60000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}
 
export function formatTimerSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
 
export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
 
// ─── Ring math ───────────────────────────────────────────────────────────────
export function ringOffset(radius: number, progress: number): number {
  const circumference = 2 * Math.PI * radius
  return circumference * (1 - Math.max(0, Math.min(1, progress)))
}