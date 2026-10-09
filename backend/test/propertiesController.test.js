const { test } = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('../controllers/propertiesController');

test('creation uses the authenticated user even if a different host is submitted', async () => {
  const queries = [];
  const db = {
    async getAsync(sql) {
      if (sql.includes('FROM properties p')) return { id: 'new-id', slug: 'studio', title: 'Studio', host_id: 3, host_name: 'Owner', postal_code: '06000', price_per_night: 90 };
      return null;
    },
    async allAsync() { return []; },
    async runAsync(sql, params) { queries.push({ sql, params }); return { changes: 1 }; },
  };
  let created;
  const response = {
    status(code) { assert.equal(code, 201); return this; },
    json(value) { created = value; },
  };
  await create({ app: { locals: { db } }, user: { id: 3, role: 'owner' }, body: {
    id: 'new-id', title: 'Studio', postal_code: '06000', price_per_night: 90,
    host_id: 999, host: { name: 'Fake owner' },
  } }, response);

  assert.equal(created.host.id, 3);
  assert.ok(queries[0].params.includes(3));
  assert.ok(!queries[0].params.includes(999));
  assert.equal(queries.some(({ sql }) => sql.includes('INSERT INTO users')), false);
});