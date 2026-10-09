const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createProperty, getPropertyDetails, updateProperty } = require('../services/propertiesService');

test('creation and update retain postal codes as text', async () => {
  const queries = [];
  const db = {
    async getAsync(sql) {
      if (sql.includes('FROM properties p')) return { id: 'property-1', slug: 'studio', title: 'Studio', host_id: 3, postal_code: '06000', price_per_night: 90 };
      return null;
    },
    async allAsync() { return []; },
    async runAsync(sql, params) { queries.push({ sql, params }); return { changes: 1 }; },
  };

  const created = await createProperty(db, { id: 'property-1', title: 'Studio', host_id: 3, postal_code: '06000', price_per_night: 90 });
  assert.equal(created.postal_code, '06000');
  assert.match(queries[0].sql, /postal_code/);
  assert.ok(queries[0].params.includes('06000'));
  assert.equal((await getPropertyDetails(db, 'property-1')).postal_code, '06000');
  await updateProperty(db, 'property-1', { postal_code: '75001' });
  assert.match(queries.at(-1).sql, /postal_code/);
  assert.ok(queries.at(-1).params.includes('75001'));
  await assert.rejects(createProperty(db, { title: 'Studio', host_id: 3, postal_code: '6000' }), (error) => error.status === 400);
  await assert.rejects(updateProperty(db, 'property-1', { postal_code: 6000 }), (error) => error.status === 400);
});