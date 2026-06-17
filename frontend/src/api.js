import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const PRODUCTS_TABLE = 'products';
const PRODUCT_IMAGES_BUCKET = 'product-images';

function assertConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.');
  }
}

function normalizeProductRow(row) {
  const categories = Array.isArray(row.categories)
    ? row.categories.filter(Boolean)
    : [];

  return {
    id: row.id,
    name: row.name,
    category: categories[0] || '',
    categories,
    description: row.description,
    available: Boolean(row.available),
    imageData: row.image_url || '',
    imageUrl: row.image_url || '',
    imagePath: row.image_path || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeProductPayload(product) {
  return {
    name: String(product.name || '').trim(),
    categories: Array.isArray(product.categories) ? product.categories : [],
    description: String(product.description || '').trim(),
    available: Boolean(product.available)
  };
}

function safeFileName(fileName) {
  return String(fileName || 'producto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

async function currentUser() {
  assertConfigured();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

async function isAdminUser() {
  const user = await currentUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('admin_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function requireAdmin() {
  const isAdmin = await isAdminUser();

  if (!isAdmin) {
    throw new Error('Debes iniciar sesión como administrador.');
  }
}

async function uploadProductImage(file, oldImagePath = '') {
  if (!file) {
    return null;
  }

  const user = await currentUser();
  if (!user) {
    throw new Error('Debes iniciar sesión como administrador.');
  }

  const filePath = `${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '31536000',
      contentType: file.type || 'application/octet-stream',
      upsert: false
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  if (oldImagePath) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([oldImagePath]);
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return {
    image_url: data.publicUrl,
    image_path: filePath
  };
}

async function resolveImageFields(product) {
  if (product.imageFile) {
    return uploadProductImage(product.imageFile, product.imagePath || '');
  }

  if (product.removeImage && product.imagePath) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([product.imagePath]);
    return {
      image_url: '',
      image_path: ''
    };
  }

  return {
    image_url: product.imageUrl || product.imageData || '',
    image_path: product.imagePath || ''
  };
}

async function fetchProductById(productId) {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .eq('id', productId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const api = {
  async getProducts() {
    assertConfigured();

    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { products: data.map(normalizeProductRow) };
  },

  async getSession() {
    assertConfigured();

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }

    if (!data.session) {
      return { authenticated: false };
    }

    const isAdmin = await isAdminUser();
    return {
      authenticated: isAdmin,
      username: data.session.user.email || ''
    };
  },

  async login(credentials) {
    assertConfigured();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(credentials.username || '').trim(),
      password: credentials.password
    });

    if (error) {
      throw new Error('Usuario o contraseña incorrectos.');
    }

    const isAdmin = await isAdminUser();
    if (!isAdmin) {
      await supabase.auth.signOut();
      throw new Error('Este usuario no tiene permisos de administrador.');
    }

    return {
      authenticated: true,
      username: data.user?.email || ''
    };
  },

  async logout() {
    assertConfigured();
    await supabase.auth.signOut();
    return { authenticated: false };
  },

  async getAdminProducts() {
    await requireAdmin();
    return this.getProducts();
  },

  async createProduct(product) {
    await requireAdmin();
    const imageFields = await resolveImageFields(product);
    const payload = {
      ...normalizeProductPayload(product),
      ...imageFields
    };

    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { product: normalizeProductRow(data) };
  },

  async updateProduct(productId, product) {
    await requireAdmin();
    const imageFields = await resolveImageFields(product);
    const payload = {
      ...normalizeProductPayload(product),
      ...imageFields
    };

    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .update(payload)
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { product: normalizeProductRow(data) };
  },

  async deleteProduct(productId) {
    await requireAdmin();
    const product = await fetchProductById(productId);

    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .delete()
      .eq('id', productId);

    if (error) {
      throw new Error(error.message);
    }

    if (product?.image_path) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([product.image_path]);
    }

    return { deleted: true };
  }
};

