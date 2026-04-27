import { Router } from 'express';
import { fearGreedService } from '../services/fearGreedIndex';
import logger from '../utils/logger';

const router = Router();

// Get current Fear/Greed Index
router.get('/current', async (req, res) => {
  try {
    const data = await fearGreedService.getCurrentSentiment();
    res.json({ data });
  } catch (error) {
    logger.error('Sentiment API error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment' });
  }
});

// Get historical sentiment
router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await fearGreedService.getHistoricalSentiment(days);
    res.json({ data });
  } catch (error) {
    logger.error('Sentiment history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Force recalculate (for testing)
router.post('/recalculate', async (req, res) => {
  try {
    const data = await fearGreedService.calculateIndex();
    await fearGreedService.saveSentiment(data);
    res.json({ data, message: 'Recalculated successfully' });
  } catch (error) {
    logger.error('Recalculate error:', error);
    res.status(500).json({ error: 'Failed to recalculate' });
  }
});

export default router;