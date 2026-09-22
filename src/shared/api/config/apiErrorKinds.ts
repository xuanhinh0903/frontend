// Client-side failure kinds. ApiError.status is a server status (number) or one of these.
export const API_ERROR_KINDS = [
  'NETWORK',
  'TIMEOUT',
  'ABORTED',
  'PARSE',
] as const
