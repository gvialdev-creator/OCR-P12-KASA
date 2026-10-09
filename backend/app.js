const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const { databaseErrorDetails, initialize } = require('./db');

const app = express();

app.use(logger('dev'));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database and expose via app.locals
initialize().then((db) => {
  app.locals.db = db;
  console.info('database_connected', JSON.stringify({ pathConfigured: Boolean(process.env.DB_PATH) }));
}).catch((err) => {
  console.error('database_not_connected', JSON.stringify(databaseErrorDetails(err)));
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

module.exports = app;
