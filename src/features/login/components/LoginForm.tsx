import { useLoginForm } from '../hooks'

export function LoginForm() {
  const {
    email,
    password,
    error,
    isSubmitting,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  } = useLoginForm()

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="login-form__field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          value={email}
          onChange={handleEmailChange}
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
          onChange={handlePasswordChange}
          required
          autoComplete="current-password"
        />
      </label>
      {error && (
        <p className="login-form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
