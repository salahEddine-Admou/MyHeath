require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const chatRoutes = require('./routes/chat.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

let dbReady = null;
function ensureDB() {
  if (!dbReady) {
    dbReady = connectDB().catch((err) => {
      dbReady = null;
      throw err;
    });
  }
  return dbReady;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/healthcheck', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MyHeath API',
    encryption: 'AES-256-CBC',
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
