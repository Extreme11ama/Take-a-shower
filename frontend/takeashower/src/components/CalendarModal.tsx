 
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
  notes: Record<string, string>                        // ← new
  onSaveNote: (date: string, note: string) => void
  missedDays: Set<string>  // ← new
  confirmedShowerDays: Set<string>
}
 
export function CalendarModal({ open, onClose, showerDays, onToggleDay, notes, onSaveNote, missedDays, confirmedShowerDays }: CalendarModalProps) {
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

    // new state for the note popover
  const [notePopover, setNotePopover] = useState<{ date: string; label: string } | null>(null)
  const [noteText, setNoteText] = useState('')

  function handleRightClick(e: React.MouseEvent, key: string, label: string) {
    e.preventDefault()  // stops the browser's default right-click menu
    setNotePopover({ date: key, label })
    setNoteText(notes[key] ?? '')  // load existing note if there is one
  }

  function handleSave() {
    if (!notePopover) return
    onSaveNote(notePopover.date, noteText)
    setNotePopover(null)
  }

  function handleDelete() {
    if (!notePopover) return
    onSaveNote(notePopover.date, '')  // empty string triggers delete
    setNotePopover(null)
  }
 
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
          const dayLabel = viewDate.toLocaleDateString('en-US', { month: 'long' }) + ` ${dayNum}, ${year}`
          const isMissed = missedDays.has(key)
 
          const classes = [
            styles.cell,
            isPast ? styles.past : '',
            isToday ? styles.today : '',
            isShowerDay ? styles.showerDay : '',
            isMissed ? styles.missedDay : '',  // ← new
          ].filter(Boolean).join(' ')
 
          return (
            <div
              key={key}
              className={classes}
              onClick={isPast ? undefined : () => onToggleDay(key)}
              onContextMenu={(e) => handleRightClick(e, key, dayLabel)}  // ← remove the isPast check
            >
              {dayNum}
              {notes[key] && <div className={styles.noteDot} />}
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
        <div className={styles.legendItem}>
          <div className={styles.legendDotNote} />
          Note
        </div>
      </div>

      {notePopover && (
        <div className={styles.notePopover}>
          <div className={styles.notePopoverHeader}>
            <span className={styles.notePopoverDate}>{notePopover.label}</span>
            <button className={styles.notePopoverClose} onClick={() => setNotePopover(null)}>✕</button>
          </div>

          {confirmedShowerDays.has(notePopover.date) &&notePopover.date <= toDateKey(getToday()) && (
            <button
              className={`${styles.missedBtn} ${missedDays.has(notePopover.date) ? styles.missedActive : ''}`}
              onClick={() => onToggleDay(notePopover.date)}
            >
            {missedDays.has(notePopover.date) ? '✓ Marked as missed' : 'Mark as missed'}
            </button>
          )}
          <textarea
            className={styles.noteTextarea}
            placeholder="What did you do in this shower?"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            autoFocus
            rows={4}
          />
          <div className={styles.noteActions}>
            {notes[notePopover.date] && (
              <button className={styles.noteDeleteBtn} onClick={handleDelete}>Delete</button>
            )}
            <button className={styles.noteSaveBtn} onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
    </Modal>
  )
}