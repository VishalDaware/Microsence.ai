require('dotenv/config');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Load routes
const readingsRouter = require('./src/routes/readings');
const authRouter = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/readings', readingsRouter);

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

// Keep alive
setInterval(() => {}, 1000);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
});
