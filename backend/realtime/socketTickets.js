/**
 * Émet et vérifie les tickets Socket.IO distincts des JWT REST.
 * @module realtime/socketTickets
 */
const jwt = require('jsonwebtoken');

const options = { algorithm: 'HS256', audience: 'messaging-socket', issuer: 'kasa-messaging' };
const secret = () => {
  const configured = process.env.MESSAGING_SOCKET_SECRET || process.env.JWT_SECRET;
  if (!configured && process.env.NODE_ENV === 'production') throw new Error('Messaging secret is required');
  return configured || 'change-me-in-prod';
};

/** Émet un ticket socket distinct du JWT REST, valable au plus cinq minutes et borné par la session. */
function issueTicket(userId, sessionExpiresAt) {
  const expiresAt = Math.min(Date.now() + 5 * 60 * 1000, sessionExpiresAt);
  const expiresIn = Math.floor((expiresAt - Date.now()) / 1000);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) throw Object.assign(new Error('Session expired'), { status: 401 });
  const token = jwt.sign({}, secret(), { ...options, subject: String(userId), expiresIn });
  return { token, expires_at: new Date(expiresAt).toISOString() };
}

/** Vérifie signature, audience, émetteur et sujet du ticket destiné au handshake Socket.IO. */
function verifyTicket(token) {
  if (typeof token !== 'string' || token.length > 2048) throw new Error('Invalid ticket');
  const payload = jwt.verify(token, secret(), { algorithms: ['HS256'], audience: options.audience, issuer: options.issuer });
  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error('Invalid ticket subject');
  return { userId, expiresAt: payload.exp * 1000 };
}

module.exports = { issueTicket, verifyTicket };