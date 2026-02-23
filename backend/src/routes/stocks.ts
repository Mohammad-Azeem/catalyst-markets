import { Router, type Request, type Response, type NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import { stockPriceService } from '../services/stockPrice';
import prisma from '../db/prisma';
import { cache } from '../db/redis';
import logger from '../utils/logger';

const router = Router();

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation Error',
      details: errors.array(),
    });
    return;
  }
  next();
};

// ============================================
// GET /api/v1/stocks
// List all stocks with pagination and filtering
// ============================================

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    query('sector').optional().isString(),
    query('search').optional().isString(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const exchange = req.query.exchange as string;
      const sector = req.query.sector as string;
      const search = req.query.search as string;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (exchange) where.exchange = exchange;
      if (sector) where.sector = sector;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { symbol: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Challenge: Database query might be slow with many records
      // Solution: Use caching for common queries
      const cacheKey = `stocks:list:${JSON.stringify({ page, limit, exchange, sector, search })}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        logger.debug('Cache hit for stocks list');
        return res.json(cached);
      }

      const [stocks, total] = await Promise.all([
        prisma.stock.findMany({
          where,
          skip,
          take: limit,
          orderBy: { marketCap: 'desc' },
          select: {
            id: true,
            symbol: true,
            name: true,
            exchange: true,
            sector: true,
            currentPrice: true,
            dayChange: true,
            dayChangePercent: true,
            volume: true,
            marketCap: true,
            lastUpdated: true,
          },
        }),
        prisma.stock.count({ where }),
      ]);

      const response = {
        data: stocks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      };

      // Cache for 1 minute
      await cache.set(cacheKey, response, 60);

      res.json(response);

    } catch (error) {
      logger.error('Error fetching stocks list', error);
      return next(error);
    }
  }
);

// ============================================
// GET /api/v1/stocks/:symbol
// Get detailed stock information
// ============================================

router.get(
  '/:symbol',
  [
    param('symbol').isString().isLength({ min: 1, max: 10 }).toUpperCase(),
    query('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const symbol = req.params.symbol as string;
      const exchange = req.query.exchange as string || 'NASDAQ';

      // Challenge: Stock might not exist in database yet
      // Solution: Try to fetch from external API and create it
      
      let stock = await prisma.stock.findUnique({
        where: { symbol },
      });

      if (!stock) {
        logger.info(`Stock ${symbol} not found in database, fetching from API`);
        
        // Try to fetch from external API
        const quote = await stockPriceService.getQuote(symbol, exchange);
        
        if (!quote) {
          return res.status(404).json({
            error: 'Stock Not Found',
            message: `Stock with symbol ${symbol} not found`,
          });
        }

        // Create stock in database
        stock = await prisma.stock.create({
          data: {
            symbol: quote.symbol,
            name: quote.name,
            exchange,
            currentPrice: quote.price,
            dayChange: quote.change,
            dayChangePercent: quote.changePercent,
            volume: BigInt(quote.volume),
            marketCap: quote.marketCap ? quote.marketCap : undefined,
            high52Week: quote.high52Week,
            low52Week: quote.low52Week,
            peRatio: quote.peRatio,
            lastUpdated: new Date(),
          },
        });
      }

      res.json({
        data: stock,
        meta: {
          source: 'database',
          lastUpdated: stock.lastUpdated,
        },
      });

    } catch (error) {
      logger.error('Error fetching stock details', error);
      return next(error);
    }
  }
);

// ============================================
// GET /api/v1/stocks/:symbol/price
// Get real-time price (with aggressive caching)
// ============================================

router.get(
  '/:symbol/price',
  [
    param('symbol').isString().isLength({ min: 1, max: 10 }).toUpperCase(),
    query('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    query('realtime').optional().isBoolean(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const symbol = req.params.symbol as string;
      const exchange = req.query.exchange as string || 'NASDAQ';
      const realtime = req.query.realtime === 'true';

      // Challenge: Balance between freshness and rate limits
      // Solution: Use cached data unless explicitly requested realtime
      
      if (!realtime) {
        // Try to get cached data first
        const cached = await stockPriceService.getCachedQuote(symbol);
        if (cached) {
          return res.json({
            data: cached,
            meta: {
              source: 'cache',
              age: Math.floor((Date.now() - cached.lastUpdated.getTime()) / 1000),
            },
          });
        }
      }

      // Fetch real-time data
      const quote = await stockPriceService.getQuote(symbol, exchange);

      if (!quote) {
        return res.status(404).json({
          error: 'Price Not Available',
          message: `Unable to fetch price for ${symbol}`,
        });
      }

      // Update database (fire and forget)
      prisma.stock.update({
        where: { symbol },
        data: {
          currentPrice: quote.price,
          dayChange: quote.change,
          dayChangePercent: quote.changePercent,
          volume: BigInt(quote.volume),
          lastUpdated: new Date(),
        },
      }).catch((err) => {
        logger.error('Failed to update stock price in database', err);
      });

      res.json({
        data: quote,
        meta: {
          source: quote.source,
          realtime: true,
        },
      });

    } catch (error) {
      logger.error('Error fetching stock price', error);
      return next(error);
    }
  }
);


// ============================================
// GET /api/v1/stocks/:symbol/historical data (OHLCV bars)
// Get detailed information on historical price data for charts and analysis
// ============================================
// Challenge: Historical data can be large and slow to fetch
// Solution: Use aggressive caching and allow range/interval parameters

//  editing it, may have some issues, need to be updated properly --- IGNORE ---
router.get('/:symbol/historical', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // const { symbol } = req.params;
    const symbol = (req.params.symbol as string);
    const range = (req.query.range as string) || '1mo';
    const interval = (req.query.interval as string) || '1d';

    const stock = await prisma.stock.findFirst({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const { yahooFinanceService } = await import('../services/yahooFinance');
    const data = await yahooFinanceService.getHistorical(
      stock.symbol,
      stock.exchange,
      range as any,
      interval as any
    );

    res.json({ data });
  } catch (error) {
    logger.error('Historical data error:', error);
    return next(error);  
    }
  }
);


// ============================================
// POST /api/v1/stocks/batch-prices
// Get multiple stock prices efficiently
// ============================================

router.post(
  '/batch-prices',
  [
    query('exchange').optional().isIn(['NSE', 'NASDAQ', 'NYSE', 'LSE', 'EURONEXT']),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { symbols } = req.body;
      const exchange = req.query.exchange as string || 'NASDAQ';

      // Validation
      if (!Array.isArray(symbols) || symbols.length === 0) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'symbols must be a non-empty array',
        });
      }

      if (symbols.length > 50) {
        return res.status(400).json({
          error: 'Too Many Symbols',
          message: 'Maximum 50 symbols allowed per request',
        });
      }

      // Challenge: Fetching many stocks can hit rate limits
      // Solution: Use batch endpoint and aggressive caching
      
      logger.info(`Batch price request for ${symbols.length} symbols`);

      const quotes = await stockPriceService.getMultipleQuotes(symbols, exchange);

      // Separate successful and failed symbols
      const successful = quotes.map(q => q.symbol);
      const failed = symbols.filter((s: string) => !successful.includes(s));

      res.json({
        data: quotes,
        meta: {
          requested: symbols.length,
          successful: successful.length,
          failed: failed.length,
          failedSymbols: failed,
        },
      });

    } catch (error) {
      logger.error('Error in batch price fetch', error);
      return next(error);
    }
  }
);

// ============================================
// POST /api/v1/stocks/search
// Search stocks by name or symbol
// ============================================

router.post(
  '/search',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query: searchQuery } = req.body;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!searchQuery || searchQuery.length < 2) {
        return res.status(400).json({
          error: 'Invalid Search Query',
          message: 'Search query must be at least 2 characters',
        });
      }

      // Challenge: Full-text search can be slow
      // Solution: Use caching and limit results
      
      const cacheKey = `stocks:search:${searchQuery}:${limit}`;
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const stocks = await prisma.stock.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { symbol: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { marketCap: 'desc' },
        select: {
          id: true,
          symbol: true,
          name: true,
          exchange: true,
          currentPrice: true,
          dayChangePercent: true,
        },
      });

      const response = {
        data: stocks,
        meta: {
          query: searchQuery,
          results: stocks.length,
        },
      };

      // Cache search results for 5 minutes
      await cache.set(cacheKey, response, 300);

      res.json(response);

    } catch (error) {
      logger.error('Error in stock search', error);
      return next(error);
    }
  }
);

// ============================================
// ERROR HANDLING
// ============================================

router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Stock API error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An error occurred while processing your request',
    ...(process.env.NODE_ENV === 'development' && { details: error.message }),
  });
});

export default router;
