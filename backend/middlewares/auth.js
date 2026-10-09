const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';

function authenticate(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const [scheme, token] = auth.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      if (payload.aud || payload.iss || !Number.isSafeInteger(payload.id) || payload.id <= 0) throw new Error('Invalid session principal');
      req.user = { id: payload.id, role: payload.role, name: payload.name, email: payload.email };
      req.sessionExpiresAt = payload.exp * 1000;
    } catch (e) {
      // invalid token -> ignore for authenticate(), but requireAuth will block
    }
  }
  next();
}

function requireAuth(req, res, next) {
  authenticate(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'authentication required' });
    const db = req.app && req.app.locals && req.app.locals.db;
    if (!db || typeof db.getAsync !== 'function') return res.status(503).json({ error: 'Database not ready' });
    db.getAsync('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id])
      .then((user) => {
        if (!user) return res.status(401).json({ error: 'authentication required' });
        req.user = user;
        next();
      })
      .catch(() => res.status(503).json({ error: 'Unable to validate user access' }));
  });
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin required' });
    next();
  });
}

function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return function (req, res, next) {
    requireAuth(req, res, () => {
      if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ error: 'insufficient role' });
      }
      next();
    });
  };
}

function requireSelfOrAdmin(param = 'id') {
  return function (req, res, next) {
    requireAuth(req, res, () => {
      const requestedId = String(req.params && req.params[param]);
      if (req.user.role === 'admin' || String(req.user.id) === requestedId) return next();
      return res.status(403).json({ error: 'forbidden' });
    });
  };
}

module.exports = { authenticate, requireAuth, requireAdmin, requireRole, requireSelfOrAdmin };
