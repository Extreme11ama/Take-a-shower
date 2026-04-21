 
import { useState } from 'react'
import { Modal } from './Modal'
import { toDateKey, getToday } from '../library/utils'
import styles from './CalendarModal.module.css'
 
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
 
interface CalendarModalProps {
  open: boolean
  onClose: () => void
  showerDays: Set<string>        // which days are scheduled
  onToggleDay: (key: string) => void  // called when user clicks a day
}
 
export function CalendarModal({ open, onClose, showerDays, onToggleDay }: CalendarModalProps) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    d.setDate(1) 
    return d
  })
 
  function changeMonth(delta: number) {
    setViewDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + delta)
      return d
    })
  }
 
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = getToday()
  const todayKey = toDateKey(today)
 
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate() // day 0 of next month = last day of this month
 
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
 
  return (
    <Modal open={open} title="Calendar" onClose={onClose}>
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={() => changeMonth(-1)}>‹</button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button className={styles.navBtn} onClick={() => changeMonth(1)}>›</button>
      </div>
 
      <div className={styles.grid}>
        {DAY_HEADERS.map(d => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}
 
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
 
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1
          const date = new Date(year, month, dayNum)
          const key = toDateKey(date)
          const isPast = date < today
          const isToday = key === todayKey
          const isShowerDay = showerDays.has(key)
 
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