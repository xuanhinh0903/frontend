import type { DemoRootState } from '../types'

export const selectDemoUsers = (state: DemoRootState) => state.demo.users

export const selectDemoStatus = (state: DemoRootState) => state.demo.status

export const selectDemoError = (state: DemoRootState) => state.demo.error
