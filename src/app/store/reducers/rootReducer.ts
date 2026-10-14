import { combineReducers } from '@reduxjs/toolkit'
import { authReducer } from '@/features/auth/slices'
import { demoReducer } from '@/features/demo/slices'

export const rootReducer = combineReducers({
  auth: authReducer,
  demo: demoReducer,
})
