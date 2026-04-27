import { Router } from 'express';
import { peerComparisonService } from '../services/peerComparison';
import logger from '../utils/logger';

const router = Router();

// Get peer comparison for a stock
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await peerComparisonService.findPeers(symbol, limit);

    if (!result) {
      return res.status(404).json({ error: 'Stock not found or no peers available' });
    }

    return res.json({ data: result });
  } catch (error) {
    logger.error('Peer comparison API error:', error);
    return res.status(500).json({ error: 'Failed to fetch peer comparison' });
  }
});

export default router;