import { isApiErrorStatus } from '@/shared/api'
import { useGetProductQuery, useGetProductsQuery } from '../services'

export function useProducts() {
  return useGetProductsQuery()
}

export function useProduct(id: string | undefined) {
  const query = useGetProductQuery(id ?? '', { skip: !id })
  return { ...query, isNotFound: !id || isApiErrorStatus(query.error, 404) }
}
