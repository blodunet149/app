import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './api/auth';
import menu from './api/menu';
import order from './api/order';
import payment from './api/payment';
import availableDates from './api/available-dates';

const app = new Hono();

// Enable CORS with credentials support
app.use('*', cors({
  origin: [
    "https://catering-app-frontend.pages.dev",
    "https://catering.hijrah-attauhid.or.id",
    "https://app.catering.hijrah-attauhid.or.id",
    "http://localhost:3000",  // for local development
    "http://localhost:5173"   // for Vite default port
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Set-Cookie'],
  exposeHeaders: ['Set-Cookie']
}));

// Include all API routes
app.route('/api', auth);
app.route('/api/menu', menu);
app.route('/api/order', order);
app.route('/api/payment', payment);
app.route('/api/available-dates', availableDates);

export default app;