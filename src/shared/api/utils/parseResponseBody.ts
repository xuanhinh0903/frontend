// Returns undefined for empty bodies, parsed JSON for JSON responses, text otherwise.
// Throws SyntaxError on malformed JSON (mapped to a PARSE ApiError by the client).
export async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return undefined
  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('json') ? JSON.parse(text) : text
}
