/**
 * Refuse les routes API/auth tant que l’initialisation SQLite n’a pas abouti.
 * @module middlewares/dbReady
 */
module.exports = function dbReady(req, res, next) {
  const db = req.app && req.app.locals && req.app.locals.db;
  if (!db) return res.status(503).json({ error: 'Database not ready' });
  next();
};
