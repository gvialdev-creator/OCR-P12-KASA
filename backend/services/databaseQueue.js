const { AsyncLocalStorage } = require('node:async_hooks');

const context = new AsyncLocalStorage();
const queues = new WeakMap();

function enqueue(db, operation) {
  if (context.getStore() === db) return operation();
  const result = (queues.get(db) || Promise.resolve()).then(() => context.run(db, operation));
  queues.set(db, result.catch(() => {}));
  return result;
}

function installQueue(db) {
  if (queues.has(db)) return;
  queues.set(db, Promise.resolve());
  for (const method of ['runAsync', 'getAsync', 'allAsync', 'execAsync']) {
    if (typeof db[method] !== 'function') continue;
    const original = db[method].bind(db);
    db[method] = (...args) => enqueue(db, () => original(...args));
  }
}

function transaction(db, operation) {
  return enqueue(db, async () => {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      const result = await operation();
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await db.execAsync('ROLLBACK').catch(() => {});
      throw error;
    }
  });
}

module.exports = { installQueue, transaction };