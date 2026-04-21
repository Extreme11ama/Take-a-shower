
import { useState, useEffect } from 'react'
import type { ScheduleInterval } from '../types'
import {
  buildShowerDays,
  getNextShowerDate,
  formatCountdown,
  ringOffset,
  toDateKey,
  getToday,
} from '../library/utils'
 
const RING_RADIUS = 90
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const INTERVAL_DAYS: Record<ScheduleInterval, number> = {
  'daily': 1,
  'every-other': 2,
  'every-two': 3,
}
 
interface UseCountdownOptions {
  schedule: ScheduleInterval
  overrides: Map<string, boolean>
  showerTime?: string
}
 
export function useCountdown({ schedule, overrides, showerTime = '20:00' }: UseCountdownOptions) {

  const [countdownText, setCountdownText] = useState('...')
  const [ringProgress, setRingProgress] = useState(0)
  const [nextShowerDate, setNextShowerDate] = useState<Date | null>(null)
  const [showerDays, setShowerDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    function tick() {
      const days = buildShowerDays(schedule, overrides)
      setShowerDays(days)
 
      const next = getNextShowerDate(days, showerTime)
      setNextShowerDate(next)
 
      if (!next) {
        setCountdownText('No shower scheduled')
        setRingProgress(0)
        return
      }
 
      const now = Date.now()
      const remaining = next.getTime() - now
 
      setCountdownText(formatCountdown(remaining))
 
      const totalPeriodMs = INTERVAL_DAYS[schedule] * 24 * 60 * 60 * 1000
      const progress = Math.max(0, remaining / totalPeriodMs)
      setRingProgress(progress)
    }
 
    tick() 
 
    const id = setInterval(tick, 60_000)
 
    return () => clearInterval(id)
  }, [schedule, overrides, showerTime])
 
  const streak = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getToday())
    d.setDate(d.getDate() - (6 - i)) // go from 6 days ago up to today
    return {
      key: toDateKey(d),
      isShowerDay: showerDays.has(toDateKey(d)),
      isToday: i === 6,
    }
  })
 
  return {
    countdownText,
    ringDashoffset: ringOffset(RING_RADIUS, ringProgress),
    ringCircumference: CIRCUMFERENCE,
    nextShowerDate,
    showerDays,
    streak,
  }
}