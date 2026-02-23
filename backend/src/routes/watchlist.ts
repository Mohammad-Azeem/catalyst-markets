import { Router, type Request, type Response, type NextFunction } from 'express';
import { param, body, validationResult } from 'express-validator';
import { watchlistService } from '../services/watchlist';
import logger from '../utils/logger';

const router = Router();

const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation Error', details: errors.array() });
    return ;
  }
  next();
};

// Mock user ID (in production, extract from JWT)
const getUserId = (req: Request): number => {
  return 1; // TODO: Get from JWT token
};

// ============================================
// GET /api/v1/watchlist
// Get all watchlists for current user
// ============================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const watchlists = await watchlistService.getUserWatchlists(userId);

    res.json({
      data: watchlists,
      count: watchlists.length,
    });
  } catch (error) {
    logger.error('Error fetching watchlists', error);
    next(error);
  }
});

// ============================================
// GET /api/v1/watchlist/:id
// Get single watchlist
// ============================================
router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const watchlistId = parseInt(req.params.id as string);

      const watchlist = await watchlistService.getWatchlist(watchlistId, userId);

      if (!watchlist) {
        res.status(404).json({
          error: 'Watchlist Not Found',
          message: `Watchlist with ID ${watchlistId} not found`,
        });
      }

      res.json({ data: watchlist });
    } catch (error) {
      logger.error('Error fetching watchlist', error);
      next(error);
    }
  }
);

// ============================================
// POST /api/v1/watchlist
// Create new watchlist
// ============================================
router.post(
  '/',
  [
    body('name').isString().isLength({ min: 1, max: 100 }).trim(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const { name } = req.body;

      const watchlist = await watchlistService.createWatchlist(userId, name);

      return res.status(201).json({
        data: watchlist,
        message: 'Watchlist created successfully',
      });
    } catch (error) {
      logger.error('Error creating watchlist', error);
      return next(error);
    }
  }
);

// ============================================
// POST /api/v1/watchlist/:id/stocks
// Add stock to watchlist
// ============================================
router.post(
  '/:id/stocks',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('symbol').isString().isLength({ min: 1, max: 20 }).toUpperCase().trim(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const watchlistId = parseInt(req.params.id as string);
      const { symbol } = req.body;

      await watchlistService.addStock(watchlistId, userId, symbol);

      return res.status(201).json({
        success: true,
        message: 'Stock added to watchlist',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Watchlist not found') {
          return res.status(404).json({ error: 'Watchlist Not Found' });
        }
        if (error.message === 'Stock not found') {
          return res.status(404).json({ error: 'Stock Not Found' });
        }
        if (error.message === 'Stock already in watchlist') {
          return res.status(400).json({ error: 'Stock Already in Watchlist' });
        }
      }
      logger.error('Error adding stock to watchlist', error);
      return next(error);
    }
  }
);

// ============================================
// DELETE /api/v1/watchlist/:id/stocks/:stockId
// Remove stock from watchlist
// ============================================
router.delete(
  '/:id/stocks/:stockId',
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('stockId').isInt({ min: 1 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const watchlistId = parseInt(req.params.id as string);
      const stockId = parseInt(req.params.stockId as string);

      await watchlistService.removeStock(watchlistId, stockId, userId);

      res.json({
        success: true,
        message: 'Stock removed from watchlist',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Watchlist not found') {
        return res.status(404).json({ error: 'Watchlist Not Found' });
      }
      logger.error('Error removing stock from watchlist', error);
      return next(error);
    }
  }
);

// ============================================
// DELETE /api/v1/watchlist/:id
// Delete watchlist
// ============================================
router.delete(
  '/:id',
  [
    param('id').isInt({ min: 1 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const watchlistId = parseInt(req.params.id as string);

      await watchlistService.deleteWatchlist(watchlistId, userId);

      res.json({
        success: true,
        message: 'Watchlist deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Watchlist not found') {
        return res.status(404).json({ error: 'Watchlist Not Found' });
      }
      logger.error('Error deleting watchlist', error);
      return next(error);
    }
  }
);

export default router;