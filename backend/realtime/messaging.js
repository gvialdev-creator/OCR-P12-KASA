const { Server } = require('socket.io');
const { verifyTicket } = require('./socketTickets');

function attachMessaging(server, app, config = {}) {
  const origins = config.origins || (process.env.MESSAGING_FRONTEND_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  const allowed = (origin) => typeof origin === 'string' && origins.includes(origin);
  const io = new Server(server, {
    cors: { origin: (origin, callback) => callback(null, allowed(origin)), methods: ['GET', 'POST'] },
    allowRequest: (request, callback) => callback(null, allowed(request.headers.origin)),
    maxHttpBufferSize: 8192,
  });
  io.use(async (socket, next) => {
    try {
      if (!allowed(socket.handshake.headers.origin)) throw new Error('Origin refused');
      const { userId, expiresAt } = verifyTicket(socket.handshake.auth.ticket);
      const db = app.locals.db;
      if (!db || !await db.getAsync('SELECT id FROM users WHERE id = ?', [userId])) throw new Error('User unavailable');
      if (expiresAt <= Date.now()) throw new Error('Ticket expired');
      socket.data.userId = userId;
      socket.data.expiresAt = expiresAt;
      next();
    } catch { next(new Error('Messaging authentication required')); }
  });
  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    const expiration = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.expiresAt - Date.now()));
    expiration.unref();
    socket.on('disconnect', () => clearTimeout(expiration));
  });
  app.locals.messaging = io;
  return io;
}

function publishMessageCreated(app, result) {
  if (!result.created) return;
  const { message, conversation } = result;
  const recipientId = conversation.participant_low_id === message.sender_id ? conversation.participant_high_id : conversation.participant_low_id;
  const event = {
    version: 1, event_id: `message:${message.id}`, message_id: message.id,
    conversation_id: conversation.id, sender_id: message.sender_id, recipient_id: recipientId,
    occurred_at: message.created_at, message,
  };
  app.locals.messaging?.to([`user:${message.sender_id}`, `user:${recipientId}`]).emit('messaging:message-created', event);
}

function publishReadUpdated(app, result) {
  const { conversation, read_state } = result;
  app.locals.messaging?.to([`user:${conversation.participant_low_id}`, `user:${conversation.participant_high_id}`])
    .emit('messaging:read-updated', { version: 1, conversation_id: conversation.id, read_state });
}

module.exports = { attachMessaging, publishMessageCreated, publishReadUpdated };