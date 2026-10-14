import { describe, expect, it } from 'vitest'
import { parseDemoUsers } from './parseDemoUsers'

const raw = {
  id: 1,
  name: 'Leanne Graham',
  username: 'Bret',
  email: 'Sincere@april.biz',
  phone: '1-770-736-8031 x56442',
  website: 'hildegard.org',
  address: { city: 'Gwenborough' },
  company: { name: 'Romaguera-Crona' },
}

describe('parseDemoUsers', () => {
  it('maps the jsonplaceholder shape to DemoUser', () => {
    expect(parseDemoUsers([raw])).toEqual([
      {
        id: 1,
        name: 'Leanne Graham',
        username: 'Bret',
        email: 'Sincere@april.biz',
        phone: '1-770-736-8031 x56442',
        website: 'hildegard.org',
        companyName: 'Romaguera-Crona',
        city: 'Gwenborough',
      },
    ])
  })

  it('defaults optional fields and drops malformed users', () => {
    const minimal = { id: 2, name: 'A', username: 'a', email: 'a@b.c' }
    expect(parseDemoUsers([minimal, { id: '3' }, null])).toEqual([
      {
        ...minimal,
        phone: '',
        website: '',
        companyName: '',
        city: '',
      },
    ])
  })

  it('rejects a body that is not an array', () => {
    expect(() => parseDemoUsers({ users: [] })).toThrow()
    expect(() => parseDemoUsers({ users: [] })).toThrow(
      expect.objectContaining({ status: 'PARSE' }),
    )
  })
})
