import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct
} from '../src/services/productService.js';

const config = {
  maxImageDataUrlBytes: 1024 * 1024
};

function createMemoryRepository(initialProducts = []) {
  let products = [...initialProducts];

  return {
    async readAll() {
      return [...products];
    },
    async writeAll(nextProducts) {
      products = [...nextProducts];
    }
  };
}

test('crea y lista productos normalizados', async () => {
  const repository = createMemoryRepository();

  const created = await createProduct(repository, {
    name: 'Bolso dorado',
    categories: ['Bolso', 'Pulsera'],
    description: 'Edicion elegante',
    available: true,
    imageData: ''
  }, config);

  const products = await listProducts(repository);

  assert.equal(created.name, 'Bolso dorado');
  assert.deepEqual(created.categories, ['Bolso', 'Pulsera']);
  assert.equal(created.category, 'Bolso');
  assert.equal(created.available, true);
  assert.equal(products.length, 1);
  assert.equal(products[0].id, created.id);
});

test('rechaza productos sin nombre', async () => {
  const repository = createMemoryRepository();

  await assert.rejects(
    createProduct(repository, {
      name: '',
      description: 'Sin nombre',
      available: true
    }, config),
    /nombre/
  );
});

test('actualiza y elimina productos', async () => {
  const repository = createMemoryRepository();
  const created = await createProduct(repository, {
    name: 'Producto inicial',
    categories: ['Prueba'],
    description: 'Descripcion inicial',
    available: false
  }, config);

  const updated = await updateProduct(repository, created.id, {
    name: 'Producto final',
    categories: ['Cristal', 'Collar'],
    description: 'Descripcion final',
    available: true
  }, config);

  assert.equal(updated.name, 'Producto final');
  assert.deepEqual(updated.categories, ['Cristal', 'Collar']);
  assert.equal(updated.available, true);

  await deleteProduct(repository, created.id);
  assert.deepEqual(await listProducts(repository), []);
});

test('mantiene compatibilidad con categoria antigua', async () => {
  const repository = createMemoryRepository([{
    id: 'producto-antiguo',
    name: 'Producto antiguo',
    category: 'Pulsera',
    description: 'Producto previo al cambio de multiples categorias',
    available: true,
    imageData: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }]);

  const products = await listProducts(repository);

  assert.deepEqual(products[0].categories, ['Pulsera']);
  assert.equal(products[0].category, 'Pulsera');
});
