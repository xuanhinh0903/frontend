import { baseApi } from '@/shared/api'
import type { Product } from '../types'

// Backend contract (unconfirmed): GET /products -> Product[], GET /products/:id -> Product.
export const productApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Product'] })
  .injectEndpoints({
    endpoints: (builder) => ({
      getProducts: builder.query<Product[], void>({
        query: () => '/products',
        providesTags: (result) => [
          ...(result ?? []).map(({ id }) => ({ type: 'Product' as const, id })),
          { type: 'Product' as const, id: 'LIST' },
        ],
        keepUnusedDataFor: 30,
      }),
      getProduct: builder.query<Product, string>({
        query: (id) => `/products/${encodeURIComponent(id)}`,
        providesTags: (_result, _error, id) => [{ type: 'Product', id }],
        keepUnusedDataFor: 30,
      }),
    }),
  })

export const { useGetProductsQuery, useGetProductQuery } = productApi
