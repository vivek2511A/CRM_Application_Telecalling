const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true
}));
app.use(express.json());

// Health check (before auth)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server after DB init
async function start() {
  await initializeDatabase();

  // API Routes (loaded after DB is ready)
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  const leadRoutes = require('./routes/leads');
  const noteRoutes = require('./routes/notes');
  const followupRoutes = require('./routes/followups');
  const callLogRoutes = require('./routes/callLogs');
  const reportRoutes = require('./routes/reports');

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api', noteRoutes);
  app.use('/api/followups', followupRoutes);
  app.use('/api', callLogRoutes);
  app.use('/api/reports', reportRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 CRM Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
