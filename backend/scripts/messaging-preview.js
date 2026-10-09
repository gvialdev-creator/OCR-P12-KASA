const express = require('express');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { openDb, initSchema } = require('../db');
const { hashPassword } = require('../services/authService');
const { startConversation } = require('../services/conversationsService');
const { sendMessage } = require('../services/messagesService');
const { randomUUID } = require('node:crypto');
const { attachMessaging } = require('../realtime/messaging');

async function start() {
  if (process.env.NODE_ENV === 'production') throw new Error('Preview is development-only');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kasa-messaging-'));
  const db = openDb(path.join(directory, 'preview.sqlite3'));
  await initSchema(db);
  for (const account of [
    ['Marie Dupont', 'marie@messaging.test', 'client'],
    ['Jean Martin', 'jean@messaging.test', 'owner'],
    ['Admin Preview', 'admin@messaging.test', 'admin'],
  ]) {
    await db.runAsync('INSERT INTO users(name,email,role,password_hash) VALUES (?,?,?,?)', [...account, hashPassword('PreviewOnly123!')]);
  }
  await db.runAsync(`INSERT INTO properties(id,title,slug,description,cover,location,host_id,price_per_night)
    VALUES ('messaging-preview','Appartement de Jean','messaging-preview','Logement de recette temporaire',NULL,'Paris',2,80)`);
  const conversation = await startConversation(db, 1, 2);
  for (let index = 0; index < 36; index++) {
    await sendMessage(db, index % 2 ? 1 : 2, conversation.id, {
      body: index === 35 ? 'Bonjour Marie, le logement est disponible pour votre séjour.' : `Message de recette ${index + 1}`,
      client_message_id: randomUUID(),
    });
  }
  const app = express();
  app.locals.db = db;
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', require('../routes/api'));
  app.use('/auth', require('../routes/auth'));
  app.use(express.static(path.join(__dirname, '../public')));
  const server = http.createServer(app);
  const gateway = attachMessaging(server, app);
  server.listen(Number(process.env.PORT || 3101), () => console.log('Isolated messaging preview ready (temporary accounts and database)'));
  let closing = false;
  const close = () => {
    if (closing) return;
    closing = true;
    gateway.close(() => db.close(() => {
      fs.rmSync(directory, { recursive: true, force: true });
      process.exit(0);
    }));
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

start().catch(() => { console.error('Unable to start isolated messaging preview'); process.exit(1); });