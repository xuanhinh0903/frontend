import { createApi } from '@reduxjs/toolkit/query/react'
import { httpBaseQuery } from './baseQuery'

// The single RTK Query API slice. It defines no endpoints: each feature adds its own with
// baseApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...) in features/<name>/services.
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: httpBaseQuery,
  endpoints: () => ({}),
})
