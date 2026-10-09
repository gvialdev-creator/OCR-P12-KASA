const { transaction } = require('./databaseQueue');
const { fail, positiveId, membership } = require('./conversationsService');

async function loadMessages(db, userId, conversationId, options = {}) {
  const conversation = await membership(db, userId, conversationId);
  if (options.before !== undefined && options.after !== undefined) fail(400, 'Use before or after, not both');
  const limit = options.limit === undefined ? 30 : positiveId(options.limit);
  if (limit > 100) fail(400, 'Limit exceeds 100');
  const after = options.after !== undefined;
  const cursor = options.before ?? options.after;
  if (cursor !== undefined) {
    positiveId(cursor);
    if (!await db.getAsync('SELECT id FROM messages WHERE id = ? AND conversation_id = ?', [cursor, conversation.id])) fail(400, 'Invalid message cursor');
  }
  const rows = await db.allAsync(`SELECT * FROM messages WHERE conversation_id = ?
    ${cursor !== undefined ? `AND id ${after ? '>' : '<'} ?` : ''}
    ORDER BY id ${after ? 'ASC' : 'DESC'} LIMIT ?`, [conversation.id, ...(cursor !== undefined ? [cursor] : []), limit + 1]);
  const messages = rows.slice(0, limit);
  if (!after) messages.reverse();
  return { messages, has_more: rows.length > limit };
}

async function sendMessage(db, userId, conversationId, input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail(400, 'Invalid message');
  if (typeof input.body !== 'string' || !input.body.trim() || input.body.length > 4000) fail(400, 'Message must contain 1 to 4000 characters');
  if (typeof input.client_message_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.client_message_id)) fail(400, 'Client message UUID required');
  const body = input.body.trim();
  return transaction(db, async () => {
    const conversation = await membership(db, userId, conversationId);
    const previous = await db.getAsync('SELECT * FROM messages WHERE conversation_id = ? AND sender_id = ? AND client_message_id = ?', [conversation.id, userId, input.client_message_id]);
    if (previous) {
      if (previous.body !== body) fail(409, 'UUID already used for another message');
      return { message: previous, conversation, created: false };
    }
    const now = new Date().toISOString();
    const result = await db.runAsync('INSERT INTO messages(conversation_id, sender_id, client_message_id, body, created_at) VALUES (?,?,?,?,?)', [conversation.id, userId, input.client_message_id, body, now]);
    await db.runAsync('UPDATE conversations SET last_message_at = ? WHERE id = ?', [now, conversation.id]);
    const message = await db.getAsync('SELECT * FROM messages WHERE id = ?', [result.lastID]);
    return { message, conversation, created: true };
  });
}

async function markRead(db, userId, conversationId, messageId) {
  messageId = positiveId(messageId);
  return transaction(db, async () => {
    const conversation = await membership(db, userId, conversationId);
    if (!await db.getAsync('SELECT id FROM messages WHERE id = ? AND conversation_id = ?', [messageId, conversation.id])) fail(400, 'Message not in this conversation');
    await db.runAsync(`INSERT INTO conversation_read_states(conversation_id, user_id, last_read_message_id, last_read_at) VALUES (?,?,?,?)
      ON CONFLICT(conversation_id,user_id) DO UPDATE SET last_read_message_id = excluded.last_read_message_id, last_read_at = excluded.last_read_at
      WHERE excluded.last_read_message_id > conversation_read_states.last_read_message_id`, [conversation.id, userId, messageId, new Date().toISOString()]);
    const read_state = await db.getAsync('SELECT * FROM conversation_read_states WHERE conversation_id = ? AND user_id = ?', [conversation.id, userId]);
    return { conversation, read_state };
  });
}

module.exports = { loadMessages, sendMessage, markRead };