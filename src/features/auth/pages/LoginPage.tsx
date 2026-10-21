import { PageShell } from '@/shared'
import { LoginForm } from '@/features/auth/components'

export function LoginPage() {
  return (
    <PageShell title="Login">
      <LoginForm />
    </PageShell>
  )
}
