import { Router, type Request, type Response, type NextFunction } from 'express';
import { param, body, validationResult } from 'express-validator';
import { portfolioService } from '../services/portfolio';
import logger from '../utils/logger';
import { authenticate, AuthRequest } from '../middleware/auth';

//need to be updated properly
const router = Router();

// ALL routes now require authentication
router.use(authenticate);

const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation Error', details: errors.array() });
    return;
  }
  next();
};

// Mock user ID for now (in production, get from JWT token)
const getUserId = (req: Request): number => {
  // TODO: Extract from JWT token
  return 1;
};

// ============================================
// GET /api/v1/portfolio
// Get all portfolios for current user
// ============================================


router.get('/', async (req: AuthRequest, res) => {
  try {
    const portfolios = await portfolioService.getUserPortfolios(Number(req.userId!));
    res.json({ data: portfolios });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch portfolios' });
  }
});

// Get all portfolios for authenticated user
/*
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const portfolios = await portfolioService.getUserPortfolios(userId);

    res.json({
      data: portfolios,
      count: portfolios.length,
    });
  } catch (error) {
    logger.error('Error fetching portfolios', error);
    next(error);
  }
});
*/

// ============================================
// GET /api/v1/portfolio/:id
// Get single portfolio with P&L
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
      const portfolioId = parseInt(req.params.id as string);

      const portfolio = await portfolioService.getPortfolio(portfolioId, userId);

      if (!portfolio) {
        return res.status(404).json({
          error: 'Portfolio Not Found',
          message: `Portfolio with ID ${portfolioId} not found`,
        });
      }

      res.json({ data: portfolio });
    } catch (error) {
      logger.error('Error fetching portfolio', error);
      return next(error);
    }
  }
);

// ============================================
// POST /api/v1/portfolio
// Create new portfolio
// ============================================
router.post(
  '/',
  [
    body('name').isString().isLength({ min: 1, max: 100 }).trim(),
    body('description').optional().isString().isLength({ max: 500 }).trim(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const { name, description } = req.body;

      const portfolio = await portfolioService.createPortfolio(
        userId,
        name,
        description
      );

      res.status(201).json({
        data: portfolio,
        message: 'Portfolio created successfully',
      });
    } catch (error) {
      logger.error('Error creating portfolio', error);
      next(error);
    }
  }
);

// ============================================
// POST /api/v1/portfolio/:id/stocks
// Add stock to portfolio
// ============================================
router.post(
  '/:id/stocks',
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('symbol').isString().isLength({ min: 1, max: 20 }).toUpperCase().trim(),
    body('quantity').isInt({ min: 1 }),
    body('buyPrice').isFloat({ min: 0.01 }),
    body('buyDate').isISO8601(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const portfolioId = parseInt(req.params.id as string);
      const { symbol, quantity, buyPrice, buyDate } = req.body;

      await portfolioService.addStock(portfolioId, userId, {
        symbol,
        quantity,
        buyPrice,
        buyDate: new Date(buyDate),
      });

      res.status(201).json({
        success: true,
        message: 'Stock added to portfolio',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Portfolio not found') {
          return res.status(404).json({ error: 'Portfolio Not Found' });
        }
        if (error.message === 'Stock not found') {
          return res.status(404).json({ error: 'Stock Not Found' });
        }
        if (error.message === 'Stock already in portfolio') {
          return res.status(400).json({ error: 'Stock Already in Portfolio' });
        }
      }
      logger.error('Error adding stock to portfolio', error);
      return next(error);
    }
  }
);

// ============================================
// DELETE /api/v1/portfolio/:id/stocks/:stockId
// Remove stock from portfolio
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
      const portfolioId = parseInt(req.params.id as string);
      const stockId = parseInt(req.params.stockId as string);

      await portfolioService.removeStock(portfolioId, stockId, userId);

      res.json({
        success: true,
        message: 'Stock removed from portfolio',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Portfolio not found') {
        return res.status(404).json({ error: 'Portfolio Not Found' });
      }
      logger.error('Error removing stock from portfolio', error);
      return next(error);
    }
  }
);

// ============================================
// DELETE /api/v1/portfolio/:id
// Delete portfolio
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
      const portfolioId = parseInt(req.params.id as string);

      await portfolioService.deletePortfolio(portfolioId, userId);

      res.json({
        success: true,
        message: 'Portfolio deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Portfolio not found') {
        return res.status(404).json({ error: 'Portfolio Not Found' });
      }
      logger.error('Error deleting portfolio', error);
      return next(error);
    }
  }
);

export default router;