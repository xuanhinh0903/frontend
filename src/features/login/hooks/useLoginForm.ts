import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { resolveSafeRedirect } from '@/shared'
import { useAuth, type LoginLocationState } from '@/features/auth'

export function useLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, status, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Leave the page only once the auth saga confirms the session.
  useEffect(() => {
    if (status !== 'authenticated') return
    const state = location.state as LoginLocationState | null
    navigate(resolveSafeRedirect(state?.from?.pathname), { replace: true })
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
