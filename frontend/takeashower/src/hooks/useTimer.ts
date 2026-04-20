// hooks/useTimer.ts
//
// This hook manages the shower timer — completely separate from the schedule
// countdown. It handles start/pause/reset and ticks every second.
//
// Notice how none of this logic lives in a component. That separation is the
// point: the component file just says "give me a timer" and uses what comes back.
 
import { useState, useEffect, useRef } from 'react'
import { formatTimerSeconds } from '../library/utils'
 
// useRef is like useState but changing it does NOT trigger a re-render.
// It's perfect for holding the interval ID — we need it to cancel the interval
// but we never want to show it on screen.
 
export function useTimer(initialMinutes: number = 10) {
  const [durationMins, setDurationMins] = useState(initialMinutes)
  const [remaining, setRemaining] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
 
  // Clear any running interval (helper used in multiple places below)
  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }
 
  function start() {
    if (finished) return
    setRunning(true)
    // We use setRemaining with a callback (prev => prev - 1) instead of reading
    // the `remaining` variable directly. This is important: closures in setInterval
    // capture the value of `remaining` at the time the interval was created, so
    // reading it directly would always give you the original value, never the updated one.
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer()
          setRunning(false)
          setFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
 
  function pause() {
    clearTimer()
    setRunning(false)
  }
 
  function toggle() {
    if (running) pause()
    else start()
  }
 
  function reset() {
    clearTimer()
    setRunning(false)
    setFinished(false)
    setRemaining(durationMins * 60)
  }
 
  function setDuration(mins: number) {
    clearTimer()
    setRunning(false)
    setFinished(false)
    setDurationMins(mins)
    setRemaining(mins * 60)
  }
 
  // Cleanup on unmount — avoids memory leaks if the modal is closed while running
  useEffect(() => () => clearTimer(), [])
 
  const totalSeconds = durationMins * 60
  const progress = remaining / totalSeconds // 1.0 = full ring, 0.0 = empty
 
  return {
    running,
    finished,
    durationMins,
    displayText: formatTimerSeconds(remaining),
    progress,
    hint: finished ? 'done!' : running ? 'tap to pause' : 'tap to start',
    startLabel: running ? 'Pause' : 'Start',
    toggle,
    reset,
    setDuration,
  }
}
 