import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { DemoState, DemoUser } from '../types'

const initialState: DemoState = {
  users: [],
  status: 'idle',
  error: null,
}

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    // The demo saga calls the API; the reducer only tracks the request.
    demoUsersRequested(state) {
      state.status = 'loading'
      state.error = null
    },
    demoUsersSucceeded(state, action: PayloadAction<DemoUser[]>) {
      state.users = action.payload
      state.status = 'succeeded'
    },
    // Keeps the last loaded users so a failed reload does not blank the table.
    demoUsersFailed(state, action: PayloadAction<string>) {
      state.status = 'failed'
      state.error = action.payload
    },
  },
})

export const { demoUsersRequested, demoUsersSucceeded, demoUsersFailed } =
  demoSlice.actions
export const demoReducer = demoSlice.reducer
