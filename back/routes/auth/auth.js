const express = require('express');
const jwt = require('jsonwebtoken');
const { verifyPassword } = require('../../password');

const issuer = 'authJwtBasic';
const audience = 'authJwtBasic-api';

function createAuthRouter(config) {
  const router = express.Router();

  // Historical path retained: this is login, not registration.
  router.post('/signup', async (req, res, next) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || username.length === 0 || username.length > 128 ||
        typeof password !== 'string' || password.length === 0 || Buffer.byteLength(password) > 1024) {
      return res.status(400).json({ error: 'Invalid username or password format' });
    }
    try {
      // Perform the same password work for unknown usernames.
      const matches = await verifyPassword(password, config.passwordHash);
      if (!matches || username !== config.username) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({}, config.jwtSecret, {
        algorithm: 'HS256', subject: config.username, issuer, audience, expiresIn: '15m',
      });
      res.set('x-access-token', token);
      return res.json({ details: 'user connected', user: { username: config.username } });
    } catch (err) {
      next(err);
    }
  });

  router.post('/protected', (req, res) => {
    const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(req.get('Authorization') || '');
    const unauthorized = () => {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'Invalid or expired token' });
    };
    if (!match) return unauthorized();
    try {
      const claims = jwt.verify(match[1], config.jwtSecret, {
        algorithms: ['HS256'], issuer, audience, maxAge: '15m',
      });
      if (typeof claims !== 'object' || claims.sub !== config.username ||
          !Number.isInteger(claims.exp)) return unauthorized();
      return res.json({ mess: 'Donne du user', objectTests: { test: 'ok' } });
    } catch {
      return unauthorized();
    }
  });
  return router;
}

module.exports = { createAuthRouter };
