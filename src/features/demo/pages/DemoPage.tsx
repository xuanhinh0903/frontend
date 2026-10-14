import { PageShell } from '@/shared'
import { DemoUserTable } from '../components'
import { useDemoUsers } from '../hooks'

export function DemoPage() {
  const { users, error, isLoading, isFailed, isEmpty, reload } = useDemoUsers()

  return (
    <PageShell title="Demo users">
      <div className="demo-toolbar">
        <button type="button" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Reload'}
        </button>
      </div>
      {isFailed && (
        <p className="demo-error" role="alert">
          {error}
        </p>
      )}
      {isEmpty && <p>No users found.</p>}
      {users.length > 0 && <DemoUserTable users={users} />}
    </PageShell>
  )
}
