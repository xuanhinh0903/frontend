import { Link } from 'react-router'
import { PageShell } from '@/shared/components'
import { PATHS } from '@/shared/routes'

export function NotFoundPage() {
  return (
    <PageShell title="Page not found">
      <p>The page you requested does not exist.</p>
      <Link to={PATHS.home}>Back to home</Link>
    </PageShell>
  )
}
