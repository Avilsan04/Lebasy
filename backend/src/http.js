export function applyCors(req, res, config) {
  const origin = req.headers.origin;

  if (origin && config.frontendOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
}

export function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

export function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function readJsonBody(req, maxBytes) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw createHttpError(413, 'El contenido enviado es demasiado grande.');
    }
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim();
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw createHttpError(400, 'El JSON enviado no es valido.');
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};

  for (const part of header.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (!name) {
      continue;
    }
    cookies[name] = decodeURIComponent(valueParts.join('=') || '');
  }

  return cookies;
}

export function setSessionCookie(res, name, token, maxAgeSeconds) {
  const cookie = [
    `${name}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];

  if (process.env.NODE_ENV === 'production') {
    cookie.push('Secure');
  }

  res.setHeader('Set-Cookie', cookie.join('; '));
}

export function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export function handleError(res, error) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Ha ocurrido un error interno.' : error.message;
  sendJson(res, statusCode, { message });
}

