export type Product = {
  id: string
  name: string
  description: string
}

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Sample A', description: 'First mock product' },
  { id: '2', name: 'Sample B', description: 'Second mock product' },
  { id: '3', name: 'Sample C', description: 'Third mock product' },
]

export function useProducts() {
  return MOCK_PRODUCTS
}

export function useProduct(id: string | undefined) {
  if (!id) return undefined
  return MOCK_PRODUCTS.find((product) => product.id === id)
}
