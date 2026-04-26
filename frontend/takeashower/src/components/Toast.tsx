//import { useEffect } from 'react'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  onDone: () => void
}

export function Toast({ message, onDone }: ToastProps) {
  /*useEffect(() => {
    const id = setTimeout(onDone, 4000)
    return () => clearTimeout(id)
  }, [onDone])*/

  return (
    <div className={styles.toast} onAnimationEnd={onDone}>
      <span className={styles.icon}>🚿</span>
      {message}
    </div>
  )
}