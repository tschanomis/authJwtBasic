const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../app');
const { loadConfig } = require('../config');
const { hashPassword, verifyPassword } = require('../password');

const password = 'test-only-long-password';
let config;
before(async () => {
  config = loadConfig({ JWT_SECRET: 'a'.repeat(64), AUTH_USERNAME: 'test-user',
    AUTH_PASSWORD_HASH: await hashPassword(password) });
});

test('configuration fails closed without secrets or with malformed hashes', () => {
  assert.throws(() => loadConfig({}));
  assert.throws(() => loadConfig({ JWT_SECRET: 'secret' }));
  assert.throws(() => loadConfig({ JWT_SECRET: 'a'.repeat(64), AUTH_USERNAME: 'user', AUTH_PASSWORD_HASH: 'plaintext' }));
});

test('scrypt uses random salts and verifies passwords', async () => {
  const otherHash = await hashPassword(password);
  assert.notEqual(otherHash, config.passwordHash);
  assert.equal(await verifyPassword(password, otherHash), true);
  assert.equal(await verifyPassword('wrong', otherHash), false);
});

test('valid login returns a short-lived token and permits protected access', async () => {
  const app = createApp(config);
  const res = await request(app).post('/auth/signup').send({ username: config.username, password }).expect(200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.deepEqual(res.body.user, { username: config.username });
  assert.equal(JSON.stringify(res.body).includes(password), false);
  const token = res.headers['x-access-token'];
  const claims = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'authJwtBasic', audience: 'authJwtBasic-api' });
  assert.equal(claims.exp - claims.iat, 900);
  await request(app).post('/auth/protected').set('Authorization', `Bearer ${token}`).expect(200);
  await request(app).post(`/auth/protected?token=${token}`).expect(401);
});

test('bad passwords and unknown usernames return the same 401', async () => {
  const app = createApp(config);
  const first = await request(app).post('/auth/signup').send({ username: config.username, password: 'wrong' }).expect(401);
  const second = await request(app).post('/auth/signup').send({ username: 'unknown', password }).expect(401);
  assert.deepEqual(first.body, second.body);
});

test('invalid and oversized input is rejected', async () => {
  const app = createApp(config);
  for (const body of [{}, { username: [], password }, { username: 'user', password: {} }]) {
    await request(app).post('/auth/signup').send(body).expect(400);
  }
  await request(app).post('/auth/signup').set('Content-Type', 'application/json').send('{').expect(400);
  await request(app).post('/auth/signup').send({ username: 'user', password: 'x'.repeat(5000) }).expect(413);
});

test('invalid tokens, algorithms and claims are rejected', async () => {
  const app = createApp(config);
  const options = { algorithm: 'HS256', subject: config.username, issuer: 'authJwtBasic', audience: 'authJwtBasic-api', expiresIn: '15m' };
  const tokens = [
    jwt.sign({}, 'b'.repeat(64), options),
    jwt.sign({}, config.jwtSecret, { ...options, expiresIn: -1 }),
    jwt.sign({}, config.jwtSecret, { ...options, issuer: 'other' }),
    jwt.sign({}, config.jwtSecret, { ...options, audience: 'other' }),
    jwt.sign({}, config.jwtSecret, { ...options, subject: 'other' }),
    jwt.sign({}, config.jwtSecret, { ...options, algorithm: 'HS384' }),
    jwt.sign({ sub: config.username, iss: options.issuer, aud: options.audience }, config.jwtSecret),
    'not-a-token',
  ];
  await request(app).post('/auth/protected').expect(401);
  for (const token of tokens) {
    await request(app).post('/auth/protected').set('Authorization', `Bearer ${token}`).expect(401);
  }
});

test('login attempts are limited and CORS exposes tokens only to the configured origin', async () => {
  const app = createApp(config);
  for (let i = 0; i < 10; i++) await request(app).post('/auth/signup').send({}).expect(400);
  await request(app).post('/auth/signup').send({}).expect(429);
  const res = await request(app).options('/auth/signup').set('Origin', config.clientOrigin).set('Access-Control-Request-Method', 'POST').expect(204);
  assert.equal(res.headers['access-control-allow-origin'], config.clientOrigin);
  const other = await request(app).options('/auth/signup').set('Origin', 'https://other.example').set('Access-Control-Request-Method', 'POST');
  assert.notEqual(other.headers['access-control-allow-origin'], 'https://other.example');
});
