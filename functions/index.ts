import { Hono } from 'hono';
import { cors } from 'hono/cors';
import auth from './api/auth';
import menu from './api/menu';
import order from './api/order';
import availableDates from './api/available-dates';

const app = new Hono();

// Enable CORS with credentials support
app.use('*', cors({
  origin: "*", // You can change this to your specific frontend domain
  credentials: true
}));

// Include all API routes
app.route('/api', auth);
app.route('/api/menu', menu);
app.route('/api/order', order);
app.route('/api/available-dates', availableDates);

export default app;