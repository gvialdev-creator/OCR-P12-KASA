const { transaction } = require('./databaseQueue');

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

function positiveId(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) fail(400, 'Invalid identifier');
  return Number(value);
}

async function membership(db, userId, conversationId) {
  const conversation = await db.getAsync('SELECT * FROM conversations WHERE id = ?', [positiveId(conversationId)]);
  if (!conversation) fail(404, 'Conversation not found');
  if (![conversation.participant_low_id, conversation.participant_high_id].includes(userId)) fail(403, 'Private conversation');
  return conversation;
}

async function startConversation(db, userId, recipientId) {
  recipientId = positiveId(recipientId);
  if (userId === recipientId) fail(400, 'Cannot message yourself');
  return transaction(db, async () => {
    const recipient = await db.getAsync('SELECT id FROM users WHERE id = ?', [recipientId]);
    if (!recipient) fail(404, 'Recipient not found');
    const pair = [userId, recipientId].sort((first, second) => first - second);
    const now = new Date().toISOString();
    await db.runAsync('INSERT OR IGNORE INTO conversations(participant_low_id, participant_high_id, created_at, last_message_at) VALUES (?,?,?,?)', [...pair, now, now]);
    return db.getAsync('SELECT * FROM conversations WHERE participant_low_id = ? AND participant_high_id = ?', pair);
  });
}

async function getConversation(db, userId, conversationId) {
  const conversation = await membership(db, userId, conversationId);
  const peerId = conversation.participant_low_id === userId ? conversation.participant_high_id : conversation.participant_low_id;
  const peer = await db.getAsync('SELECT id, name, picture FROM users WHERE id = ?', [peerId]);
  const last_message = await db.getAsync('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1', [conversation.id]);
  const read_states = await db.allAsync('SELECT user_id, last_read_message_id, last_read_at FROM conversation_read_states WHERE conversation_id = ?', [conversation.id]);
  const ownCursor = read_states.find((state) => state.user_id === userId)?.last_read_message_id || 0;
  const unread = await db.getAsync('SELECT COUNT(*) AS count FROM messages WHERE conversation_id = ? AND sender_id != ? AND id > ?', [conversation.id, userId, ownCursor]);
  return { ...conversation, peer, last_message: last_message || null, read_states, unread_count: unread.count };
}

async function listConversations(db, userId, options = {}) {
  const limit = options.limit === undefined ? 30 : positiveId(options.limit);
  if (limit > 100) fail(400, 'Limit exceeds 100');
  let cursor = null;
  if (options.before !== undefined) {
    try {
      if (typeof options.before !== 'string' || options.before.length > 256) fail(400, 'Invalid conversation cursor');
      const decoded = JSON.parse(Buffer.from(options.before, 'base64url').toString('utf8'));
      positiveId(decoded.id);
      if (typeof decoded.date !== 'string' || new Date(decoded.date).toISOString() !== decoded.date) fail(400, 'Invalid conversation cursor');
      await membership(db, userId, decoded.id);
      cursor = { id: decoded.id, last_message_at: decoded.date };
    } catch (error) {
      if (error.status === 403) throw error;
      fail(400, 'Invalid conversation cursor');
    }
  }
  const rows = await db.allAsync(`SELECT id FROM conversations
    WHERE (participant_low_id = ? OR participant_high_id = ?)
    ${cursor ? 'AND (last_message_at < ? OR (last_message_at = ? AND id < ?))' : ''}
    ORDER BY last_message_at DESC, id DESC LIMIT ?`,
  [userId, userId, ...(cursor ? [cursor.last_message_at, cursor.last_message_at, cursor.id] : []), limit + 1]);
  const conversations = await Promise.all(rows.slice(0, limit).map((row) => getConversation(db, userId, row.id)));
  const last = conversations.at(-1);
  return { conversations, next_cursor: rows.length > limit ? Buffer.from(JSON.stringify({ id: last.id, date: last.last_message_at })).toString('base64url') : null };
}

module.exports = { fail, positiveId, membership, startConversation, getConversation, listConversations };