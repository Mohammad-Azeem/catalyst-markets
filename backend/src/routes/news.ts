import { Router } from 'express';
import { newsService } from '../services/newsService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const news = await newsService.fetchNews(limit);
    res.json({ data: news, count: news.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;