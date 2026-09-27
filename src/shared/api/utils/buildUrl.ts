import type { QueryParams } from '../types'

const ABSOLUTE_URL = /^[a-z][a-z\d+\-.]*:\/\//i

export function buildUrl(
  baseUrl: string,
  path: string,
  query?: QueryParams,
): string {
  const url = ABSOLUTE_URL.test(path)
    ? path
    : `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  if (!query) return url

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) search.append(key, String(value))
  }
  const queryString = search.toString()
  if (!queryString) return url
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`
}
