import { Hono } from 'hono';
import { getAvailableDates } from '../../utils/date-utils';

const app = new Hono();

app.get('/', async (c) => {
  try {
    const dates = getAvailableDates();
    return c.json({ dates });
  } catch (error) {
    return c.json({ error: 'Failed to get available dates' }, 500);
  }
});

export default app;