const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(5000, () => {
  console.log('Simple server running on port 5000');
});

// Keep alive
setInterval(() => {}, 1000);
