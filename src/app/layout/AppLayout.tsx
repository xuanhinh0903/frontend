import { NavLink, Outlet } from 'react-router'
import { Suspense } from 'react'
import { PATHS, useAuth } from '@/shared'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <nav className="app-nav" aria-label="Main">
          <NavLink to={PATHS.home} end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to={PATHS.products.root} className={navLinkClass}>
            Products
          </NavLink>
          {user ? (
            <span className="app-nav__session">
              <span className="app-nav__user">{user.email}</span>
              <button
                type="button"
                className="app-nav__logout"
                onClick={logout}
              >
                Log out
              </button>
            </span>
          ) : (
            <NavLink to={PATHS.login} className={navLinkClass}>
              Login
            </NavLink>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Suspense fallback={<p>Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
