// Browsers cannot set headers on a WebSocket handshake, so the token travels in the query.
export function socketUrl(url: string, accessToken: string | null): string {
  const target = new URL(url)
  if (accessToken) target.searchParams.set('token', accessToken)
  return target.toString()
}
