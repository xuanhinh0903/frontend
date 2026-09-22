import type { ReactNode } from 'react'

type PageShellProps = {
  title: string
  children: ReactNode
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <section className="page-shell">
      <h1 className="page-shell__title">{title}</h1>
      <div className="page-shell__body">{children}</div>
    </section>
  )
}
