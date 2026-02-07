require('dotenv/config');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

console.log('Dependencies loaded');

console.log('Loading routes...');
const readingsRouter = require('./src/routes/readings');
const authRouter = require('./src/routes/auth');
console.log('Routes loaded');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Creating Prisma client...');
const prisma = new PrismaClient();
console.log('Prisma client created');

// Middleware
app.use(cors());
app.use(express.json());

console.log('Middleware added');

// Apply routes
console.log('Applying routes...');
app.use('/api/auth', authRouter);
app.use('/api/readings', readingsRouter);
console.log('Routes applied');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('Health route added');

// Start server
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

console.log('Server listener created');

// Keep alive
setInterval(() => {}, 1000);

console.log('Process setup complete');
