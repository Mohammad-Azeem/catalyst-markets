
import axios from 'axios';
import logger from '../utils/logger';

export class YahooFinanceService {
  private getSymbolSuffix(exchange: string): string {
    if (exchange === 'NSE') return '.NS';
    if (exchange === 'BSE') return '.BO';
    return '';
  }

  async getQuote(symbol: string, exchange: string): Promise<any> {
    const yahooSymbol = symbol + this.getSymbolSuffix(exchange);
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await axios.get(url, { timeout: 8000 });
      
      const result = response.data?.chart?.result?.[0];
      if (!result?.meta) return null;

      const meta = result.meta;
      const price = meta.regularMarketPrice || 0;
      const prevClose = meta.chartPreviousClose || price;
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;

      return {
        symbol,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: meta.regularMarketVolume || 0,
      };
    } catch (error: any) {
      logger.error(`Yahoo error for ${yahooSymbol}:`, error.message);
      return null;
    }
  }

  async getHistorical(
    symbol: string,
    exchange: string,
    range: string = '1mo',
    interval: string = '1d'
  ): Promise<any[]> {
    const yahooSymbol = symbol + this.getSymbolSuffix(exchange);
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await axios.get(url, {
        params: { range, interval },
        timeout: 10000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result?.timestamp) return [];

      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      return timestamps
        .map((ts: number, i: number) => ({
          timestamp: ts * 1000,
          open: quotes.open[i] || 0,
          high: quotes.high[i] || 0,
          low: quotes.low[i] || 0,
          close: quotes.close[i] || 0,
          volume: quotes.volume[i] || 0,
        }))
        .filter((bar: any) => bar.close > 0);
    } catch (error: any) {
      logger.error(`Yahoo historical error:`, error.message);
      return [];
    }
  }

  async syncAllStocks(): Promise<number> {
    logger.info('Yahoo Finance sync placeholder');
    return 0;
  }
}

export const yahooFinanceService = new YahooFinanceService();
/*
// basic placedholder for yahoo finance integration.
import logger from '../utils/logger';

export class YahooFinanceService {
  async syncAllStocks(): Promise<number> {
    logger.info('Yahoo Finance sync (placeholder)');
    return 0;
  }
}

export const yahooFinanceService = new YahooFinanceService();

*/

/*
import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger';

const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

interface YahooQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface HistoricalBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class YahooFinanceService {
  private getSymbolSuffix(exchange: string): string {
    if (exchange === 'NSE') return '.NS';
    if (exchange === 'BSE') return '.BO';
    return ''; // NASDAQ/NYSE use raw symbol
  }

  async getQuote(symbol: string, exchange: string): Promise<YahooQuote | null> {
    const cacheKey = `quote_${symbol}_${exchange}`;
    const cached = cache.get<YahooQuote>(cacheKey);
    if (cached) return cached;

    const yahooSymbol = symbol + this.getSymbolSuffix(exchange);

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          Accept: 'application/json',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result?.meta) return null;

      const meta = result.meta;
      const price = meta.regularMarketPrice || 0;
      const prevClose = meta.chartPreviousClose || meta.previousClose || price;
      const change = price - prevClose;
      const changePercent = (change / prevClose) * 100;

      const quote: YahooQuote = {
        symbol,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        volume: meta.regularMarketVolume || 0,
        high: meta.regularMarketDayHigh || price,
        low: meta.regularMarketDayLow || price,
        open: meta.regularMarketOpen || price,
        previousClose: prevClose,
      };

      cache.set(cacheKey, quote);
      return quote;
    } catch (error: any) {
      if (error.response?.status === 429) {
        logger.warn(`Yahoo rate limit: ${yahooSymbol}`);
      } else {
        logger.error(`Yahoo error for ${yahooSymbol}:`, error.message);
      }
      return null;
    }
  }

  async getHistorical(
    symbol: string,
    exchange: string,
    range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '1mo',
    interval: '1m' | '5m' | '15m' | '1h' | '1d' = '1d'
  ): Promise<HistoricalBar[]> {
    const cacheKey = `hist_${symbol}_${exchange}_${range}_${interval}`;
    const cached = cache.get<HistoricalBar[]>(cacheKey);
    if (cached) return cached;

    const yahooSymbol = symbol + this.getSymbolSuffix(exchange);

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await axios.get(url, {
        params: { range, interval },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
        return [];
      }

      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      const bars: HistoricalBar[] = timestamps
        .map((ts: number, i: number) => ({
          timestamp: ts * 1000, // Convert to milliseconds
          open: quotes.open[i] || 0,
          high: quotes.high[i] || 0,
          low: quotes.low[i] || 0,
          close: quotes.close[i] || 0,
          volume: quotes.volume[i] || 0,
        }))
        .filter((bar: HistoricalBar) => bar.close > 0); // Remove invalid bars

      cache.set(cacheKey, bars, 1800); // 30 min cache for historical
      return bars;
    } catch (error: any) {
      logger.error(`Yahoo historical error for ${yahooSymbol}:`, error.message);
      return [];
    }
  }

  async syncStock(stockId: number, symbol: string, exchange: string): Promise<boolean> {
    const quote = await this.getQuote(symbol, exchange);
    if (!quote) return false;

    try {
      const prisma = (await import('../db/prisma')).default;
      await prisma.stock.update({
        where: { id: stockId },
        data: {
          currentPrice: quote.price,
          dayChange: quote.change,
          dayChangePercent: quote.changePercent,
          volume: BigInt(quote.volume),
          lastUpdated: new Date(),
        },
      });

      logger.info(`Synced ${symbol}: ₹${quote.price} (${quote.changePercent}%)`);
      return true;
    } catch (error) {
      logger.error(`Failed to sync ${symbol}:`, error);
      return false;
    }
  }

  async syncAllStocks(): Promise<number> {
    const prisma = (await import('../db/prisma')).default;
    const stocks = await prisma.stock.findMany();

    let synced = 0;
    for (const stock of stocks) {
      const success = await this.syncStock(stock.id, stock.symbol, stock.exchange);
      if (success) synced++;

      // Rate limit: 300ms between requests
      await new Promise((r) => setTimeout(r, 300));
    }

    logger.info(`Synced ${synced}/${stocks.length} stocks from Yahoo Finance`);
    return synced;
  }
}

export const yahooFinanceService = new YahooFinanceService();


*/