import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(sourceDir, '..');

function readOrigins() {
  const value = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN;
  const origins = value || 'http://localhost:5173,http://127.0.0.1:5173';
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 8080),
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'Lebasy2026!',
  frontendOrigins: readOrigins(),
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(backendRoot, 'data'),
  sessionCookieName: 'lebasy_session',
  sessionTtlMs: 1000 * 60 * 60 * 8,
  maxBodyBytes: 8 * 1024 * 1024,
  maxImageDataUrlBytes: 5 * 1024 * 1024
};

