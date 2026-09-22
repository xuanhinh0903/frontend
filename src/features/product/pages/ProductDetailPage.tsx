import { Link, useParams } from 'react-router'
import { PageShell, PATHS } from '@/shared'
import { useProduct } from '../hooks'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const product = useProduct(id)

  if (!product) {
    return (
      <PageShell title="Product not found">
        <p>No product matches id “{id}”.</p>
        <Link to={PATHS.products.root}>Back to products</Link>
      </PageShell>
    )
  }

  return (
    <PageShell title={product.name}>
      <p>{product.description}</p>
      <p className="product-detail__id">ID: {product.id}</p>
      <Link to={PATHS.products.root}>Back to products</Link>
    </PageShell>
  )
}
