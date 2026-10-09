const { test } = require('node:test');
const assert = require('node:assert/strict');
const { register, login, requestPasswordReset, resetPassword, changePassword, hashPassword, verifyPassword } = require('../services/authService');

function fakeDb(user = null) {
  const calls = [];
  return {
    calls,
    async runAsync(query, params) {
      calls.push({ query, params });
      return { lastID: 1 };
    },
    async getAsync(query, params) {
      calls.push({ query, params });
      return user;
    },
  };
}

async function rejectsWith400(operation) {
  await assert.rejects(operation, (error) => error.status === 400);
}

test('registration rejects malformed emails and weak passwords before writing', async () => {
  const db = fakeDb();
  for (const email of ['', 'a@b', 'a @b.com', 42]) {
    await rejectsWith400(register(db, { name: 'Alice', email, password: 'GoodPass1!' }));
  }
  for (const password of ['Ab1!xyz', 'lowercase1!', 'UPPERCASE1!', 'NoDigits!', 'NoSymbol1', 12345678]) {
    await rejectsWith400(register(db, { name: 'Alice', email: 'alice@example.com', password }));
  }
  assert.equal(db.calls.length, 0);
});

test('registration trims a valid email and stores a hashed password', async () => {
  const user = { id: 1, name: 'Alice', email: 'Alice@example.com', role: 'client' };
  const db = fakeDb(user);
  const result = await register(db, { name: 'Alice', email: '  Alice@example.com ', password: 'GoodPass1!', role: 'owner' });
  assert.equal(result.user.email, user.email);
  assert.ok(result.token);
  assert.equal(db.calls[0].params[1], user.email);
  assert.notEqual(db.calls[0].params[2], 'GoodPass1!');
  assert.equal(db.calls[0].params[4], 'client');
});

test('login trims email and accepts an existing six-character password', async () => {
  const db = fakeDb({ id: 1, name: 'Alice', email: 'Alice@example.com', role: 'client', password_hash: hashPassword('old123') });
  const result = await login(db, { email: ' Alice@example.com ', password: 'old123' });
  assert.ok(result.token);
  assert.equal(db.calls[0].params[0], 'Alice@example.com');
  await assert.rejects(login(db, { email: 'Alice@example.com', password: 'wrong' }), (error) => error.status === 401);
  await rejectsWith400(login(db, { email: 'bad', password: 'old123' }));
});

test('reset request rejects malformed emails but does not reveal unknown valid emails', async () => {
  const db = fakeDb();
  await rejectsWith400(requestPasswordReset(db, { email: 'bad' }));
  const response = await requestPasswordReset(db, { email: ' missing@example.com ' });
  assert.equal(response.ok, true);
  assert.equal(db.calls[0].params[0], 'missing@example.com');
  assert.equal(db.calls.length, 1);
});

test('reset rejects weak passwords and hashes valid new ones', async () => {
  const db = fakeDb({ id: 1 });
  await rejectsWith400(resetPassword(db, { token: 'reset-token', password: 'old123' }));
  assert.equal(db.calls.length, 0);
  const result = await resetPassword(db, { token: 'reset-token', password: 'GoodPass1!' });
  assert.equal(result.ok, true);
  assert.notEqual(db.calls[1].params[0], 'GoodPass1!');
});

test('change password rejects weak values and stores a verifiable hash', async () => {
  const db = fakeDb();
  await rejectsWith400(changePassword(db, 12, 'weak'));
  assert.equal(db.calls.length, 0);

  assert.deepEqual(await changePassword(db, 12, 'NewPass1!'), { ok: true });
  assert.equal(db.calls[0].params[1], 12);
  assert.notEqual(db.calls[0].params[0], 'NewPass1!');
  assert.equal(verifyPassword('NewPass1!', db.calls[0].params[0]), true);
});