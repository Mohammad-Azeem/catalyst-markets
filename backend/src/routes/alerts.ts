import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../db/prisma';
import logger from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation Error', details: errors.array() });
  }
  next();
};

// Get all user alerts
router.get('/', async (req: AuthRequest, res) => {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: { userId: req.userId! },
      include: {
        stock: {
          select: {
            symbol: true,
            name: true,
            exchange: true,
            currentPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: alerts });
  } catch (error) {
    logger.error('Failed to fetch alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create alert
router.post(
  '/',
  [
    body('symbol').isString().trim(),
    body('targetPrice').isFloat({ min: 0.01 }),
    body('condition').isIn(['ABOVE', 'BELOW']),
    validate,
  ],
  async (req: AuthRequest, res) => {
    try {
      const { symbol, targetPrice, condition } = req.body;

      // Find stock
      const stock = await prisma.stock.findFirst({
        where: { symbol: symbol.toUpperCase() },
      });

      if (!stock) {
        return res.status(404).json({ error: 'Stock not found' });
      }

      // Create alert
      const alert = await prisma.priceAlert.create({
        data: {
          userId: req.userId!,
          stockId: stock.id,
          targetPrice,
          condition,
        },
        include: {
          stock: {
            select: { symbol: true, name: true, currentPrice: true },
          },
        },
      });

      res.status(201).json({ data: alert, message: 'Alert created successfully' });
    } catch (error) {
      logger.error('Failed to create alert:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  }
);

// Delete alert
router.delete('/:id', [param('id').isInt().toInt(), validate], async (req: AuthRequest, res) => {
  try {
    const alertId = parseInt(req.params.id as string);

    // Check ownership
    const alert = await prisma.priceAlert.findFirst({
      where: { id: alertId, userId: req.userId! },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await prisma.priceAlert.delete({ where: { id: alertId } });

    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    logger.error('Failed to delete alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Toggle alert active status
router.patch('/:id/toggle', [param('id').isInt().toInt(), validate], async (req: AuthRequest, res) => {
  try {
    const alertId = parseInt(req.params.id as string);

    const alert = await prisma.priceAlert.findFirst({
      where: { id: alertId, userId: req.userId! },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updated = await prisma.priceAlert.update({
      where: { id: alertId },
      data: { isActive: !alert.isActive },
    });

    res.json({ data: updated });
  } catch (error) {
    logger.error('Failed to toggle alert:', error);
    res.status(500).json({ error: 'Failed to toggle alert' });
  }
});

export default router;