import { screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PATHS } from '@/shared/routes'
import { readRedirectPath } from '@/features/auth/utils'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { buildAuthState, renderWithProviders } from '@/test'

function ProtectedPage() {
  return <p>Protected content</p>
}

function LoginPage() {
  const location = useLocation()
  return <p>Login page, from {readRedirectPath(location.state) ?? 'nowhere'}</p>
}

function renderGuardedRoute(auth: Parameters<typeof buildAuthState>[0]) {
  return renderWithProviders(
    <Routes>
      <Route Component={RequireAuth}>
        <Route path="/" Component={ProtectedPage} />
      </Route>
      <Route path={PATHS.login} Component={LoginPage} />
    </Routes>,
    { preloadedState: { auth: buildAuthState(auth) } },
  )
}

describe('RequireAuth', () => {
  it('renders nothing until the session has been restored', () => {
    renderGuardedRoute({ status: 'idle', user: null })

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(screen.queryByText(/Login page/)).not.toBeInTheDocument()
  })

  it('redirects anonymous users to login and remembers where they came from', () => {
    renderGuardedRoute({ status: 'unauthenticated', user: null })

    expect(screen.getByText('Login page, from /')).toBeInTheDocument()
  })

  it('renders the protected route for a signed-in user', () => {
    renderGuardedRoute({})

    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })
})
