import { useMemo, useState } from 'react';
import { getProductCategories } from '../utils/categories.js';
import { Logo } from './Logo.jsx';
import { ProductCard } from './ProductCard.jsx';

export function PublicCatalog({ products, loading, error }) {
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState([]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set();

    for (const product of products) {
      for (const productCategory of getProductCategories(product)) {
        uniqueCategories.add(productCategory);
      }
    }

    return [...uniqueCategories].sort((left, right) => left.localeCompare(right, 'es'));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const productCategories = getProductCategories(product);
      const matchesText = !normalizedQuery
        || product.name.toLowerCase().includes(normalizedQuery)
        || product.description.toLowerCase().includes(normalizedQuery)
        || productCategories.some((productCategory) => productCategory.toLowerCase().includes(normalizedQuery));

      const matchesAvailability = availability === 'all'
        || (availability === 'available' && product.available)
        || (availability === 'unavailable' && !product.available);

      const matchesCategory = selectedCategories.length === 0
        || productCategories.some((productCategory) => selectedCategories.includes(productCategory));

      return matchesText && matchesAvailability && matchesCategory;
    });
  }, [availability, products, query, selectedCategories]);

  function toggleCategory(category) {
    setSelectedCategories((currentCategories) => {
      if (currentCategories.includes(category)) {
        return currentCategories.filter((currentCategory) => currentCategory !== category);
      }

      return [...currentCategories, category];
    });
  }

  return (
    <main className="site-main">
      <section className="catalog-hero">
        <div className="hero-inner">
          <Logo className="hero-logo" />
          <p className="eyebrow">Catalogo oficial</p>
          <h1>Inventario de productos</h1>
          <p className="hero-copy">
            Seleccion cuidada de productos con estado de disponibilidad actualizado.
          </p>
        </div>
      </section>

      <section className="catalog-shell" aria-label="Catalogo de productos">
        <div className="catalog-toolbar">
          <div className="catalog-heading">
            <p className="section-kicker">Inventario</p>
            <h2>Productos</h2>

            <label className="search-field">
              <span>Buscar</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre o descripcion"
              />
            </label>
          </div>

          <div className="filters">
            <section className="filter-panel" aria-label="Filtrar productos">
              <div className="filter-panel-heading">
                <h3>Filtrar</h3>
                {(availability !== 'all' || selectedCategories.length > 0) && (
                  <button
                    type="button"
                    className="text-button compact-button"
                    onClick={() => {
                      setAvailability('all');
                      setSelectedCategories([]);
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <label className="select-field filter-state">
                <span>Estado</span>
                <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
                  <option value="all">Todos</option>
                  <option value="available">Disponibles</option>
                  <option value="unavailable">No disponibles</option>
                </select>
              </label>

              <div className="category-filter">
                <span>Categorias</span>
                {categories.length === 0 ? (
                  <p>No hay categorias todavia.</p>
                ) : (
                  <div className="category-options">
                    {categories.map((productCategory) => (
                      <label className="category-option" key={productCategory}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(productCategory)}
                          onChange={() => toggleCategory(productCategory)}
                        />
                        <span>{productCategory}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {loading && <p className="state-message">Cargando productos...</p>}
        {error && <p className="state-message error">{error}</p>}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="empty-state">
            <strong>No hay productos publicados.</strong>
            <span>Cuando el administrador anada productos apareceran aqui.</span>
          </div>
        )}

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
