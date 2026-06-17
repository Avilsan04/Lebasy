import crypto from 'node:crypto';
import { createHttpError } from '../http.js';

const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i;

function requiredText(value, fieldName, maxLength) {
  const text = String(value || '').trim();

  if (!text) {
    throw createHttpError(400, `${fieldName} es obligatorio.`);
  }

  if (text.length > maxLength) {
    throw createHttpError(400, `${fieldName} no puede superar ${maxLength} caracteres.`);
  }

  return text;
}

function optionalText(value, fieldName, maxLength) {
  const text = String(value || '').trim();

  if (text.length > maxLength) {
    throw createHttpError(400, `${fieldName} no puede superar ${maxLength} caracteres.`);
  }

  return text;
}

function normalizeCategories(value) {
  const rawCategories = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const categories = [];
  const seen = new Set();

  for (const rawCategory of rawCategories) {
    const category = optionalText(rawCategory, 'La categoria', 60);
    const key = category.toLowerCase();

    if (category && !seen.has(key)) {
      categories.push(category);
      seen.add(key);
    }
  }

  if (categories.length > 12) {
    throw createHttpError(400, 'Un producto no puede tener mas de 12 categorias.');
  }

  return categories;
}

function readProductCategories(product) {
  if (!product) {
    return [];
  }

  if (Array.isArray(product.categories)) {
    return normalizeCategories(product.categories);
  }

  return normalizeCategories(product.category || '');
}

function normalizeImageData(value, maxBytes) {
  const imageData = String(value || '').trim();

  if (!imageData) {
    return '';
  }

  if (!IMAGE_DATA_URL_PATTERN.test(imageData)) {
    throw createHttpError(400, 'La foto debe ser una imagen PNG, JPG, WEBP o GIF valida.');
  }

  if (Buffer.byteLength(imageData, 'utf8') > maxBytes) {
    throw createHttpError(400, 'La foto no puede superar 5 MB.');
  }

  return imageData;
}

function normalizeProductInput(input, config, existingProduct = null) {
  const imageWasSent = Object.prototype.hasOwnProperty.call(input, 'imageData');
  const categoriesWereSent = Object.prototype.hasOwnProperty.call(input, 'categories')
    || Object.prototype.hasOwnProperty.call(input, 'category');
  const nextImageData = imageWasSent
    ? normalizeImageData(input.imageData, config.maxImageDataUrlBytes)
    : existingProduct?.imageData || '';
  const nextCategories = categoriesWereSent
    ? normalizeCategories(input.categories ?? input.category)
    : readProductCategories(existingProduct);

  return {
    name: requiredText(input.name, 'El nombre', 80),
    categories: nextCategories,
    description: requiredText(input.description, 'La descripcion', 500),
    available: Boolean(input.available),
    imageData: nextImageData
  };
}

function sortNewestFirst(products) {
  return [...products].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function toPublicProduct(product) {
  const categories = readProductCategories(product);

  return {
    id: product.id,
    name: product.name,
    category: categories[0] || '',
    categories,
    description: product.description,
    available: Boolean(product.available),
    imageData: product.imageData || '',
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

export async function listProducts(repository) {
  const products = await repository.readAll();
  return sortNewestFirst(products).map(toPublicProduct);
}

export async function createProduct(repository, input, config) {
  const products = await repository.readAll();
  const now = new Date().toISOString();
  const product = {
    id: crypto.randomUUID(),
    ...normalizeProductInput(input, config),
    createdAt: now,
    updatedAt: now
  };

  await repository.writeAll([...products, product]);
  return toPublicProduct(product);
}

export async function updateProduct(repository, productId, input, config) {
  const products = await repository.readAll();
  const index = products.findIndex((product) => product.id === productId);

  if (index === -1) {
    throw createHttpError(404, 'Producto no encontrado.');
  }

  const existingProduct = products[index];
  const updatedProduct = {
    ...existingProduct,
    ...normalizeProductInput(input, config, existingProduct),
    updatedAt: new Date().toISOString()
  };

  products[index] = updatedProduct;
  await repository.writeAll(products);
  return toPublicProduct(updatedProduct);
}

export async function deleteProduct(repository, productId) {
  const products = await repository.readAll();
  const nextProducts = products.filter((product) => product.id !== productId);

  if (nextProducts.length === products.length) {
    throw createHttpError(404, 'Producto no encontrado.');
  }

  await repository.writeAll(nextProducts);
}
