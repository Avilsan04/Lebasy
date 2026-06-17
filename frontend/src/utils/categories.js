export function normalizeCategories(value) {
  const rawCategories = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  const categories = [];
  const seen = new Set();

  for (const rawCategory of rawCategories) {
    const category = String(rawCategory || '').trim();
    const key = category.toLowerCase();

    if (category && !seen.has(key)) {
      categories.push(category);
      seen.add(key);
    }
  }

  return categories;
}

export function getProductCategories(product) {
  if (Array.isArray(product?.categories)) {
    return normalizeCategories(product.categories);
  }

  return normalizeCategories(product?.category || '');
}

export function categoriesToText(product) {
  return getProductCategories(product).join(', ');
}

