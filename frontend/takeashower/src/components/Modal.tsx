 
import { useEffect } from 'react'
import styles from './Modal.module.css'
 
interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  // `children` is a special React prop — it represents whatever JSX is nested
  // inside your component when you use it. Type ReactNode covers any valid JSX.
  children: React.ReactNode
}
 
export function Modal({ open, title, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])
 
  if (!open) return null
 
  return (
    <div
      className={styles.backdrop}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}