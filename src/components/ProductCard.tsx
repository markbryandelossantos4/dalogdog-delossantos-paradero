import type { Product } from '../pos'

type ProductCardProps = {
  product: Product
  quantity: number
  onAdd: (product: Product) => void
}

export function ProductCard({ product, quantity, onAdd }: ProductCardProps) {
  return (
    <button
      className={`product-card ${product.featured ? 'product-card-featured' : ''}`}
      onClick={() => onAdd(product)}
      aria-label={`Add ${product.name}, ${product.price} pesos`}
    >
      <span className={`product-art art-${product.color}`} aria-hidden="true">
        <span className="art-sparkle">✳</span>
        <span className="product-emoji">{product.art}</span>
        {quantity > 0 && <span className="product-count">{quantity}</span>}
      </span>
      <span className="product-card-info">
        <span className="product-card-category">{product.category}</span>
        <span className="product-card-name">{product.name}</span>
        <span className="product-card-description">{product.description}</span>
        <span className="product-card-bottom">
          <strong>₱{product.price}</strong>
          <span className="add-circle" aria-hidden="true">+</span>
        </span>
      </span>
    </button>
  )
}
