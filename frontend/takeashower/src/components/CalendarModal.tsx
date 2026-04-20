// components/CalendarModal.tsx
//
// This component renders the calendar inside a Modal. It receives the set of
// shower days and a callback to toggle individual dates.
//
// Key concept: "lifting state up". The shower days Set lives in App.tsx (the
// parent), not in here. This component just displays it and calls a function
// when something changes. That way App.tsx stays the single source of truth —
// the countdown ring, the streak bar, and the calendar all read from the same data.
 
import { useState } from 'react'
import { Modal } from './Modal'
import { toDateKey, getToday } from '../library/utils'
import styles from './CalendarModal.css'
 
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
 
interface CalendarModalProps {
  open: boolean
  onClose: () => void
  showerDays: Set<string>        // which days are scheduled
  onToggleDay: (key: string) => void  // called when user clicks a day
}
 
export function CalendarModal({ open, onClose, showerDays, onToggleDay }: CalendarModalProps) {
  // The calendar view can scroll through months independently of today's date.
  // We initialize it to the current month using a lazy initializer function —
  // the function is only called once on mount, not on every render.
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    d.setDate(1) // always start from the 1st so month math works cleanly
    return d
  })
 
  function changeMonth(delta: number) {
    setViewDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }
 
  // Build the grid of cells for the current view month
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = getToday()
  const todayKey = toDateKey(today)
 
  // How many empty cells to pad before day 1 (0=Sun, 1=Mon, etc.)
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate() // day 0 of next month = last day of this month
 
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
 
  return (
    <Modal open={open} title="Calendar" onClose={onClose}>
      {/* Month navigation */}
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={() => changeMonth(-1)}>‹</button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button className={styles.navBtn} onClick={() => changeMonth(1)}>›</button>
      </div>
 
      <div className={styles.grid}>
        {/* Day-of-week headers */}
        {DAY_HEADERS.map(d => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
 
        {/* Empty padding cells before day 1 */}
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
 
        {/* The actual day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const date = new Date(year, month, dayNum)
          const key = toDateKey(date)
          const isPast = date < today
          const isToday = key === todayKey
          const isShowerDay = showerDays.has(key)
 
          // Build up the class string conditionally.
          // In a real project you'd use a library like `clsx` for this.
          const classes = [
            styles.cell,
            isPast ? styles.past : '',
            isToday ? styles.today : '',
            isShowerDay ? styles.showerDay : '',
          ].filter(Boolean).join(' ')
 
          return (
            <div
              key={key}
              className={classes}
              // Past days aren't clickable — the onClick is undefined for them
              onClick={isPast ? undefined : () => onToggleDay(key)}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
 
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDotGreen} />
          Shower day
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDotStone} />
          Today
        </div>
      </div>
    </Modal>
  )
}