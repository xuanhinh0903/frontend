import { lazy, type ComponentType } from 'react'

export function lazyPage<Module extends Record<string, unknown>>(
  factory: () => Promise<Module>,
  exportName: keyof Module & string,
) {
  return lazy(async () => {
    const module = await factory()
    const Page = module[exportName]

    if (typeof Page !== 'function') {
      throw new Error(`Export "${exportName}" is not a React component`)
    }

    return { default: Page as ComponentType }
  })
}
