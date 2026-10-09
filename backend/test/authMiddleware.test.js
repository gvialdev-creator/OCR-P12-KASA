const { test } = require('node:test');
const assert = require('node:assert/strict');
const { requireAdmin, requireRole } = require('../middlewares/auth');
const { signToken } = require('../services/authService');

function invoke(middleware, tokenRole, databaseUser) {
  const req = {
    headers: { authorization: `Bearer ${signToken({ id: 7, role: tokenRole, name: 'User' })}` },
    app: { locals: { db: { getAsync: async () => databaseUser } } },
  };
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, body }); },
    };
    middleware(req, res, () => resolve({ status: 200, user: req.user }));
  });
}

test('admin authorization uses the current database role rather than a stale JWT role', async () => {
  const denied = await invoke(requireAdmin, 'admin', { id: 7, role: 'client', name: 'User' });
  assert.equal(denied.status, 403);

  const allowed = await invoke(requireAdmin, 'client', { id: 7, role: 'admin', name: 'User' });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.user.role, 'admin');
});

test('role authorization recognizes an approved owner before the old JWT expires', async () => {
  const result = await invoke(requireRole(['owner']), 'client', { id: 7, role: 'owner', name: 'User' });
  assert.equal(result.status, 200);
  assert.equal(result.user.role, 'owner');
});

test('authorization rejects a token whose user no longer exists', async () => {
  const result = await invoke(requireAdmin, 'admin', null);
  assert.equal(result.status, 401);
});