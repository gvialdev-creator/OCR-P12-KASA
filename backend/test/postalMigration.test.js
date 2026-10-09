const { test } = require('node:test');
const assert = require('node:assert/strict');
const sqlite3 = require('sqlite3');
const { initSchema } = require('../db');

function inMemoryDb() {
  const db = new sqlite3.Database(':memory:');
  db.execAsync = (sql) => new Promise((resolve, reject) => db.exec(sql, (error) => error ? reject(error) : resolve()));
  db.allAsync = (sql) => new Promise((resolve, reject) => db.all(sql, (error, rows) => error ? reject(error) : resolve(rows)));
  db.runAsync = (sql) => new Promise((resolve, reject) => db.run(sql, function (error) { error ? reject(error) : resolve({ changes: this.changes }); }));
  return db;
}

test('migration preserves old properties and is idempotent', async () => {
  for (const alreadyMigrated of [false, true]) {
    const db = inMemoryDb();
    try {
      if (!alreadyMigrated) {
        await db.execAsync('CREATE TABLE properties (id TEXT PRIMARY KEY, title TEXT, slug TEXT, description TEXT, cover TEXT, location TEXT, host_id INTEGER, rating_avg REAL, ratings_count INTEGER, price_per_night INTEGER); INSERT INTO properties (id, title, slug, host_id, price_per_night) VALUES ("old", "Ancien", "ancien", 1, 80);');
      }
      await initSchema(db);
      await initSchema(db);
      const columns = await db.allAsync("PRAGMA table_info('properties')");
      assert.equal(columns.filter((column) => column.name === 'postal_code').length, 1);
      if (!alreadyMigrated) {
        const rows = await db.allAsync('SELECT id, postal_code FROM properties');
        assert.deepEqual(rows, [{ id: 'old', postal_code: null }]);
      }
    } finally {
      await new Promise((resolve) => db.close(resolve));
    }
  }
});