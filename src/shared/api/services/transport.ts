import type { HttpMethod } from '../types'

type TransportOptions = {
  method: HttpMethod
  headers: Headers
  body?: BodyInit
  signal?: AbortSignal
  timeoutMs: number
}

export function sendRequest(
  url: string,
  { method, headers, body, signal, timeoutMs }: TransportOptions,
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal

  return fetch(url, {
    method,
    headers,
    body,
    signal: requestSignal,
  })
}
