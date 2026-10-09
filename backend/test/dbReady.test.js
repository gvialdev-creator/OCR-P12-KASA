const { test } = require('node:test');
const assert = require('node:assert/strict');
const dbReady = require('../middlewares/dbReady');

function responseRecorder() {
  const response = {
    statusCode: 200,
    body: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return response;
}

test('dbReady responds 503 until initialization publishes a database', () => {
  const response = responseRecorder();
  let nextCalled = false;

  dbReady({ app: { locals: {} } }, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { error: 'Database not ready' });
  assert.equal(nextCalled, false);
});

test('dbReady continues when initialization publishes a database', () => {
  const response = responseRecorder();
  let nextCalled = false;

  dbReady({ app: { locals: { db: {} } } }, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 200);
  assert.equal(nextCalled, true);
});