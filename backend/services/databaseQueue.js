/**
 * Sérialise les appels asynchrones et transactions sur une connexion SQLite partagée.
 * @module services/databaseQueue
 */
const { AsyncLocalStorage } = require('node:async_hooks');

const context = new AsyncLocalStorage();
const queues = new WeakMap();

function enqueue(db, operation) {
  if (context.getStore() === db) return operation();
  const result = (queues.get(db) || Promise.resolve()).then(() => context.run(db, operation));
  queues.set(db, result.catch(() => {}));
  return result;
}

/** Installe une file d’exécution unique sur les méthodes Async de la connexion. */
function installQueue(db) {
  if (queues.has(db)) return;
  queues.set(db, Promise.resolve());
  for (const method of ['runAsync', 'getAsync', 'allAsync', 'execAsync']) {
    if (typeof db[method] !== 'function') continue;
    const original = db[method].bind(db);
    db[method] = (...args) => enqueue(db, () => original(...args));
  }
}

/**
 * Exécute une opération SQLite atomique sur la connexion partagée.
 * Les opérations sont sérialisées par connexion ; les appels imbriqués dans
 * l’opération courante réutilisent son contexte. En cas d’échec, la transaction
 * est annulée puis l’erreur d’origine est propagée.
 * @param {object} db Connexion SQLite munie des méthodes Async.
 * @param {Function} operation Travail asynchrone effectué dans la transaction.
 * @returns {Promise<unknown>} Résultat de l’opération après validation du commit.
 */
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