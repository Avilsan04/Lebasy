import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { AdminPage } from './components/AdminPage.jsx';
import { Footer } from './components/Footer.jsx';
import { Logo } from './components/Logo.jsx';
import { ProductDetail } from './components/ProductDetail.jsx';
import { PublicCatalog } from './components/PublicCatalog.jsx';

const ADMIN_PATH = '/admin-lebasy';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState('');
  const currentPath = window.location.pathname;
  const isAdminRoute = currentPath === ADMIN_PATH;
  const productDetailMatch = currentPath.match(/^\/producto\/([^/]+)$/);
  const productDetailId = productDetailMatch ? decodeURIComponent(productDetailMatch[1]) : null;
  const selectedProduct = productDetailId
    ? products.find((product) => product.id === productDetailId)
    : null;

  const loadProducts = useCallback(async () => {
    setProductError('');
    try {
      const data = await api.getProducts();
      setProducts(data.products);
    } catch (error) {
      setProductError(error.message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <div className="app-shell">
      {!isAdminRoute && (
        <header className="topbar">
          <a className="brand" href="/">
            <Logo className="topbar-logo" />
          </a>
          <a className="phone-link" href="tel:645752686">
            645752686
          </a>
        </header>
      )}

      {isAdminRoute ? (
        <AdminPage onProductsChanged={loadProducts} />
      ) : productDetailId ? (
        <ProductDetail
          product={selectedProduct}
          loading={loadingProducts}
          error={productError}
        />
      ) : (
        <PublicCatalog products={products} loading={loadingProducts} error={productError} />
      )}

      {!isAdminRoute && <Footer />}
    </div>
  );
}
