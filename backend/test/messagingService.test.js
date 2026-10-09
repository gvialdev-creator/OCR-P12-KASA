const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const sqlite3 = require('sqlite3');
const { promisify } = require('node:util');
const { initSchema } = require('../db');
const conversations = require('../services/conversationsService');
const messages = require('../services/messagesService');
const owners = require('../services/ownerRequestsService');

async function fixture(callback) {
  const db = new sqlite3.Database(':memory:');
  for (const method of ['get', 'all', 'exec']) db[`${method}Async`] = promisify(db[method].bind(db));
  db.runAsync = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (error) {
    error ? reject(error) : resolve({ lastID: this.lastID, changes: this.changes });
  }));
  try {
    await initSchema(db);
    await initSchema(db);
    await db.execAsync("INSERT INTO users(name,role) VALUES ('Marie Dupont','client'),('Jean Martin','owner'),('Admin','admin'),('Other','client')");
    await callback(db);
  } finally { await promisify(db.close.bind(db))(); }
}

test('canonical private pair, concurrent starts and no self-chat', () => fixture(async (db) => {
  const pair = await Promise.all([conversations.startConversation(db, 1, 2), conversations.startConversation(db, 2, 1)]);
  assert.equal(pair[0].id, pair[1].id);
  await assert.rejects(conversations.startConversation(db, 1, 1), { status: 400 });
  await assert.rejects(conversations.getConversation(db, 3, pair[0].id), { status: 403 });
  assert.deepEqual((await conversations.listConversations(db, 3)).conversations, []);
}));

test('atomic concurrent sends, idempotent UUID and owner transaction coexist', () => fixture(async (db) => {
  const conversation = await conversations.startConversation(db, 1, 2);
  const request = await owners.submitOwnerRequest(db, 4);
  const input = { body: ' Bonjour ', client_message_id: randomUUID() };
  const [first, retry] = await Promise.all([
    messages.sendMessage(db, 1, conversation.id, input), messages.sendMessage(db, 1, conversation.id, input),
    owners.decideOwnerRequest(db, request.id, 3, 'approve'),
  ]);
  assert.equal(first.message.id, retry.message.id);
  assert.equal(first.message.body, 'Bonjour');
  assert.equal((await db.getAsync('SELECT role FROM users WHERE id = 4')).role, 'owner');
  await assert.rejects(messages.sendMessage(db, 1, conversation.id, { ...input, body: 'Different' }), { status: 409 });
  await assert.rejects(messages.sendMessage(db, 3, conversation.id, input), { status: 403 });
  for (const body of ['', '  ', 'a'.repeat(4001), null]) await assert.rejects(messages.sendMessage(db, 1, conversation.id, { ...input, body }), { status: 400 });
}));

test('pagination and membership-validated monotone read states', () => fixture(async (db) => {
  const conversation = await conversations.startConversation(db, 1, 2);
  const other = await conversations.startConversation(db, 3, 4);
  const sent = [];
  for (let index = 0; index < 4; index++) sent.push((await messages.sendMessage(db, 2, conversation.id, { body: `Message ${index}`, client_message_id: randomUUID() })).message);
  assert.equal((await conversations.getConversation(db, 1, conversation.id)).unread_count, 4);
  const recent = await messages.loadMessages(db, 1, conversation.id, { limit: 2 });
  assert.deepEqual(recent.messages.map((message) => message.id), sent.slice(2).map((message) => message.id));
  assert.equal(recent.has_more, true);
  assert.equal((await messages.loadMessages(db, 1, conversation.id, { after: sent[0].id, limit: 2 })).has_more, true);
  await messages.markRead(db, 1, conversation.id, sent[2].id);
  await messages.markRead(db, 1, conversation.id, sent[0].id);
  assert.equal((await conversations.getConversation(db, 1, conversation.id)).unread_count, 1);
  await assert.rejects(messages.markRead(db, 3, conversation.id, sent[0].id), { status: 403 });
  await assert.rejects(messages.markRead(db, 3, other.id, sent[0].id), { status: 400 });
  await assert.rejects(messages.loadMessages(db, 1, conversation.id, { before: 1, after: 2 }), { status: 400 });
}));

test('activity cursor keeps its timestamp snapshot while conversations move', () => fixture(async (db) => {
  const first = await conversations.startConversation(db, 1, 2);
  const second = await conversations.startConversation(db, 1, 3);
  const third = await conversations.startConversation(db, 1, 4);
  await db.runAsync("UPDATE conversations SET last_message_at = '2026-01-01T00:00:00.000Z' WHERE id = ?", [first.id]);
  await db.runAsync("UPDATE conversations SET last_message_at = '2026-01-02T00:00:00.000Z' WHERE id = ?", [second.id]);
  await db.runAsync("UPDATE conversations SET last_message_at = '2026-01-03T00:00:00.000Z' WHERE id = ?", [third.id]);
  const page = await conversations.listConversations(db, 1, { limit: 1 });
  await messages.sendMessage(db, 1, third.id, { body: 'New activity', client_message_id: randomUUID() });
  const next = await conversations.listConversations(db, 1, { limit: 1, before: page.next_cursor });
  assert.equal(next.conversations[0].id, second.id);
  await assert.rejects(conversations.listConversations(db, 1, { before: 'invalid' }), { status: 400 });
}));