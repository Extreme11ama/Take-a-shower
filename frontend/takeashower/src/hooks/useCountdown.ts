// hooks/useCountdown.ts
//
// A "custom hook" is just a regular function whose name starts with "use" and
// calls other React hooks inside it. Custom hooks let you pull complex stateful
// logic OUT of your components so the component file stays clean and readable.
//
// This hook owns all the countdown logic: it tracks the next shower date,
// calculates the time remaining, updates every minute, and computes the ring
// progress percentage. The component just calls this hook and uses whatever
// it returns.
 
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
// 2πr — the total length of the circle's stroke path in SVG units
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
 
// The INTERVAL_DAYS object maps each schedule to its day-gap.
// This is used to know the "full period" for the ring — e.g. for "every other
// day", the ring represents 48 hours total.
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
  // State holds the "snapshot" values the component will render.
  // useState<T>(initial) returns [currentValue, setterFunction].
  // Calling the setter causes React to re-render the component.
  const [countdownText, setCountdownText] = useState('...')
  const [ringProgress, setRingProgress] = useState(0)
  const [nextShowerDate, setNextShowerDate] = useState<Date | null>(null)
  const [showerDays, setShowerDays] = useState<Set<string>>(new Set())
 
  // useEffect runs *after* the component renders. The second argument is the
  // "dependency array" — React re-runs the effect whenever these values change.
  // An empty [] means "run once on mount". Here we include schedule and overrides
  // so the effect re-runs whenever the user changes their schedule or calendar.
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
 
      // Progress = what fraction of the period has passed.
      // e.g. if you shower every day (86400s total) and 6 hours remain,
      // progress = 1 - (6/24) = 0.75 → ring is 75% filled.
      const totalPeriodMs = INTERVAL_DAYS[schedule] * 24 * 60 * 60 * 1000
      const progress = Math.max(0, remaining / totalPeriodMs)
      setRingProgress(progress)
    }
 
    tick() // Run immediately so there's no 1-minute delay on load
 
    // setInterval returns an ID we need to cancel it later.
    // We update every 60 seconds — no need to be more precise than that.
    const id = setInterval(tick, 60_000)
 
    // The function returned from useEffect is the "cleanup function".
    // React calls it when the component unmounts or before re-running the effect.
    // Without this, you'd leak intervals every time the schedule changes.
    return () => clearInterval(id)
  }, [schedule, overrides, showerTime])
 
  // Compute the streak: for each of the last 7 days, was it a shower day?
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