import { Router } from 'express';
import { screenerService } from '../services/screenerEngine';
import logger from '../utils/logger';

const router = Router();

// Custom screen with filters
router.post('/', async (req, res) => {
  try {
    const filters = req.body;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const stocks = await screenerService.screenStocks(filters, limit);
    res.json({ data: stocks, count: stocks.length });
  } catch (error) {
    logger.error('Custom screener error:', error);
    res.status(500).json({ error: 'Failed to screen stocks' });
  }
});

// PRESET: Momentum stocks
router.get('/momentum', async (req, res) => {
  try {
    const stocks = await screenerService.getMomentumStocks();
    res.json({ 
      data: stocks, 
      count: stocks.length,
      preset: 'momentum',
      description: 'Stocks with positive momentum and high volume',
    });
  } catch (error) {
    logger.error('Momentum screener error:', error);
    res.status(500).json({ error: 'Failed to fetch momentum stocks' });
  }
});

// PRESET: Value stocks
router.get('/value', async (req, res) => {
  try {
    const stocks = await screenerService.getValueStocks();
    res.json({ 
      data: stocks, 
      count: stocks.length,
      preset: 'value',
      description: 'Undervalued quality companies with dividends',
    });
  } catch (error) {
    logger.error('Value screener error:', error);
    res.status(500).json({ error: 'Failed to fetch value stocks' });
  }
});

// PRESET: Quality stocks
router.get('/quality', async (req, res) => {
  try {
    const stocks = await screenerService.getQualityStocks();
    res.json({ 
      data: stocks, 
      count: stocks.length,
      preset: 'quality',
      description: 'High-quality companies with competitive moats',
    });
  } catch (error) {
    logger.error('Quality screener error:', error);
    res.status(500).json({ error: 'Failed to fetch quality stocks' });
  }
});

// PRESET: Growth stocks
router.get('/growth', async (req, res) => {
  try {
    const stocks = await screenerService.getGrowthStocks();
    res.json({ 
      data: stocks, 
      count: stocks.length,
      preset: 'growth',
      description: 'High-growth companies with strong returns',
    });
  } catch (error) {
    logger.error('Growth screener error:', error);
    res.status(500).json({ error: 'Failed to fetch growth stocks' });
  }
});

// PRESET: Dividend stocks
router.get('/dividend', async (req, res) => {
  try {
    const stocks = await screenerService.getDividendStocks();
    res.json({ 
      data: stocks, 
      count: stocks.length,
      preset: 'dividend',
      description: 'Consistent dividend-paying quality companies',
    });
  } catch (error) {
    logger.error('Dividend screener error:', error);
    res.status(500).json({ error: 'Failed to fetch dividend stocks' });
  }
});

// PRESET: 52-week highs
router.get('/52-week-highs', async (req, res) => {
  try {
    const stocks = await screenerService.get52WeekHighs();
    res.json({ 
      data: stocks, 
      count: stocks.length,
      preset: '52week',
      description: 'Stocks near or at 52-week highs',
    });
  } catch (error) {
    logger.error('52W highs screener error:', error);
    res.status(500).json({ error: 'Failed to fetch 52W highs' });
  }
});

// PRESET: Undervalued
router.get('/undervalued', async (req, res) => {
  try {
    const stocks = await screenerService.getUndervaluedStocks();
    res.json({ 
      data: stocks, 
      count: stocks.length,
      preset: 'undervalued',
      description: 'Undervalued quality companies trading below fair value',
    });
  } catch (error) {
    logger.error('Undervalued screener error:', error);
    res.status(500).json({ error: 'Failed to fetch undervalued stocks' });
  }

  
// PRESET: Valuation gap analysis
// PRESET: Quality stocks
router.get('/quality', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        qualityScore: { gte: 8 },
        moatRating: { in: ['NARROW', 'WIDE'] },
      },
      orderBy: { qualityScore: 'desc' },
      take: 30,
    });
    res.json({ 
      data: stocks, 
      count: stocks.length,
      description: 'High-quality companies with competitive moats',
    });
  } catch (error) {
    logger.error('Quality screener error:', error);
    res.status(500).json({ error: 'Failed to fetch quality stocks' });
  }
});

// PRESET: Growth stocks
router.get('/growth', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        peRatio: { gte: 25 },
        roe: { gte: 18 },
        debtToEquity: { lte: 1.0 },
      },
      orderBy: { roe: 'desc' },
      take: 30,
    });
    res.json({ 
      data: stocks, 
      count: stocks.length,
      description: 'High-growth companies with strong returns',
    });
  } catch (error) {
    logger.error('Growth screener error:', error);
    res.status(500).json({ error: 'Failed to fetch growth stocks' });
  }
});

// PRESET: Dividend stocks
router.get('/dividend', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        dividendYield: { gte: 3 },
        qualityScore: { gte: 7 },
        debtToEquity: { lte: 1.0 },
      },
      orderBy: { dividendYield: 'desc' },
      take: 30,
    });
    res.json({ 
      data: stocks, 
      count: stocks.length,
      description: 'Consistent dividend-paying quality companies',
    });
  } catch (error) {
    logger.error('Dividend screener error:', error);
    res.status(500).json({ error: 'Failed to fetch dividend stocks' });
  }
});

// PRESET: Undervalued
router.get('/undervalued', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        valuationGap: { lt: -15 },
        qualityScore: { gte: 6 },
        roe: { gte: 12 },
      },
      orderBy: { valuationGap: 'asc' },
      take: 30,
    });
    res.json({ 
      data: stocks, 
      count: stocks.length,
      description: 'Undervalued quality companies trading below fair value',
    });
  } catch (error) {
    logger.error('Undervalued screener error:', error);
    res.status(500).json({ error: 'Failed to fetch undervalued stocks' });
  }
});
});

export default router;