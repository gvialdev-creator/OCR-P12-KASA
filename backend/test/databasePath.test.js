const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DB_PATH, initialize, openDb, resolveDbPath } = require('../db');

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kasa-db-path-'));
}

function closeDb(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => error ? reject(error) : resolve());
  });
}

test('database path defaults to a backend-relative local file', () => {
  assert.equal(resolveDbPath({ NODE_ENV: 'development' }), DB_PATH);
  assert.equal(DB_PATH, path.join(__dirname, '..', 'data', 'kasa.sqlite3'));
});

test('database path defaults to the production data volume', () => {
  assert.equal(resolveDbPath({ NODE_ENV: 'production' }), '/app/data/kasa.sqlite3');
});

test('DB_PATH overrides defaults and relative paths are backend-relative', () => {
  assert.equal(resolveDbPath({ DB_PATH: '/var/lib/kasa.sqlite3' }), '/var/lib/kasa.sqlite3');
  assert.equal(
    resolveDbPath({ DB_PATH: 'storage/kasa.sqlite3' }),
    path.join(__dirname, '..', 'storage', 'kasa.sqlite3'),
  );
  assert.equal(resolveDbPath({ DB_PATH: ':memory:' }), ':memory:');
});

test('openDb creates the parent directory and supports in-memory databases', async () => {
  const directory = temporaryDirectory();
  const filename = path.join(directory, 'nested', 'database.sqlite3');
  let fileDb;
  let memoryDb;

  try {
    fileDb = openDb(filename);
    assert.equal(fs.existsSync(path.dirname(filename)), true);
    memoryDb = openDb(':memory:');
    await new Promise((resolve, reject) => {
      memoryDb.get('SELECT 1 AS value', (error, row) => {
        if (error) return reject(error);
        assert.equal(row.value, 1);
        resolve();
      });
    });
  } finally {
    if (memoryDb) await closeDb(memoryDb);
    if (fileDb) await closeDb(fileDb);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('production initialization creates schema without demo properties', async () => {
  const directory = temporaryDirectory();
  let db;

  try {
    db = await initialize({
      filename: path.join(directory, 'production', 'kasa.sqlite3'),
      env: { NODE_ENV: 'production' },
    });
    const row = await db.getAsync('SELECT COUNT(*) AS count FROM properties');
    assert.equal(row.count, 0);
  } finally {
    if (db) await closeDb(db);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('local initialization keeps seeding demo properties', async () => {
  const directory = temporaryDirectory();
  let db;

  try {
    db = await initialize({
      filename: path.join(directory, 'local', 'kasa.sqlite3'),
      env: { NODE_ENV: 'development' },
    });
    const row = await db.getAsync('SELECT COUNT(*) AS count FROM properties');
    assert.ok(row.count > 0);
  } finally {
    if (db) await closeDb(db);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});