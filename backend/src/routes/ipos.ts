import { Router, type Request, type Response, type NextFunction } from 'express';
import { param, query, body, validationResult } from 'express-validator';
import { ipoService } from '../services/ipo';
import prisma from '../db/prisma';
import logger from '../utils/logger';

const router = Router();

const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation Error', details: errors.array() });
    return;
  }
  next();
};

// ============================================
// GET /api/v1/ipos
// List all IPOs with filtering
// ============================================
router.get(
  '/',
  [
    query('status').optional().isIn(['UPCOMING', 'OPEN', 'CLOSED', 'LISTED']),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const ipos = await ipoService.getIPOs(status);

      res.json({
        data: ipos,
        count: ipos.length,
        meta: {
          status: status || 'all',
        },
      });
    } catch (error) {
      logger.error('Error fetching IPOs', error);
      next(error);
    }
  }
);

// GET /api/v1/ipos/upcoming
router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipos = await ipoService.getUpcomingIPOs();
    res.json({ data: ipos, count: ipos.length });
  } catch (error) {
    logger.error('Error fetching upcoming IPOs', error);
    next(error);
  }
});

// GET /api/v1/ipos/open
router.get('/open', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipos = await ipoService.getOpenIPOs();
    res.json({ data: ipos, count: ipos.length });
  } catch (error) {
    logger.error('Error fetching open IPOs', error);
    next(error);
  }
});

// GET /api/v1/ipos/:id
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const ipo = await ipoService.getIPOById(id);

      if (!ipo) {
        return res.status(404).json({
          error: 'IPO Not Found',
          message: `IPO with ID ${id} not found`,
        });
      }

      res.json({ data: ipo });
    } catch (error) {
      logger.error('Error fetching IPO details', error);
      return next(error);
    }
  }
);

// POST /api/v1/ipos/:id/advisor
router.post(
  '/:id/advisor',
  [
    param('id').isInt({ min: 1 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const result = await ipoService.calculateAdvisorVerdict(id);

      res.json({
        data: result,
        meta: {
          ipoId: id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'IPO not found') {
        return res.status(404).json({ error: 'IPO Not Found' });
      }
      logger.error('Error calculating IPO advisor verdict', error);
      return next(error);
    }
  }
);

//export default router;
//);

// ============================================
// GET /api/v1/ipos/upcoming
// Get upcoming IPOs
// ============================================
router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipos = await ipoService.getUpcomingIPOs();
    res.json({ data: ipos, count: ipos.length });
  } catch (error) {
    logger.error('Error fetching upcoming IPOs', error);
    next(error);
  }
});

// ============================================
// GET /api/v1/ipos/open
// Get currently open IPOs
// ============================================
router.get('/open', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipos = await ipoService.getOpenIPOs();
    res.json({ data: ipos, count: ipos.length });
  } catch (error) {
    logger.error('Error fetching open IPOs', error);
    next(error);
  }
});

// ============================================
// GET /api/v1/ipos/:id
// Get IPO details
// ============================================
router.get(
  '/:id',
  [
    param('id').isInt().toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const ipo = await ipoService.getIPOById(id);

      if (!ipo) {
        return res.status(404).json({
          error: 'IPO Not Found',
          message: `IPO with ID ${id} not found`,
        });
      }

      res.json({ data: ipo });
    } catch (error) {
      logger.error('Error fetching IPO details', error);
      return next(error);
    }
  }
);

// ============================================
// POST /api/v1/ipos/:id/advisor
// Get IPO investment recommendation
// ============================================
router.post(
  '/:id/advisor',
  [
    param('id').isInt().toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const result = await ipoService.calculateAdvisorVerdict(id);

      res.json({
        data: result,
        timestamp: new Date(),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'IPO not found') {
        return res.status(404).json({ error: 'IPO Not Found' });
      }
      logger.error('Error calculating IPO advisor verdict', error);
      return next(error);
    }
  }
);

// ============================================
// POST /api/v1/ipos/:id/update-gmp
// Update GMP data (admin only in production)
// ============================================
router.post(
  '/:id/update-gmp',
  [
    param('id').isInt().toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      await ipoService.updateGMPData(id);

      res.json({
        success: true,
        message: 'GMP data updated successfully',
      });
    } catch (error) {
      logger.error('Error updating GMP data', error);
      next(error);
    }
  }
);

// ============================================
// POST /api/v1/ipos/:id/update-subscription
// Update subscription data
// ============================================
router.post(
  '/:id/update-subscription',
  [
    param('id').isInt().toInt(),
    body('retailSubscription').isFloat({ min: 0 }),
    body('hniSubscription').isFloat({ min: 0 }),
    body('qibSubscription').isFloat({ min: 0 }),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id as string);
      const { retailSubscription, hniSubscription, qibSubscription } = req.body;

      await ipoService.updateSubscriptionData(id, {
        retailSubscription,
        hniSubscription,
        qibSubscription,
      });

      res.json({
        success: true,
        message: 'Subscription data updated successfully',
      });
    } catch (error) {
      logger.error('Error updating subscription data', error);
      next(error);
    }
  }
);

export default router;