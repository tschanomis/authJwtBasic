function loadConfig(env = process.env) {
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 random bytes');
  }
  if (!env.AUTH_USERNAME || env.AUTH_USERNAME.length > 128) {
    throw new Error('AUTH_USERNAME is required (maximum 128 characters)');
  }
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.AUTH_PASSWORD_HASH || '')) {
    throw new Error('AUTH_PASSWORD_HASH must be generated with npm run hash-password');
  }
  const clientOrigin = env.CLIENT_ORIGIN || 'http://localhost:3000';
  const url = new URL(clientOrigin);
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== clientOrigin) {
    throw new Error('CLIENT_ORIGIN must be an HTTP(S) origin without a trailing slash');
  }
  return { jwtSecret: env.JWT_SECRET, username: env.AUTH_USERNAME,
    passwordHash: env.AUTH_PASSWORD_HASH, clientOrigin };
}

module.exports = { loadConfig };
