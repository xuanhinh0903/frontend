import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { resolveSafeRedirect, useAuth, type LoginLocationState } from '@/shared'
import { useLoginForm } from '../hooks'

export function LoginForm() {
  const { email, setEmail, password, setPassword, reset } = useLoginForm()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    login(email)
    const state = location.state as LoginLocationState | null
    const redirectTo = resolveSafeRedirect(state?.from?.pathname)
    reset()
    navigate(redirectTo, { replace: true })
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="login-form__field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label className="login-form__field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      <button type="submit">Sign in</button>
    </form>
  )
}
