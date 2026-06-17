import { getProductCategories } from '../utils/categories.js';

export function ProductCard({ product }) {
  const categories = getProductCategories(product);

  return (
    <a className="product-card" href={`/producto/${encodeURIComponent(product.id)}`} aria-label={`Ver ${product.name}`}>
      <div className="product-media">
        {product.imageData ? (
          <img src={product.imageData} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-placeholder" aria-label="Sin foto">
            <span>LEBASY</span>
          </div>
        )}
        <span className={product.available ? 'status available' : 'status unavailable'}>
          {product.available ? 'Disponible' : 'No disponible'}
        </span>
      </div>
      <div className="product-copy">
        {categories.length > 0 && (
          <div className="category-chip-list compact">
            {categories.map((category) => (
              <span className="category-chip" key={category}>{category}</span>
            ))}
          </div>
        )}
        <h3>{product.name}</h3>
        <span className="card-link">Ver producto</span>
      </div>
    </a>
  );
}
