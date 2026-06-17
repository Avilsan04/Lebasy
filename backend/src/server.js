import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as defaultConfig } from './config.js';
import { credentialsAreValid, createSessionStore } from './auth/sessionStore.js';
import {
  applyCors,
  clearCookie,
  createHttpError,
  handleError,
  parseCookies,
  readJsonBody,
  sendJson,
  setSessionCookie
} from './http.js';
import { createProductRepository } from './storage/productRepository.js';
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct
} from './services/productService.js';

function getSession(req, sessions, config) {
  const cookies = parseCookies(req);
  return sessions.get(cookies[config.sessionCookieName]);
}

function requireAdmin(req, sessions, config) {
  const session = getSession(req, sessions, config);

  if (!session) {
    throw createHttpError(401, 'Debes iniciar sesion como administrador.');
  }

  return session;
}

function getProductId(pathname) {
  const match = pathname.match(/^\/api\/admin\/products\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function createApp(config = defaultConfig) {
  const repository = createProductRepository(config);
  const sessions = createSessionStore({ ttlMs: config.sessionTtlMs });

  return http.createServer(async (req, res) => {
    applyCors(req, res, config);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const { pathname } = requestUrl;

      if (req.method === 'GET' && pathname === '/api/health') {
        sendJson(res, 200, { status: 'ok' });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/products') {
        sendJson(res, 200, { products: await listProducts(repository) });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/auth/login') {
        const body = await readJsonBody(req, config.maxBodyBytes);

        if (!credentialsAreValid(body.username, body.password, config)) {
          throw createHttpError(401, 'Usuario o contrasena incorrectos.');
        }

        const token = sessions.create(config.adminUser);
        setSessionCookie(res, config.sessionCookieName, token, Math.floor(config.sessionTtlMs / 1000));
        sendJson(res, 200, { authenticated: true, username: config.adminUser });
        return;
      }

      if (req.method === 'GET' && pathname === '/api/auth/me') {
        const session = getSession(req, sessions, config);
        sendJson(res, 200, session
          ? { authenticated: true, username: session.username }
          : { authenticated: false });
        return;
      }

      if (req.method === 'POST' && pathname === '/api/auth/logout') {
        const cookies = parseCookies(req);
        sessions.destroy(cookies[config.sessionCookieName]);
        clearCookie(res, config.sessionCookieName);
        sendJson(res, 200, { authenticated: false });
        return;
      }

      if (pathname === '/api/admin/products') {
        requireAdmin(req, sessions, config);

        if (req.method === 'GET') {
          sendJson(res, 200, { products: await listProducts(repository) });
          return;
        }

        if (req.method === 'POST') {
          const body = await readJsonBody(req, config.maxBodyBytes);
          sendJson(res, 201, { product: await createProduct(repository, body, config) });
          return;
        }
      }

      const productId = getProductId(pathname);
      if (productId) {
        requireAdmin(req, sessions, config);

        if (req.method === 'PUT') {
          const body = await readJsonBody(req, config.maxBodyBytes);
          sendJson(res, 200, { product: await updateProduct(repository, productId, body, config) });
          return;
        }

        if (req.method === 'DELETE') {
          await deleteProduct(repository, productId);
          sendJson(res, 200, { deleted: true });
          return;
        }
      }

      throw createHttpError(404, 'Ruta no encontrada.');
    } catch (error) {
      handleError(res, error);
    }
  });
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (currentFile === entryFile) {
  const server = createApp(defaultConfig);
  server.listen(defaultConfig.port, () => {
    console.log(`Lebasy API escuchando en http://localhost:${defaultConfig.port}`);
  });
}

