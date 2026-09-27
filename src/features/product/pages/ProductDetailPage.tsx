import { Link, useParams } from 'react-router'
import { PageShell, PATHS } from '@/shared'
import { useProduct } from '../hooks'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading, isError, isNotFound } = useProduct(id)

  if (isLoading) {
    return (
      <PageShell title="Loading product">
        <p>Loading…</p>
      </PageShell>
    )
  }

  if (isNotFound) {
    return (
      <PageShell title="Product not found">
        <p>No product matches id “{id}”.</p>
        <Link to={PATHS.products.root}>Back to products</Link>
      </PageShell>
    )
  }

  if (isError || !product) {
    return (
      <PageShell title="Unable to load product">
        <p>Please try again.</p>
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
