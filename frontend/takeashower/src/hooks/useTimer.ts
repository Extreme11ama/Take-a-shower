
import { useState, useEffect, useRef } from 'react'
import { formatTimerSeconds } from '../library/utils'
import { sendNotification, playTimerDoneSound } from './audio'
 
export function useTimer(initialMinutes: number = 10) {
  const [durationMins, setDurationMins] = useState(initialMinutes)
  const [remaining, setRemaining] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
 
  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }
 
  function start() {
    if (finished) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimer()
          setRunning(false)
          setFinished(true)
          playTimerDoneSound()
          sendNotification('Your shower timer is done!')
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
 