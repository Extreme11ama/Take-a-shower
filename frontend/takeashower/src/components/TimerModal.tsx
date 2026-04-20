// components/TimerModal.tsx
//
// The shower timer. It uses the `useTimer` custom hook for all its logic —
// this component is almost entirely about rendering, not behavior.
//
// The SVG ring here uses the same stroke-dashoffset trick as the main countdown
// ring, just smaller. r=70 → circumference ≈ 440.
 
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
  // All timer logic lives in the hook — we just destructure what we need
  const {
    running, finished, durationMins, displayText,
    progress, hint, startLabel,
    toggle, reset, setDuration,
  } = useTimer(10)
 
  const dashoffset = CIRCUMFERENCE * (1 - progress)
 
  return (
    <Modal open={open} title="Shower timer" onClose={onClose}>
      {/* The ring clock */}
      <div className={styles.ringWrap}>
        <div className={styles.ringContainer}>
          {/* SVG ring — rotate -90deg so it starts at the top */}
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
          >
            {/* Background track (always full circle, lighter color) */}
            <circle
              cx="90" cy="90" r={RADIUS}
              fill="none"
              stroke="rgba(200, 220, 199, 0.25)"
              strokeWidth="10"
            />
            {/* Foreground progress arc */}
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
 
          {/* Clickable center — tapping the ring starts/pauses the timer */}
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
 
      {/* Start/Pause and Reset buttons */}
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