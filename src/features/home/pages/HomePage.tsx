import { PageShell } from '@/shared'
import { useAuth } from '@/features/auth'
import { WatchlistPanel } from '@/features/watchlist'
import { HomeHero } from '../components'
import { useHomeTitle } from '../hooks'

export function HomePage() {
  const title = useHomeTitle()
  const { user } = useAuth()

  return (
    <PageShell title="Home">
      <HomeHero title={title} />
      {user && <WatchlistPanel />}
    </PageShell>
  )
}
