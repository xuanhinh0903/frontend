import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { PageShell } from '@/shared/components'
import { PATHS } from '@/shared/routes'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.statusText || `Error ${error.status}`
    : error instanceof Error
      ? error.message
      : 'Something went wrong.'

  return (
    <PageShell title="Something went wrong">
      <p>{message}</p>
      <Link to={PATHS.home}>Back to home</Link>
    </PageShell>
  )
}
