const { test } = require('node:test');
const assert = require('node:assert/strict');
const sqlite3 = require('sqlite3');
const { initSchema } = require('../db');
const {
  getMyLatestRequest,
  submitOwnerRequest,
  listPendingOwnerRequests,
  decideOwnerRequest,
} = require('../services/ownerRequestsService');

function inMemoryDb() {
  const db = new sqlite3.Database(':memory:');
  db.execAsync = (sql) => new Promise((resolve, reject) => db.exec(sql, (error) => error ? reject(error) : resolve()));
  db.runAsync = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (error) {
    error ? reject(error) : resolve({ lastID: this.lastID, changes: this.changes });
  }));
  db.getAsync = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (error, row) => error ? reject(error) : resolve(row)));
  db.allAsync = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
  return db;
}

async function withDb(callback) {
  const db = inMemoryDb();
  try {
    await initSchema(db);
    await db.runAsync("INSERT INTO users(name, email, role) VALUES ('Client', 'client@example.com', 'client')");
    await db.runAsync("INSERT INTO users(name, email, role) VALUES ('Admin', 'admin@example.com', 'admin')");
    await callback(db);
  } finally {
    await new Promise((resolve) => db.close(resolve));
  }
}

test('owner request is tied to the client, allows one pending request, and preserves rejected history', async () => {
  await withDb(async (db) => {
    const submitted = await submitOwnerRequest(db, 1);
    assert.equal(submitted.status, 'pending');
    await assert.rejects(submitOwnerRequest(db, 1), (error) => error.status === 409);

    const rejected = await decideOwnerRequest(db, submitted.id, 2, 'reject');
    assert.equal(rejected.status, 'rejected');
    assert.deepEqual(await getMyLatestRequest(db, 1), {
      id: submitted.id, status: 'rejected', submitted_at: submitted.submitted_at, decided_at: rejected.decided_at,
    });

    const resubmitted = await submitOwnerRequest(db, 1);
    assert.notEqual(resubmitted.id, submitted.id);
    assert.equal(resubmitted.status, 'pending');
  });
});

test('admin list contains pending request identity and approval promotes atomically', async () => {
  await withDb(async (db) => {
    const submitted = await submitOwnerRequest(db, 1);
    assert.deepEqual(await listPendingOwnerRequests(db), [{
      id: submitted.id,
      user_id: 1,
      name: 'Client',
      email: 'client@example.com',
      status: 'pending',
      submitted_at: submitted.submitted_at,
      decided_at: null,
    }]);

    const approved = await decideOwnerRequest(db, submitted.id, 2, 'approve');
    assert.equal(approved.status, 'approved');
    assert.equal((await db.getAsync('SELECT role FROM users WHERE id = 1')).role, 'owner');
    await assert.rejects(decideOwnerRequest(db, submitted.id, 2, 'reject'), (error) => error.status === 409);
  });
});

test('approval rolls back the request if the requester is no longer a client', async () => {
  await withDb(async (db) => {
    const submitted = await submitOwnerRequest(db, 1);
    await db.runAsync("UPDATE users SET role = 'admin' WHERE id = 1");

    await assert.rejects(decideOwnerRequest(db, submitted.id, 2, 'approve'), (error) => error.status === 409);
    assert.equal((await db.getAsync('SELECT status FROM owner_requests WHERE id = ?', [submitted.id])).status, 'pending');
  });
});