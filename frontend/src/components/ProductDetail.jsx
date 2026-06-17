import { getProductCategories } from '../utils/categories.js';

export function ProductDetail({ product, loading, error }) {
  if (loading) {
    return (
      <main className="product-detail-page">
        <p className="state-message">Cargando producto...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="product-detail-page">
        <a className="back-link" href="/">Volver al catalogo</a>
        <p className="state-message error">{error}</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-detail-page">
        <a className="back-link" href="/">Volver al catalogo</a>
        <div className="empty-state">
          <strong>Producto no encontrado.</strong>
          <span>Puede que haya sido eliminado o que la URL no sea correcta.</span>
        </div>
      </main>
    );
  }

  const categories = getProductCategories(product);

  return (
    <main className="product-detail-page">
      <a className="back-link" href="/">Volver al catalogo</a>

      <section className="product-detail">
        <div className="detail-media">
          {product.imageData ? (
            <img src={product.imageData} alt={product.name} />
          ) : (
            <div className="product-placeholder detail-placeholder">
              <span>LEBASY</span>
            </div>
          )}
        </div>

        <div className="detail-copy">
          <span className={product.available ? 'detail-status available' : 'detail-status unavailable'}>
            {product.available ? 'Disponible' : 'No disponible'}
          </span>
          {categories.length > 0 && (
            <div className="category-chip-list">
              {categories.map((category) => (
                <span className="category-chip detail-category" key={category}>{category}</span>
              ))}
            </div>
          )}
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <a className="primary-button detail-contact" href="tel:645752686">
            Contactar
          </a>
        </div>
      </section>
    </main>
  );
}
