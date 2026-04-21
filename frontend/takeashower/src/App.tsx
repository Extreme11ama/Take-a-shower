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
 
  const [loading, setLoading] = useState(true)
 
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
        tokenStorage.clear()
      } finally {
        setLoading(false)
      }
    }
 
    restoreSession()
  }, []) 
 
  async function loadOverrides() {
    const data = await overridesApi.getAll()
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
    const newValue = !showerDays.has(key)
 
    setOverrides(prev => {
      const next = new Map(prev)
      next.set(key, newValue)
      return next
    })
 
    try {
      await overridesApi.set(key, newValue)
    } catch (err) {
      console.error('Failed to save override:', err)
      setOverrides(prev => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
    }
  }, [showerDays])
 
  async function handleApplySchedule(s: ScheduleInterval) {
    setSchedule(s)
    setOverrides(new Map()) 
 
    try {
      await profile.update({ schedule_interval: s })
    } catch (err) {
      console.error('Failed to save schedule:', err)
    }
  }
 
  // ── Render ────────────────────────────────────────────────────────────────
 
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
 