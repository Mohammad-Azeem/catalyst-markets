import { Router, type Request, type Response, type NextFunction } from 'express';
import { eventsService } from '../services/eventsService';

const router = Router();

router.get('/upcoming', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const events = await eventsService.getUpcomingEvents(days);
    return res.json({ data: events, count: events.length });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;