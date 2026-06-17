import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { categoriesToText, getProductCategories, normalizeCategories } from '../utils/categories.js';
import { fileToDataUrl } from '../utils/image.js';
import { Logo } from './Logo.jsx';

const emptyForm = {
  name: '',
  categoriesText: '',
  description: '',
  available: true,
  imageData: '',
  imageFile: null,
  imagePath: ''
};

function buildProductPayload(form) {
  return {
    name: form.name,
    categories: normalizeCategories(form.categoriesText),
    description: form.description,
    available: form.available,
    imageData: form.imageData,
    imageUrl: form.imageFile ? '' : form.imageData,
    imageFile: form.imageFile,
    imagePath: form.imagePath,
    removeImage: !form.imageData && !form.imageFile
  };
}

export function AdminPage({ onProductsChanged }) {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const editingProduct = useMemo(
    () => products.find((product) => product.id === editingId) || null,
    [editingId, products]
  );

  async function loadAdminProducts() {
    const data = await api.getAdminProducts();
    setProducts(data.products);
  }

  useEffect(() => {
    let active = true;

    api.getSession()
      .then(async (session) => {
        if (!active) {
          return;
        }

        setIsAuthenticated(session.authenticated);
        if (session.authenticated) {
          await loadAdminProducts();
        }
      })
      .catch(() => {
        if (active) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (active) {
          setSessionChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.login(credentials);
      setIsAuthenticated(true);
      setCredentials({ username: '', password: '' });
      await loadAdminProducts();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await api.logout();
    setIsAuthenticated(false);
    setProducts([]);
    resetForm();
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');

    try {
      const imageData = await fileToDataUrl(file);
      setForm((currentForm) => ({ ...currentForm, imageData, imageFile: file }));
    } catch (imageError) {
      setError(imageError.message);
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      categoriesText: categoriesToText(product),
      description: product.description,
      available: product.available,
      imageData: product.imageData || '',
      imageFile: null,
      imagePath: product.imagePath || ''
    });
    setMessage('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (editingId) {
        await api.updateProduct(editingId, buildProductPayload(form));
        setMessage('Producto actualizado.');
      } else {
        await api.createProduct(buildProductPayload(form));
        setMessage('Producto anadido.');
      }

      await loadAdminProducts();
      await onProductsChanged();
      resetForm();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAvailability(product) {
    setError('');

    try {
      await api.updateProduct(product.id, {
        name: product.name,
        categories: getProductCategories(product),
        description: product.description,
        available: !product.available,
        imageData: product.imageData || '',
        imageUrl: product.imageUrl || product.imageData || '',
        imagePath: product.imagePath || '',
        imageFile: null,
        removeImage: false
      });
      await loadAdminProducts();
      await onProductsChanged();
    } catch (availabilityError) {
      setError(availabilityError.message);
    }
  }

  async function removeProduct(productId) {
    const confirmed = window.confirm('Quieres eliminar este producto?');
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await api.deleteProduct(productId);
      await loadAdminProducts();
      await onProductsChanged();
      if (editingId === productId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  if (!sessionChecked) {
    return (
      <main className="admin-page compact-admin">
        <p className="state-message">Verificando sesion...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-page compact-admin">
        <form className="login-panel" onSubmit={handleLogin}>
          <Logo className="login-logo" />
          <p className="section-kicker">Area privada</p>
          <h1>Administrador Lebasy</h1>
          <label>
            Email de administrador
            <input
              value={credentials.username}
              onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contrasena
            <input
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <Logo className="admin-logo" />
          <p className="section-kicker">Gestion interna</p>
          <h1>Inventario Lebasy</h1>
        </div>
        <button className="ghost-button" type="button" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </header>

      <section className="admin-layout">
        <form className="product-form" onSubmit={handleSubmit}>
          <div>
            <p className="section-kicker">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</p>
            <h2>{editingProduct ? editingProduct.name : 'Anadir producto'}</h2>
          </div>

          <label>
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              maxLength={80}
              required
            />
          </label>

          <label>
            Categorias
            <input
              value={form.categoriesText}
              onChange={(event) => setForm((current) => ({ ...current, categoriesText: event.target.value }))}
              maxLength={240}
              placeholder="Pulsera, collar, cristal..."
            />
          </label>

          <label>
            Descripcion
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              maxLength={500}
              rows={5}
              required
            />
          </label>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(event) => setForm((current) => ({ ...current, available: event.target.checked }))}
            />
            Disponible
          </label>

          <label>
            Foto
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageChange} />
          </label>

          {form.imageData && (
            <div className="image-preview">
              <img src={form.imageData} alt="Vista previa del producto" />
              <button
                type="button"
                className="text-button"
                onClick={() => setForm((current) => ({ ...current, imageData: '', imageFile: null }))}
              >
                Quitar foto
              </button>
            </div>
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Anadir producto'}
            </button>
            {editingId && (
              <button className="ghost-button" type="button" onClick={resetForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="inventory-panel">
          <div className="inventory-heading">
            <div>
              <p className="section-kicker">Productos</p>
              <h2>{products.length} en inventario</h2>
            </div>
          </div>

          {products.length === 0 && (
            <div className="empty-state compact">
              <strong>Sin productos todavia.</strong>
              <span>Anade el primero desde el formulario.</span>
            </div>
          )}

          <div className="inventory-list">
            {products.map((product) => (
              <article className="inventory-item" key={product.id}>
                <div className="inventory-thumb">
                  {product.imageData ? <img src={product.imageData} alt={product.name} /> : <span>LEBASY</span>}
                </div>
                <div className="inventory-details">
                  <strong>{product.name}</strong>
                  {getProductCategories(product).length > 0 && (
                    <div className="category-chip-list">
                      {getProductCategories(product).map((category) => (
                        <span className="category-chip" key={category}>{category}</span>
                      ))}
                    </div>
                  )}
                  <p>{product.description}</p>
                  <span className={product.available ? 'mini-status available' : 'mini-status unavailable'}>
                    {product.available ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <div className="inventory-actions">
                  <button type="button" className="text-button" onClick={() => toggleAvailability(product)}>
                    {product.available ? 'Ocultar' : 'Activar'}
                  </button>
                  <button type="button" className="text-button" onClick={() => editProduct(product)}>
                    Editar
                  </button>
                  <button type="button" className="danger-button" onClick={() => removeProduct(product.id)}>
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
