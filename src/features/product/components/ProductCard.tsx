import { Link } from 'react-router'
import { PATHS } from '@/shared'
import type { Product } from '../hooks'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <h2 className="product-card__title">{product.name}</h2>
      <p>{product.description}</p>
      <Link to={PATHS.products.detail(product.id)}>View details</Link>
    </article>
  )
}
