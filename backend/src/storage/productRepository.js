import fs from 'node:fs/promises';
import path from 'node:path';

export function createProductRepository({ dataDir }) {
  const filePath = path.join(dataDir, 'products.json');

  async function ensureStore() {
    await fs.mkdir(dataDir, { recursive: true });

    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, '[]\n', 'utf8');
    }
  }

  return {
    async readAll() {
      await ensureStore();
      const content = await fs.readFile(filePath, 'utf8');
      const products = JSON.parse(content || '[]');

      if (!Array.isArray(products)) {
        throw new Error('El archivo de productos no contiene una lista valida.');
      }

      return products;
    },

    async writeAll(products) {
      await ensureStore();
      const tempPath = `${filePath}.tmp`;
      await fs.writeFile(tempPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
      await fs.rename(tempPath, filePath);
    }
  };
}

