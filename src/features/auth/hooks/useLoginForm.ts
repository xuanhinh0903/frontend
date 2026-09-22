import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { resolveSafeRedirect } from '@/shared'
import { readRedirectPath } from '@/features/auth/utils'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, status, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Leave the page only once the auth saga confirms the session.
  useEffect(() => {
    if (status !== 'authenticated') return
    const from = readRedirectPath(location.state)
    // navigate() may return a Promise (data routers); nothing here awaits the transition.
    void navigate(resolveSafeRedirect(from), { replace: true })
  }, [status, location.state, navigate])

  // Plain functions: only this form uses them, on native inputs.
  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value)
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    login({ email, password })
  }

  return {
    email,
    password,
    error,
    isSubmitting: status === 'loading',
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  }
}
