// App.tsx
//
// This is the root of your React app. Its job is to:
//   1. Own all "global" state (who's logged in, what schedule is set, overrides)
//   2. Decide which screen to show (login vs main app)
//   3. Render the modals and pass them the right props
//
// The concept here is called "lifting state up". Any data that two or more
// components need to share lives here, at the closest common ancestor.
// Data flows DOWN via props. Changes flow UP via callback functions (onX props).
//
// In a bigger app you'd use a state manager like Zustand or React Context for
// this — but for a project this size, plain useState in App.tsx is totally fine.
 
// App.tsx — updated with real API calls
//
// The structure is exactly the same as before. The only things that changed
// are the three functions that used to have TODO comments:
//   handleLogin()    → now calls api.profile.get() to load real settings
//   handleToggleDay() → now calls api.overrides.set() to save to the DB
//   handleApplySchedule() → now calls api.profile.update() to save to the DB
//
// We also added:
//   - tokenStorage check on startup (so you stay logged in after refresh)
//   - loading state so the app doesn't flash the login screen on refresh
//   - error handling with try/catch around every API call
 
import { useState, useEffect, useCallback } from 'react'
import { LoginPage } from './components/LoginPage'
import { CalendarModal } from './components/CalendarModal'
import { ScheduleModal } from './components/ScheduleModal'
import { TimerModal } from './components/TimerModal'
import { useCountdown } from './hooks/useCountdown'
import type { ScheduleInterval } from './types'
import { getGreeting, toDateKey, getToday } from './library/utils'
import { auth, profile, overrides as overridesApi, tokenStorage } from './library/api'
import './App.css'
 
type ModalName = 'calendar' | 'schedule' | 'timer' | null
 
export default function App() {
  const [user, setUser] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<ScheduleInterval>('daily')
  const [activeModal, setActiveModal] = useState<ModalName>(null)
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map())
 
  // NEW: loading state prevents a flash of the login screen on page refresh
  // while we're checking if a token exists and loading the profile
  const [loading, setLoading] = useState(true)
 
  // ── On page load: check if user is already logged in ─────────────────────
  // If there's a stored token, fetch the profile immediately so the user
  // doesn't have to log in again every time they refresh the page.
  useEffect(() => {
    async function restoreSession() {
      const token = tokenStorage.get()
      if (!token) {
        setLoading(false)
        return
      }
 
      try {
        const userProfile = await profile.get()
        setUser(userProfile.username)
        setSchedule(userProfile.schedule_interval)
        await loadOverrides()
      } catch {
        // Token was expired or invalid — clear it and show login
        tokenStorage.clear()
      } finally {
        // Always set loading to false so the app renders something
        setLoading(false)
      }
    }
 
    restoreSession()
  }, []) // empty array = run once on mount only
 
  // Helper to load overrides from the DB and convert to a Map
  async function loadOverrides() {
    const data = await overridesApi.getAll()
    // data looks like { "2025-04-17": true, "2025-04-20": false }
    // We convert it to a Map for fast lookups
    setOverrides(new Map(Object.entries(data)))
  }
 
  // ── Countdown hook ────────────────────────────────────────────────────────
  const {
    countdownText,
    ringDashoffset,
    ringCircumference,
    nextShowerDate,
    showerDays,
    streak,
  } = useCountdown({ schedule, overrides })
 
  // ── Handlers ─────────────────────────────────────────────────────────────
 
  async function handleLogin(username: string, scheduleFromServer: ScheduleInterval) {
    // Login already happened in LoginPage.tsx (it calls auth.login()).
    // By the time this runs, the token is already stored.
    // We just update the UI state here.
    setUser(username)
    setSchedule(scheduleFromServer)
    await loadOverrides()
  }
 
  async function handleLogout() {
    try {
      await auth.logout()
    } catch {
      // Even if the server call fails, we still clear local state
    }
    setUser(null)
    setSchedule('daily')
    setOverrides(new Map())
  }
 
  const handleToggleDay = useCallback(async (key: string) => {
    // 1. Update UI immediately (optimistic update)
    //    The user sees the change instantly without waiting for the server.
    //    If the server call fails, we roll back.
    const newValue = !showerDays.has(key)
 
    setOverrides(prev => {
      const next = new Map(prev)
      next.set(key, newValue)
      return next
    })
 
    // 2. Save to the database in the background
    try {
      await overridesApi.set(key, newValue)
    } catch (err) {
      console.error('Failed to save override:', err)
      // Roll back the optimistic update if the save failed
      setOverrides(prev => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
    }
  }, [showerDays])
 
  async function handleApplySchedule(s: ScheduleInterval) {
    // Update UI immediately
    setSchedule(s)
    setOverrides(new Map()) // clear overrides when schedule changes
 
    // Save to DB
    try {
      await profile.update({ schedule_interval: s })
    } catch (err) {
      console.error('Failed to save schedule:', err)
    }
  }
 
  // ── Render ────────────────────────────────────────────────────────────────
 
  // Show nothing while checking the stored token on startup
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9B948E', fontFamily: 'DM Sans, sans-serif' }}>Loading...</p>
      </div>
    )
  }
 
  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }
 
  const nextLabel = nextShowerDate
    ? (toDateKey(nextShowerDate) === toDateKey(getToday()) ? 'Today' : nextShowerDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
      + ' at ' + nextShowerDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'No shower scheduled'
 
  const scheduleLabels: Record<ScheduleInterval, string> = {
    'daily': 'Every day',
    'every-other': 'Every other day',
    'every-two': 'Every two days',
  }
 
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">Rinse<span className="logo-dot">.</span></div>
        <div className="header-actions">
          <div className="icon-buttons">
            {([
              { name: 'calendar' as ModalName, emoji: '📅', label: 'Calendar' },
              { name: 'schedule' as ModalName, emoji: '🗓', label: 'Schedule' },
              { name: 'timer'    as ModalName, emoji: '⏱', label: 'Timer'    },
            ] as const).map(btn => (
              <button
                key={btn.name}
                className={`icon-btn ${activeModal === btn.name ? 'active' : ''}`}
                onClick={() => setActiveModal(btn.name)}
                aria-label={btn.label}
              >
                <span className="icon-emoji">{btn.emoji}</span>
                <span className="icon-label">{btn.label}</span>
              </button>
            ))}
          </div>
          <button className="user-chip" onClick={handleLogout} title="Sign out">
            <div className="avatar">{user[0].toUpperCase()}</div>
            <span>{user}</span>
          </button>
        </div>
      </header>
 
      <main className="main-content">
        <div className="greeting-block">
          <p className="greeting">{getGreeting()}, {user}</p>
          <h2 className="main-heading">Next shower in</h2>
        </div>
 
        <div className="ring-container">
          <svg
            width="220" height="220" viewBox="0 0 220 220"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(200,220,199,0.25)" strokeWidth="12" />
            <circle
              cx="110" cy="110" r="90"
              fill="none" stroke="#8BAE8A" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="ring-inner">
            <p className="ring-label">remaining</p>
            <div className="ring-time">{countdownText}</div>
            <p className="ring-sub">{scheduleLabels[schedule]}</p>
          </div>
        </div>
 
        <div className="next-info">
          <div className="next-badge">
            <div className="badge-dot" />
            {nextLabel}
          </div>
          <p className="streak-heading">This week's streak</p>
          <div className="streak-bar">
            {streak.map(({ key, isShowerDay, isToday }) => (
              <div
                key={key}
                className={`streak-cell ${isShowerDay ? 'done' : ''} ${isToday ? 'is-today' : ''}`}
              />
            ))}
          </div>
        </div>
      </main>
 
      <CalendarModal
        open={activeModal === 'calendar'}
        onClose={() => setActiveModal(null)}
        showerDays={showerDays}
        onToggleDay={handleToggleDay}
      />
      <ScheduleModal
        open={activeModal === 'schedule'}
        onClose={() => setActiveModal(null)}
        current={schedule}
        onApply={handleApplySchedule}
      />
      <TimerModal
        open={activeModal === 'timer'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  )
}
 