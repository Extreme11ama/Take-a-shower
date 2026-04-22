
import { Modal } from './Modal'
import { useTimer } from '../hooks/useTimer'
import styles from './TimerModal.module.css'
 
const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ≈ 439.8
 
const DURATIONS = [5, 10, 15, 20]
 
interface TimerModalProps {
  open: boolean
  onClose: () => void
}
 
export function TimerModal({ open, onClose }: TimerModalProps) {
  const {
    running, finished, durationMins, displayText,
    progress, hint, startLabel,
    toggle, reset, setDuration,
  } = useTimer(10)
 
  const dashoffset = CIRCUMFERENCE * (1 - progress)
 
  return (
    <Modal open={open} title="Shower timer" onClose={onClose} backdropClassName={running ? styles.backdropDark : ''}>
      {/* The ring clock */}
      <div className={styles.ringWrap}>
        <div className={`${styles.ringContainer} ${running ? styles.ringLarge : ''}`}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 180 180"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="90" cy="90" r={RADIUS}
              fill="none"
              stroke="rgba(200, 220, 199, 0.25)"
              strokeWidth="10"
            />
            
            <circle
              cx="90" cy="90" r={RADIUS}
              fill="none"
              stroke="#7FA8A0"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
 
          <div className={styles.ringInner} onClick={toggle}>
            <div className={`${styles.timeDisplay} ${finished ? styles.finished : ''}`}>
              {displayText}
            </div>
            <div className={styles.hint}>{hint}</div>
          </div>
        </div>
      </div>
 
      {/* Duration picker — four preset buttons */}
      <div className={styles.durationGrid}>
        {DURATIONS.map(mins => (
          <button
            key={mins}
            className={`${styles.durBtn} ${durationMins === mins ? styles.durSelected : ''}`}
            onClick={() => setDuration(mins)}
          >
            {mins} min
          </button>
        ))}
      </div>
 
      <div className={styles.controls}>
        <button className={styles.startBtn} onClick={toggle}>
          {startLabel}
        </button>
        <button className={styles.resetBtn} onClick={reset}>
          Reset
        </button>
      </div>
    </Modal>
  )
}