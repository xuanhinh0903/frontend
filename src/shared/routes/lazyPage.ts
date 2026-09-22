import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

// `Name` is inferred from `exportName` only (NoInfer), so a misspelt export or one
// that is not a component fails to compile instead of failing at runtime.
export function lazyPage<Name extends string>(
  factory: () => Promise<Record<NoInfer<Name>, ComponentType>>,
  exportName: Name,
): LazyExoticComponent<ComponentType> {
  return lazy(async () => {
    const module = await factory()
    return { default: module[exportName] }
  })
}
