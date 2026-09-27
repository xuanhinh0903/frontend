import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type UserPreferencesState = { colorScheme: 'light' | 'dark' }
const preferencesSlice = createSlice({
  name: 'userPreferences', initialState: { colorScheme: 'light' } as UserPreferencesState,
  reducers: { colorSchemeChanged(state, action: PayloadAction<UserPreferencesState['colorScheme']>) { state.colorScheme = action.payload } },
})
export const { colorSchemeChanged } = preferencesSlice.actions
export const userPreferencesReducer = preferencesSlice.reducer