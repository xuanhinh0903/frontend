import type { ApiError } from '@/shared/api'
import { isRecord } from '@/shared/utils'
import type { DemoUser } from '../types'

// Contract: https://jsonplaceholder.typicode.com/users returns an array of
// { id, name, username, email, phone, website, address: { city }, company: { name } }.

function optionalString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function toDemoUser(value: unknown): DemoUser | null {
  if (!isRecord(value) || typeof value.id !== 'number') return null
  const { name, username, email } = value
  if (
    typeof name !== 'string' ||
    typeof username !== 'string' ||
    typeof email !== 'string'
  )
    return null
  return {
    id: value.id,
    name,
    username,
    email,
    phone: optionalString(value.phone),
    website: optionalString(value.website),
    companyName: isRecord(value.company)
      ? optionalString(value.company.name)
      : '',
    city: isRecord(value.address) ? optionalString(value.address.city) : '',
  }
}

const invalidPayload: ApiError = {
  status: 'PARSE',
  message: 'Unexpected response from server',
}

// Rejects a non-array body; drops individual malformed users.
export function parseDemoUsers(value: unknown): DemoUser[] {
  if (!Array.isArray(value)) throw invalidPayload
  return value.flatMap((item) => {
    const user = toDemoUser(item)
    return user ? [user] : []
  })
}
