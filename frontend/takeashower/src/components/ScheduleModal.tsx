// components/ScheduleModal.tsx
//
// Lets the user pick their shower schedule. Notice it has its OWN internal
// "selectedSchedule" state for the highlighted option — but it only calls
// onApply (which updates the parent's state) when you hit "Apply".
//
// This is intentional: if you changed the parent's schedule immediately on
// every click, the countdown on the home screen would jump around while you're
// still deciding. By keeping a local draft, the user can browse options and
// only commit when ready.
 
import { useState } from 'react'
import { Modal } from './Modal'
import type { ScheduleInterval } from '../types'
import styles from './ScheduleModal.css'
 
const SCHEDULES: { id: ScheduleInterval; icon: string; name: string; desc: string }[] = [
  { id: 'daily',       icon: '💧', name: 'Every day',        desc: 'Shower every 24 hours'  },
  { id: 'every-other', icon: '🌿', name: 'Every other day',  desc: 'Shower every 48 hours'  },
  { id: 'every-two',   icon: '🍃', name: 'Every two days',   desc: 'Shower every 72 hours'  },
]
 
interface ScheduleModalProps {
  open: boolean
  onClose: () => void
  current: ScheduleInterval       // the active schedule (from parent state)
  onApply: (s: ScheduleInterval) => void  // called when user confirms
}
 
export function ScheduleModal({ open, onClose, current, onApply }: ScheduleModalProps) {
  // Local draft state — initialized to whatever is currently active
  const [selected, setSelected] = useState<ScheduleInterval>(current)
 
  function handleApply() {
    onApply(selected)  // push the chosen value up to the parent
    onClose()
  }
 
  return (
    <Modal open={open} title="Schedule" onClose={onClose}>
      <div className={styles.options}>
        {SCHEDULES.map(s => (
          // Each option is a button. We apply a `.selected` class when it
          // matches the local draft, not the currently-active schedule.
          <button
            key={s.id}
            className={`${styles.option} ${selected === s.id ? styles.selected : ''}`}
            onClick={() => setSelected(s.id)}
          >
            <div className={styles.icon}>{s.icon}</div>
            <div className={styles.text}>
              <span className={styles.name}>{s.name}</span>
              <span className={styles.desc}>{s.desc}</span>
            </div>
            {/* The checkmark circle — filled only when selected */}
            <div className={`${styles.check} ${selected === s.id ? styles.checkActive : ''}`}>
              {selected === s.id && '✓'}
            </div>
          </button>
        ))}
      </div>
 
      <button className={styles.applyBtn} onClick={handleApply}>
        Apply schedule
      </button>
    </Modal>
  )
}