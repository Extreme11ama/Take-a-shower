// components/LoginPage.tsx
//
// The sign-in and sign-up screen. In a real app this would call your FastAPI
// backend → Supabase Auth. For now it just calls onLogin() with the username,
// which App.tsx handles by switching to the main screen.
//
// Notice the two "views" (sign in vs create account) share the same component
// file — the `mode` state just toggles which fields and which button to show.
// This is simpler than having two separate route pages for a form this small.
 
// components/LoginPage.tsx — updated with real API calls
//
// The key change from the previous version: handleSubmit() now calls
// auth.login() or auth.register() and handles the response.
//
// Notice the `isSubmitting` state — this disables the button while the
// network request is in flight so the user can't click it multiple times.
// This is a small detail but it matters for real apps.
 
import { useState } from 'react'
import { auth, profile } from '../library/api'
import type { ScheduleInterval } from '../types'
import styles from './LoginPage.css'
 
interface LoginPageProps {
  // Updated signature: we pass back both username AND their schedule
  // so App.tsx can initialize correctly without a second fetch
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
    // Client-side validation first (fast, no network needed)
    if (!username.trim()) { setError('Username is required'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match'); return }
 
    setError('')
    setIsSubmitting(true) // disable the button
 
    try {
      if (mode === 'signup') {
        // Register creates the account AND logs in
        await auth.register(username.trim(), password)
      } else {
        await auth.login(username.trim(), password)
      }
 
      // After login/register, fetch the user's profile to get their schedule.
      // The token is now stored in localStorage (api.ts handles that),
      // so this request will be authenticated automatically.
      const userProfile = await profile.get()
 
      // Tell App.tsx we're logged in and pass the real schedule value
      onLogin(userProfile.username, userProfile.schedule_interval)
 
    } catch (err) {
      // err is type `unknown` in TypeScript — we need to narrow it
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      // Always re-enable the button, whether it succeeded or failed
      setIsSubmitting(false)
    }
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
          {/* Show different text while loading so user knows something is happening */}
          {isSubmitting
            ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
            : (mode === 'login' ? 'Sign in' : 'Create account')
          }
        </button>
 
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