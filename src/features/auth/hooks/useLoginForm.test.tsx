import { act, screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { PATHS } from '@/shared/routes'
import { loginSucceeded } from '@/features/auth/slices'
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'
import {
  buildSession,
  renderHookWithProviders,
  renderWithProviders,
} from '@/test'

// The hook lives on the login route and unmounts once it navigates away, like LoginPage does.
function LoginProbe() {
  const { isSubmitting } = useLoginForm()
  return <p>{isSubmitting ? 'Submitting' : 'Login page'}</p>
}

function HomePage() {
  return <p>Home page</p>
}

function PortfolioPage() {
  return <p>Portfolio page</p>
}

function renderLoginRoute(from?: string) {
  return renderWithProviders(
    <Routes>
      <Route path={PATHS.login} Component={LoginProbe} />
      <Route path={PATHS.home} Component={HomePage} />
      <Route path="/portfolio" Component={PortfolioPage} />
    </Routes>,
    {
      preloadedState: { auth: { status: 'unauthenticated' } },
      route: {
        pathname: PATHS.login,
        state: from ? { from: { pathname: from } } : null,
      },
    },
  )
}

describe('useLoginForm', () => {
  it('reports the pending state from the store', () => {
    const { result } = renderHookWithProviders(useLoginForm, {
      preloadedState: { auth: { status: 'loading' } },
      route: PATHS.login,
    })

    expect(result.current.isSubmitting).toBe(true)
  })

  it('stays on the login page while unauthenticated', () => {
    renderLoginRoute()

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('returns to the page the user came from once the session is confirmed', async () => {
    const { store } = renderLoginRoute('/portfolio')

    act(() => {
      store.dispatch(loginSucceeded(buildSession()))
    })

    expect(await screen.findByText('Portfolio page')).toBeInTheDocument()
  })

  it('falls back to home when the stored redirect is not a same-app path', async () => {
    const { store } = renderLoginRoute('//evil.example')

    act(() => {
      store.dispatch(loginSucceeded(buildSession()))
    })

    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })
})
