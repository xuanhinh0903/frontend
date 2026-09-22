import { PageShell } from '@/shared'
import { HomeHero } from '../components'
import { useHomeTitle } from '../hooks'

export function HomePage() {
  const title = useHomeTitle()

  return (
    <PageShell title="Home">
      <HomeHero title={title} />
    </PageShell>
  )
}
