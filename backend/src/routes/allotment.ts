import { Router } from 'express';
import { allotmentService } from '../services/allotmentService';
import { body, validationResult } from 'express-validator';

const router = Router();

router.post('/check', [
  body('pan').isString().isLength({ min: 10, max: 10 }),
  body('ipoName').isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { pan, ipoName } = req.body;
    const result = await allotmentService.checkAllotment(pan, ipoName);
    return res.json({ data: result });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check allotment' });
  }
});

router.get('/probability/:ipoId', async (req, res) => {
  try {
    const ipoId = parseInt(req.params.ipoId);
    const ipo = await require('../db/prisma').default.iPO.findUnique({ where: { id: ipoId } });
    
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });
    
    const probability = allotmentService.calculateProbability(Number(ipo.retailSubscription));
    return res.json({ data: { probability, subscription: ipo.retailSubscription } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to calculate probability' });
  }
});

export default router;