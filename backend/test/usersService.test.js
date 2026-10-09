const { test } = require('node:test');
const assert = require('node:assert/strict');
const { updateUser } = require('../services/usersService');

test('profile update cannot change the user role, even when called as admin', async () => {
  let writes = 0;
  const db = {
    async runAsync() { writes += 1; return { changes: 1 }; },
    async getAsync() { return { id: 1, name: 'Client', role: 'owner' }; },
  };

  await assert.rejects(updateUser(db, 1, { role: 'owner' }, { allowAdminRole: true }), (error) => error.status === 403);
  assert.equal(writes, 0);
});

test('profile update accepts trimmed name and email and returns email', async () => {
  const calls = [];
  const db = {
    async runAsync(query, params) { calls.push({ query, params }); return { changes: 1 }; },
    async getAsync() { return { id: 1, name: 'Marie Dupont', email: 'marie@example.com', picture: null, role: 'owner' }; },
  };

  const result = await updateUser(db, 1, { name: ' Marie Dupont ', email: ' marie@example.com ' });
  assert.deepEqual(result, { id: 1, name: 'Marie Dupont', email: 'marie@example.com', picture: null, role: 'owner' });
  assert.deepEqual(calls[0].params, ['Marie Dupont', 'marie@example.com', 1]);
});

test('profile update rejects invalid emails before writing', async () => {
  let writes = 0;
  const db = { async runAsync() { writes += 1; }, async getAsync() { return null; } };
  await assert.rejects(updateUser(db, 1, { email: 'not-an-email' }), (error) => error.status === 400);
  assert.equal(writes, 0);
});