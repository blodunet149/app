// Script untuk mengetes endpoint login
const { Hono } = require('hono');
const { cors } = require('hono/cors');
const auth = require('./functions/api/auth.js');

const app = new Hono();

// Tambahkan middleware CORS
app.use('*', cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposeHeaders: ['Set-Cookie']
}));

// Tambahkan route auth
app.route('/api', auth);

// Jalankan server
const port = 3000;
app.fire().listen({ port }, () => {
  console.log(`Test server is running on port ${port}`);
  console.log(`Test endpoint: http://localhost:${port}/api/test`);
  console.log(`Login endpoint: http://localhost:${port}/api/login`);
});