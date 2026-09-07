import Link from "next/link";
import StarRating from "@/components/shared/star-rating";
import PriceDisplay from "@/components/shared/price-display";

interface Product {
  id: string;
  name: string;
  specs?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  image: string;
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-lg border border-[var(--color-border)] overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[var(--color-bg-alt)] flex items-center justify-center">
        <div className="text-4xl">📱</div>

        {/* Discount Badge */}
        {product.discount && product.discount > 0 && (
          <span className="absolute top-3 left-3 bg-[var(--color-accent)] text-white text-xs font-bold px-2 py-1 rounded-full">
            {product.discount}% off
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)]">
          {product.name}
        </h3>

        {product.specs && (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {product.specs}
          </p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={product.rating} />
            <span className="text-xs text-[var(--color-text-muted)]">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-3">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
          />
        </div>

        {/* Add to Cart */}
        <button className="w-full mt-3 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
