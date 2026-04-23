import { useState, useEffect, useCallback } from 'react'
import { LoginPage } from './components/LoginPage'
import { CalendarModal } from './components/CalendarModal'
import { ScheduleModal } from './components/ScheduleModal'
import { TimerModal } from './components/TimerModal'
import { useCountdown } from './hooks/useCountdown'
import type { ScheduleInterval } from './types'
import { getGreeting, toDateKey, getToday } from './library/utils'
import { auth, profile, overrides as overridesApi, tokenStorage } from './library/api'
import { MdCalendarMonth } from "react-icons/md"
import { BsClock } from "react-icons/bs"
import { FaStopwatch } from "react-icons/fa"
import './App.css'
 
type ModalName = 'calendar' | 'schedule' | 'timer' | null
 
export default function App() {
  const [user, setUser] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<ScheduleInterval>('daily')
  const [activeModal, setActiveModal] = useState<ModalName>(null)
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map())
  const [showerTime, setShowerTime] = useState('20:00')
  const [showUserMenu, setShowUserMenu] = useState(false)
 
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
        setShowerTime(userProfile.shower_time)
        await loadOverrides()
      } catch {
        tokenStorage.clear()
      } finally {
        setLoading(false)
      }
    }
 
    restoreSession()
  }, []) 

  useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    const wrap = document.querySelector('.user-menu-wrap')
    if (wrap && !wrap.contains(e.target as Node)) {
      setShowUserMenu(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
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
  } = useCountdown({ schedule, overrides, showerTime })
 
  // ── Handlers ─────────────────────────────────────────────────────────────
 
  async function handleLogin(username: string, scheduleFromServer: ScheduleInterval) {
    setUser(username)
    setSchedule(scheduleFromServer)
    const p = await profile.get()
    setShowerTime(p.shower_time)
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
 
  async function handleApplySchedule(s: ScheduleInterval, time: string) {
    setSchedule(s)
    setShowerTime(time)
    setOverrides(new Map()) 
 
    try {
      await profile.update({ schedule_interval: s, shower_time: time })
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
            {/*
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
            ))}*/}
            <button className={`icon-btn ${activeModal === 'calendar' ? 'active' : ''}`} onClick={() => setActiveModal('calendar')} aria-label="Calendar">
            <MdCalendarMonth size={18} color="#8BAE8A" />
            <span className="icon-label">Calendar</span>
            </button>
            <button className={`icon-btn ${activeModal === 'schedule' ? 'active' : ''}`} onClick={() => setActiveModal('schedule')} aria-label="Schedule">
            <BsClock size={18} color="#B5A89A" />
            <span className="icon-label">Schedule</span>
            </button>
            <button className={`icon-btn ${activeModal === 'timer' ? 'active' : ''}`} onClick={() => setActiveModal('timer')} aria-label="Timer">
            <FaStopwatch size={18} color="#7FA8A0" />
            <span className="icon-label">Timer</span>
            </button>
          </div>
          {/*<button className="user-chip" onClick={handleLogout} title="Sign out">
            <div className="avatar">{user[0].toUpperCase()}</div>
            <span>{user}</span>
          </button>*/}
          <div className="user-menu-wrap">
          <button className="user-chip" onClick={() => setShowUserMenu(prev => !prev)}>
            <div className="avatar">{user[0].toUpperCase()}</div>
            <span>{user}</span>
            <span className="user-chip-caret">{showUserMenu ? '▲' : '▼'}</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-name">{user}</div>
              <hr className="user-dropdown-divider" />
              <button
                className="user-dropdown-signout"
                onClick={() => { setShowUserMenu(false); handleLogout() }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
        </div>
      </header>
 
      <main className="main-content">
        <div className="greeting-block">
          <p className="greeting">{getGreeting()}, {user}</p>
          <h2 className="main-heading">Next shower in</h2>
        </div>
 
        <div className="ring-container">
          <svg
            width="300" height="300" viewBox="0 0 300 300"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            <circle cx="150" cy="150" r="130" fill="none" stroke="rgba(200,220,199,0.25)" strokeWidth="14" />
            <circle
              cx="150" cy="150" r="130"
              fill="none" stroke="#8BAE8A" strokeWidth="14" strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="ring-inner">
            <p className="ring-label">remaining</p>
            <div className="ring-time" style={{ fontSize: countdownText.length > 6 ? '44px' : undefined }}>{countdownText}</div>
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
        currentTime={showerTime} 
        onApply={handleApplySchedule}
      />
      <TimerModal
        open={activeModal === 'timer'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  )
}
 