import prisma from '../db/prisma';
import logger from '../utils/logger';

// ============================================
// MOCK PRICE SERVICE - For Development
// ============================================

/**
 * Generate realistic mock price updates
 * Use this when API keys are not available or rate limited
 */
export class MockPriceService {
  private baselinePrice: Map<string, number> = new Map();

  /**
   * Get baseline prices from database
   */
  async initialize(): Promise<void> {
    const stocks = await prisma.stock.findMany();
    
    stocks.forEach((stock: any) => {
      // If stock has 0 price, set realistic baseline
      const baseline = Number(stock.currentPrice) > 0 
        ? stock.currentPrice 
        : this.getRealisticPrice(stock.symbol, stock.exchange);
      
      this.baselinePrice.set(stock.symbol, Number(baseline));
    });

    logger.info('Mock price service initialized', { 
      stockCount: this.baselinePrice.size 
    });
  }

  /**
   * Get realistic baseline price for a stock
   */
  private getRealisticPrice(symbol: string, exchange: string): number {
    // NSE stocks (Indian)
    const nseBaselines: Record<string, number> = {
      'RELIANCE': 2450,
      'TCS': 3250,
      'INFY': 1456,
      'HDFCBANK': 1650,
      'ICICIBANK': 950,
      'SBIN': 1050,
      'BAJFINANCE': 6800,
      'BHARTIARTL': 850,
      'LT': 3200,
      'ASIANPAINT': 2950,
      'WIPRO': 420,
      'MARUTI': 11500,
      'SUNPHARMA': 1280,
      'TITAN': 3150,
      'ADANIPORTS': 720,
      'KOTAKBANK': 946,
      'HINDUNILVR': 971,
      'AXISBANK': 968,
      'ITC': 325,
    };

    // NASDAQ stocks (US)
    const nasdaqBaselines: Record<string, number> = {
      'AAPL': 185,
      'MSFT': 410,
      'GOOGL': 145,
      'AMZN': 175,
      'NVDA': 720,
      'TSLA': 195,
      'META': 485,
      'NFLX': 610,
      'COST': 825,
      'ADBE': 550,
      'AVGO': 150,
    };

    if (exchange === 'NSE') {
      return nseBaselines[symbol] || 1000;
    } else {
      return nasdaqBaselines[symbol] || 150;
    }
  }

  /**
   * Generate mock price update with realistic movement
   */
  async getMockQuote(symbol: string, exchange: string) {
    let baseline = this.baselinePrice.get(symbol);
    
    if (!baseline) {
      baseline = this.getRealisticPrice(symbol, exchange);
      this.baselinePrice.set(symbol, baseline);
    }

    // Random movement: -2% to +2%
    const changePercent = (Math.random() * 4 - 2);
    const change = baseline * (changePercent / 100);
    const price = baseline + change;

    // Random volume
    const volume = Math.floor(Math.random() * 10000000) + 1000000;

    return {
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume: BigInt(volume),
      timestamp: new Date(),
    };
  }

  /**
   * Update stock price in database
   */
  async updateStockPrice(stockId: number, symbol: string, exchange: string): Promise<void> {
    const quote = await this.getMockQuote(symbol, exchange);

    await prisma.stock.update({
      where: { id: stockId },
      data: {
        currentPrice: quote.price,
        dayChange: quote.change,
        dayChangePercent: quote.changePercent,
        volume: quote.volume,
        lastUpdated: quote.timestamp,
      },
    });

    logger.debug('Updated mock price', { 
      symbol, 
      price: quote.price, 
      change: quote.changePercent 
    });
  }

  /**
   * Update all stocks with mock prices
   */
  async updateAllPrices(): Promise<number> {
    const stocks = await prisma.stock.findMany({
      take: 25,
      orderBy: { symbol: 'asc' },
    });

    let updateCount = 0;

    for (const stock of stocks) {
      try {
        await this.updateStockPrice(stock.id, stock.symbol, stock.exchange);
        updateCount++;
      } catch (error) {
        logger.error('Failed to update mock price', { 
          symbol: stock.symbol, 
          error 
        });
      }
    }

    logger.info('Mock prices updated', { count: updateCount });
    return updateCount;
  }
}

export const mockPriceService = new MockPriceService();