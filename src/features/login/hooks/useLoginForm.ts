import { useState } from 'react'

export function useLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function reset() {
    setEmail('')
    setPassword('')
  }

  return { email, setEmail, password, setPassword, reset }
}
