//import { useEffect } from 'react'
import styles from './Toast.module.css'

interface ToastProps {
    message: string
    onDone: () => void
    duration?: number
}

export function Toast({ message, onDone, duration = 4 }: ToastProps) {
  /*useEffect(() => {
    const id = setTimeout(onDone, 4000)
    return () => clearTimeout(id)
  }, [onDone])*/

  /*return (
    <div className={styles.toast} onAnimationEnd={onDone}>
      <span className={styles.icon}>🚿</span>
      {message}
    </div>
  )*/
  return (
    <div
      className={styles.toast}
      onClick={onDone}
      onAnimationEnd={onDone}
      style={{ animationDuration: `${duration}s` }}
      title="Click to dismiss"
    >
      <span className={styles.icon}>🚿</span>
      {message}
      <span className={styles.dismiss}>✕</span>
    </div>
  )
}