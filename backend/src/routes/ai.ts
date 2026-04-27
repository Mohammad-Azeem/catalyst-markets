import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { aiAdvisorService } from '../services/aiAdvisor';
import logger from '../utils/logger';

const router = Router();

// Analyze stock
router.post('/analyze/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const analysis = await aiAdvisorService.analyzeStock(symbol);

    if (!analysis) {
      return res.status(500).json({ error: 'AI analysis failed' });
    }

    return res.json({ data: analysis });
  } catch (error) {
    logger.error('AI stock analysis API error:', error);
    return res.status(500).json({ error: 'Failed to analyze stock' });
  }
});

// Analyze IPO
router.post('/analyze/ipo/:id', async (req, res) => {
  try {
    const ipoId = parseInt(req.params.id);
    const analysis = await aiAdvisorService.analyzeIPO(ipoId);

    if (!analysis) {
      return res.status(500).json({ error: 'AI analysis failed' });
    }

    return res.json({ data: analysis });
  } catch (error) {
    logger.error('AI IPO analysis API error:', error);
    return res.status(500).json({ error: 'Failed to analyze IPO' });
  }
});

// Chat assistant
router.post(
  '/chat',
  [body('message').isString().notEmpty().trim(), body('history').optional().isArray()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { message, history = [] } = req.body;
      const response = await aiAdvisorService.chatAssistant(message, history);

      return res.json({ data: { response } });
    } catch (error) {
      logger.error('Chat API error:', error);
      return res.status(500).json({ error: 'Failed to process message' });
    }
  }
);

export default router;