const conversations = require('../services/conversationsService');
const messages = require('../services/messagesService');
const { issueTicket } = require('../realtime/socketTickets');
const { publishMessageCreated, publishReadUpdated } = require('../realtime/messaging');

const limits = new WeakMap();
function rateLimit(kind, maximum) {
  return (req, res, next) => {
    let buckets = limits.get(req.app);
    if (!buckets) { buckets = new Map(); limits.set(req.app, buckets); }
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
    const key = `${kind}:${req.user.id}`;
    const bucket = buckets.get(key) || { count: 0, until: now + 60000 };
    buckets.set(key, bucket);
    if (++bucket.count > maximum) return res.status(429).json({ error: 'Too many requests' });
    next();
  };
}

const handle = (operation) => async (req, res) => {
  try { await operation(req, res, req.app.locals.db, req.user.id); }
  catch (error) { res.status(error.status || 503).json({ error: error.status ? error.message : 'Messaging unavailable' }); }
};

module.exports = {
  rateLimit,
  start: handle(async (req, res, db, userId) => res.status(201).json(await conversations.startConversation(db, userId, req.body?.recipient_id))),
  list: handle(async (req, res, db, userId) => res.json(await conversations.listConversations(db, userId, req.query))),
  get: handle(async (req, res, db, userId) => res.json(await conversations.getConversation(db, userId, req.params.id))),
  load: handle(async (req, res, db, userId) => res.json(await messages.loadMessages(db, userId, req.params.id, req.query))),
  send: handle(async (req, res, db, userId) => {
    const result = await messages.sendMessage(db, userId, req.params.id, req.body);
    publishMessageCreated(req.app, result);
    res.status(result.created ? 201 : 200).json(result.message);
  }),
  read: handle(async (req, res, db, userId) => {
    const result = await messages.markRead(db, userId, req.params.id, req.body?.last_read_message_id);
    publishReadUpdated(req.app, result);
    res.json(result.read_state);
  }),
  ticket: handle(async (req, res, db, userId) => {
    res.set('Cache-Control', 'no-store').json(issueTicket(userId, req.sessionExpiresAt));
  }),
};