const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { createAuthRouter } = require('./routes/auth/auth');

function createApp(config) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.clientOrigin, exposedHeaders: ['x-access-token'] }));
  app.use('/auth', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/auth/signup', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many login attempts. Try again later.' },
  }));
  app.use(express.json({ limit: '4kb', strict: true }));
  app.use('/auth', createAuthRouter(config));
  app.get('/', (req, res) => res.send('JWT authentication demo'));
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    // Never log request bodies, authorization headers, or credentials.
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
