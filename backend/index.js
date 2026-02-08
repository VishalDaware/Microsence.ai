require('dotenv/config');
const express = require('express');
const cors = require('cors');

// Wrap route loading in try-catch to catch any initialization errors
let readingsRouter, authRouter, fieldsRouter, farmsRouter;
try {
  readingsRouter = require('./src/routes/readings');
  authRouter = require('./src/routes/auth');
  fieldsRouter = require('./src/routes/fields');
  // new farm routes
  farmsRouter = require('./src/routes/farms');
} catch (error) {
  console.error('Error loading routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/readings', readingsRouter);
app.use('/api/fields', fieldsRouter);
app.use('/api/farms', farmsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ POST http://localhost:${PORT}/api/auth/signup for signup`);
  console.log(`✓ POST http://localhost:${PORT}/api/auth/login for login`);
  console.log(`✓ POST http://localhost:${PORT}/api/readings/generate to generate data`);
  console.log(`✓ GET http://localhost:${PORT}/api/readings/latest to fetch latest readings`);
});

// Keep the process alive
server.keepAliveTimeout = 65000;

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

// Keep the process running
setInterval(() => {}, 1000);

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
});
