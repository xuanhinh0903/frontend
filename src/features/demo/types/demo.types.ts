export type DemoUser = {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  companyName: string
  city: string
}

export type DemoUsersStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export type DemoState = {
  users: DemoUser[]
  status: DemoUsersStatus
  error: string | null
}

// Slice of the root state the demo selectors need; avoids importing the store.
export type DemoRootState = { demo: DemoState }
