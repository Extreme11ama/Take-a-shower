// components/Modal.tsx
//
// This is a "wrapper" or "layout" component — it doesn't know anything about
// shower schedules or timers. It just renders a backdrop + card, and whatever
// you put between <Modal> and </Modal> tags gets slotted in as `children`.
//
// This pattern is called "composition". Instead of building a CalendarModal,
// ScheduleModal, and TimerModal all from scratch, we build one Modal shell
// and compose content inside it. DRY = Don't Repeat Yourself.
 
import { useEffect } from 'react'
import styles from './Modal.css'
 
interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  // `children` is a special React prop — it represents whatever JSX is nested
  // inside your component when you use it. Type ReactNode covers any valid JSX.
  children: React.ReactNode
}
 
export function Modal({ open, title, onClose, children }: ModalProps) {
  // Close the modal when the user presses Escape.
  // useEffect with [open] in the deps means this effect re-runs every time
  // `open` changes — so we add/remove the listener as the modal opens/closes.
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])
 
  // Early return — if the modal isn't open, render nothing at all.
  // This is cleaner than toggling visibility with CSS because the child
  // components fully unmount (their state resets, effects clean up, etc.)
  if (!open) return null
 
  return (
    // The backdrop div: clicking it closes the modal.
    // We check e.target === e.currentTarget to make sure we only close when the
    // user clicks the dark overlay itself, NOT when they click inside the white card.
    <div
      className={styles.backdrop}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        {/* children is whatever you nest inside <Modal>...</Modal> */}
        {children}
      </div>
    </div>
  )
}