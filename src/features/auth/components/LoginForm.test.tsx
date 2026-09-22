import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loginRequested } from '@/features/auth/slices'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { renderWithProviders } from '@/test'

describe('LoginForm', () => {
  it('dispatches loginRequested with the entered credentials', async () => {
    const { user, actions } = renderWithProviders(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'demo@msvn.local')
    await user.type(screen.getByLabelText('Password'), 'demo1234')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(actions).toContainEqual(
      loginRequested({ email: 'demo@msvn.local', password: 'demo1234' }),
    )
  })

  it('disables the submit button while the request is pending', () => {
    renderWithProviders(<LoginForm />, {
      preloadedState: { auth: { status: 'loading' } },
    })

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
  })

  it('announces the login error', () => {
    renderWithProviders(<LoginForm />, {
      preloadedState: {
        auth: { status: 'unauthenticated', error: 'Invalid credentials' },
      },
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
  })
})
