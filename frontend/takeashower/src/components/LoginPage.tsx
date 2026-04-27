
import { useState } from 'react'
import { auth, profile } from '../library/api'
import type { ScheduleInterval } from '../types'
import styles from './LoginPage.module.css'
 
interface LoginPageProps {
    onLogin: (username: string, schedule: ScheduleInterval) => void
}
 
export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
 
  async function handleSubmit() {
    if (!username.trim()) { setError('Username is required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match'); return }
 
    setError('')
    setIsSubmitting(true) // disable the button
 
    try {
      if (mode === 'signup') {
        await auth.register(username.trim(), password)
      } else {
        await auth.login(username.trim(), password)
      }
 
      const userProfile = await profile.get()
 
      onLogin(userProfile.username, userProfile.schedule_interval)
 
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function fillDemo() {
    setUsername('demo')
    setPassword('demo1234')
  }
 
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }
 
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🚿</div>
        <h1 className={styles.title}>Rinse</h1>
        <p className={styles.sub}>Your personal shower ritual</p>
 
        {mode === 'signup' && (
          <button className={styles.backBtn} onClick={() => { setMode('login'); setError('') }}>
            ← Back
          </button>
        )}
 
        <div className={styles.fields}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              type="text"
              placeholder="yourname"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
            />
          </div>
 
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
            />
          </div>
 
          {mode === 'signup' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirm password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
 
        {error && <p className={styles.error}>{error}</p>}
 
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
            : (mode === 'login' ? 'Sign in' : 'Create account')
          }
        </button>

        {mode === 'login' && (
          <button className={styles.demoBtn} onClick={fillDemo}>
            Try demo account
          </button>
        )}
 
        <p className={styles.footer}>
          {mode === 'login' ? (
            <>No account? <button className={styles.link} onClick={() => { setMode('signup'); setError('') }}>Create one</button></>
          ) : (
            <>Already have an account? <button className={styles.link} onClick={() => { setMode('login'); setError('') }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  )
}