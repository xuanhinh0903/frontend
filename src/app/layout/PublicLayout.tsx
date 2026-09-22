import { Link, Outlet } from 'react-router'
import { Suspense } from 'react'
import { PATHS } from '@/shared'

export function PublicLayout() {
  return (
    <div className="app-shell app-shell--public">
      <header className="app-header app-header--public">
        <Link to={PATHS.home} className="app-nav__link">
          Back to home
        </Link>
      </header>
      <main className="app-main">
        <Suspense fallback={<p>Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
