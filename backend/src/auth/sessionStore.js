import crypto from 'node:crypto';

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

function timingSafeEquals(left, right) {
  return crypto.timingSafeEqual(hash(left), hash(right));
}

export function credentialsAreValid(username, password, config) {
  return (
    timingSafeEquals(username, config.adminUser) &&
    timingSafeEquals(password, config.adminPassword)
  );
}

export function createSessionStore({ ttlMs }) {
  const sessions = new Map();

  function purgeExpired() {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
      if (session.expiresAt <= now) {
        sessions.delete(token);
      }
    }
  }

  return {
    create(username) {
      purgeExpired();
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, {
        username,
        expiresAt: Date.now() + ttlMs
      });
      return token;
    },

    get(token) {
      if (!token) {
        return null;
      }

      const session = sessions.get(token);
      if (!session) {
        return null;
      }

      if (session.expiresAt <= Date.now()) {
        sessions.delete(token);
        return null;
      }

      return session;
    },

    destroy(token) {
      if (token) {
        sessions.delete(token);
      }
    }
  };
}

