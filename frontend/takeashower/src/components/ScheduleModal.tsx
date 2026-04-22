 
import { useState } from 'react'
import { Modal } from './Modal'
import type { ScheduleInterval } from '../types'
import styles from './ScheduleModal.module.css'
 
const SCHEDULES: { id: ScheduleInterval; icon: string; name: string; desc: string }[] = [
  { id: 'daily',       icon: '💧', name: 'Every day',        desc: 'Shower every 24 hours'  },
  { id: 'every-other', icon: '🌿', name: 'Every other day',  desc: 'Shower every 48 hours'  },
  { id: 'every-two',   icon: '🍃', name: 'Every two days',   desc: 'Shower every 72 hours'  },
]
 
interface ScheduleModalProps {
  open: boolean
  onClose: () => void
  current: ScheduleInterval       // the active schedule (from parent state)
  onApply: (s: ScheduleInterval, time: string) => void  // called when user confirms
  currentTime: string   
}
 
export function ScheduleModal({ open, onClose, current, onApply, currentTime }: ScheduleModalProps) {
  const [selected, setSelected] = useState<ScheduleInterval>(current)
  const [selectedTime, setSelectedTime] = useState(currentTime)

 
  function handleApply() {
    onApply(selected, selectedTime)  
    onClose()
  }
 
  return (
    <Modal open={open} title="Schedule" onClose={onClose}>
      <div className={styles.options}>
        {SCHEDULES.map(s => (
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
        
            <div className={`${styles.check} ${selected === s.id ? styles.checkActive : ''}`}>
              {selected === s.id && '✓'}
            </div>
          </button>
        ))}
      </div>

        <div className={styles.timeRow}>
            <span className={styles.timeLabel}>Shower time</span>
            <input
                type="time"
                className={styles.timeInput}
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
            />
        </div>
 
      <button className={styles.applyBtn} onClick={handleApply}>
        Apply schedule
      </button>
    </Modal>
  )
}