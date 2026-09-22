import { PageShell } from '@/shared'
import { ProductCard } from '../components'
import { useProducts } from '../hooks'

export function ProductListPage() {
  const products = useProducts()

  return (
    <PageShell title="Products">
      <ul className="product-list">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
