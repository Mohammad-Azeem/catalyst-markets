import { Router } from 'express';
import { valuationEngine } from '../services/valuationEngine';
import prisma from '../db/prisma';
import logger from '../utils/logger';

const router = Router();

// Get valuation for a specific stock
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const stock = await prisma.stock.findFirst({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const valuation = await valuationEngine.analyzeStock(stock.id);

    if (!valuation) {
      return res.status(400).json({ error: 'Insufficient data for valuation' });
    }

    return res.json({
      data: {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: Number(stock.currentPrice),
        ...valuation,
      },
    });
  } catch (error) {
    logger.error('Valuation API error:', error);
    return res.status(500).json({ error: 'Failed to calculate valuation' });
  }
});

// Get undervalued stocks
router.get('/screener/undervalued', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        valuationGap: { lt: -15 }, // More than 15% undervalued
        qualityScore: { gte: 6 }, // Quality score >= 6
      },
      orderBy: { valuationGap: 'asc' },
      take: 20,
    });

    return res.json({ data: stocks, count: stocks.length });
  } catch (error) {
    logger.error('Undervalued screener error:', error);
    return res.status(500).json({ error: 'Failed to fetch undervalued stocks' });
  }
});

// Get quality stocks
router.get('/screener/quality', async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      where: {
        qualityScore: { gte: 8 },
        moatRating: { in: ['NARROW', 'WIDE'] },
      },
      orderBy: { qualityScore: 'desc' },
      take: 20,
    });

    return res.json({ data: stocks, count: stocks.length });
  } catch (error) {
    logger.error('Quality screener error:', error);
    return res.status(500).json({ error: 'Failed to fetch quality stocks' });
  }
});

// Recalculate all valuations (admin endpoint)
router.post('/recalculate', async (req, res) => {
  try {
    const count = await valuationEngine.analyzeAllStocks();
    return res.json({ success: true, analyzed: count });
  } catch (error) {
    logger.error('Recalculation error:', error);
    return res.status(500).json({ error: 'Failed to recalculate valuations' });
  } 
});

export default router;