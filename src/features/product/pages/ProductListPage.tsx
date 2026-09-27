import { PageShell } from '@/shared'
import { ProductCard } from '../components'
import { useProducts } from '../hooks'

export function ProductListPage() {
  const { data: products = [], isLoading, isError } = useProducts()

  return (
    <PageShell title="Products">
      {isLoading && <p>Loading products…</p>}
      {isError && <p>Unable to load products.</p>}
      {!isLoading && !isError && products.length === 0 && <p>No products found.</p>}
      {!isLoading && !isError && products.length > 0 && (
        <ul className="product-list">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
