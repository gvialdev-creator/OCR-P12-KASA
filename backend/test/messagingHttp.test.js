const { test } = require('node:test');
const assert = require('node:assert/strict');
const { promisify } = require('node:util');
const { randomUUID } = require('node:crypto');
const sqlite3 = require('sqlite3');
const express = require('express');
const http = require('node:http');
const { io: connect } = require('../../frontend/node_modules/socket.io-client');
const { initSchema } = require('../db');
const { signToken } = require('../services/authService');
const { issueTicket } = require('../realtime/socketTickets');
const { attachMessaging } = require('../realtime/messaging');

test('isolated HTTP/socket privacy, audiences, commit-before-push and retry', async () => {
  const db = new sqlite3.Database(':memory:');
  for (const method of ['get', 'all', 'exec']) db[`${method}Async`] = promisify(db[method].bind(db));
  db.runAsync = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (error) {
    error ? reject(error) : resolve({ lastID: this.lastID, changes: this.changes });
  }));
  await initSchema(db);
  await db.execAsync("INSERT INTO users(name,role) VALUES ('Ephemeral A','client'),('Ephemeral B','owner'),('Ephemeral admin','admin')");
  const app = express();
  app.use(express.json({ limit: '32kb' }));
  app.locals.db = db;
  app.use('/api', require('../routes/api'));
  const server = http.createServer(app);
  const gateway = attachMessaging(server, app, { origins: ['http://localhost:3999'] });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const sockets = [];
  const request = (path, token, method = 'GET', body) => fetch(`${base}/api${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });
  const token = (id) => signToken({ id, role: id === 3 ? 'admin' : 'client', name: 'Ephemeral' });
  const socket = (ticket, origin = 'http://localhost:3999') => {
    const client = connect(base, { auth: { ticket }, extraHeaders: { Origin: origin }, reconnection: false, forceNew: true });
    sockets.push(client);
    return client;
  };
  const event = (client, name) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Missing ${name}`)), 3000);
    client.once(name, (value) => { clearTimeout(timer); resolve(value); });
  });
  try {
    assert.equal((await request('/conversations', '')).status, 401);
    const ticketResponse = await request('/messaging/socket-token', token(1), 'POST');
    const ticket = await ticketResponse.json();
    assert.equal((await request('/conversations', ticket.token)).status, 401);
    await event(socket(token(1)), 'connect_error');
    await event(socket(ticket.token, 'http://evil.example'), 'connect_error');
    const first = socket(ticket.token);
    const second = socket(issueTicket(2, Date.now() + 60000).token);
    await Promise.all([event(first, 'connect'), event(second, 'connect')]);
    first.emit('join', 'user:3');
    const conversation = await (await request('/conversations', token(1), 'POST', { recipient_id: 2 })).json();
    assert.equal((await request(`/conversations/${conversation.id}`, token(3))).status, 403);
    const push = event(second, 'messaging:message-created');
    const body = { body: 'Private persisted message', client_message_id: randomUUID() };
    const response = await request(`/conversations/${conversation.id}/messages`, token(1), 'POST', body);
    assert.equal(response.status, 201);
    const message = await response.json();
    assert.equal((await push).message.id, message.id);
    assert.equal((await db.getAsync('SELECT body FROM messages WHERE id = ?', [message.id])).body, body.body);
    const retry = await request(`/conversations/${conversation.id}/messages`, token(1), 'POST', body);
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).id, message.id);
    second.disconnect();
    const missed = await (await request(`/conversations/${conversation.id}/messages`, token(1), 'POST', { ...body, client_message_id: randomUUID() })).json();
    const reconnected = socket(issueTicket(2, Date.now() + 60000).token);
    await event(reconnected, 'connect');
    const caughtUp = await (await request(`/conversations/${conversation.id}/messages?after=${message.id}`, token(2))).json();
    assert.equal(caughtUp.messages[0].id, missed.id);
    const readPush = event(first, 'messaging:read-updated');
    assert.equal((await request(`/conversations/${conversation.id}/read`, token(2), 'PATCH', { last_read_message_id: missed.id })).status, 200);
    assert.equal((await readPush).read_state.last_read_message_id, missed.id);
    const short = socket(issueTicket(2, Date.now() + 2100).token);
    await event(short, 'connect');
    await event(short, 'disconnect');
    const removed = issueTicket(3, Date.now() + 60000).token;
    await db.runAsync('DELETE FROM users WHERE id = 3');
    await event(socket(removed), 'connect_error');
  } finally {
    sockets.forEach((client) => client.disconnect());
    await new Promise((resolve) => gateway.close(resolve));
    await promisify(db.close.bind(db))();
  }
});