import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { config } from '../config';
import { cache } from '../db/redis';
import logger from '../utils/logger';
import pLimit from 'p-limit';

// Limit concurrent API requests to avoid rate limits
const apiLimit = pLimit(5);

// ============================================
// SCHEMAS - Validate API responses
// ============================================

const IEXQuoteSchema = z.object({
  symbol: z.string(),
  companyName: z.string(),
  latestPrice: z.number().nullable(),
  change: z.number().nullable(),
  changePercent: z.number().nullable(),
  volume: z.number().nullable(),
  avgTotalVolume: z.number().nullable(),
  week52High: z.number().nullable(),
  week52Low: z.number().nullable(),
  marketCap: z.number().nullable(),
  peRatio: z.number().nullable(),
}).passthrough();

const AlphaVantageQuoteSchema = z.object({
  'Global Quote': z.object({
    '01. symbol': z.string(),
    '05. price': z.string(),
    '09. change': z.string(),
    '10. change percent': z.string(),
    '06. volume': z.string(),
  }),
}).passthrough();

// ============================================
// TYPES
// ============================================

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  peRatio?: number;
  source: 'iex' | 'alphavantage' | 'cache';
  lastUpdated: Date;
}

interface FetchError {
  symbol: string;
  error: string;
  retryable: boolean;
}

// ============================================
// IEX CLOUD SERVICE
// ============================================

export class IEXCloudService {
  private baseUrl: string;
  private apiKey: string;
  private readonly CACHE_TTL = 15; // 15 seconds cache

  constructor() {
    this.baseUrl = config.apis.iexCloud.baseUrl;
    this.apiKey = config.apis.iexCloud.apiKey || '';
    
    if (!this.apiKey) {
      logger.warn('IEX Cloud API key not configured');
    }
  }

  async fetchQuote(symbol: string): Promise<StockQuote | null> {
    // Check cache first (Challenge 6: Rate Limit Prevention)
    const cacheKey = `stock:iex:${symbol}`;
    const cached = await cache.get<StockQuote>(cacheKey);
    
    if (cached) {
      logger.debug(`Cache hit for ${symbol}`);
      return { ...cached, source: 'cache' };
    }

    try {
      logger.debug(`Fetching ${symbol} from IEX Cloud`);
      
      const response = await axios.get(
        `${this.baseUrl}/stock/${symbol}/quote`,
        {
          params: { token: this.apiKey },
          timeout: 10000, // 10 second timeout
        }
      );

      // Challenge 7: Validate response structure
      const validated = IEXQuoteSchema.safeParse(response.data);

      if (!validated.success) {
        logger.error('Invalid IEX response structure', {
          symbol,
          errors: validated.error.issues,
          data: response.data,
        });
        return null;
      }

      const data = validated.data;
      
      // Handle null values from API
      if (data.latestPrice === null) {
        logger.warn(`No price data for ${symbol}`);
        return null;
      }

      const quote: StockQuote = {
        symbol: data.symbol,
        name: data.companyName,
        price: data.latestPrice,
        change: data.change || 0,
        changePercent: data.changePercent || 0,
        volume: data.volume || 0,
        marketCap: data.marketCap || undefined,
        high52Week: data.week52High || undefined,
        low52Week: data.week52Low || undefined,
        peRatio: data.peRatio || undefined,
        source: 'iex',
        lastUpdated: new Date(),
      };

      // Cache the result
      await cache.set(cacheKey, quote, this.CACHE_TTL);
      
      logger.info(`Successfully fetched ${symbol} from IEX`, {
        price: quote.price,
        changePercent: quote.changePercent,
      });

      return quote;

    } catch (error) {
      return this.handleError(symbol, error);
    }
  }

  async fetchMultipleQuotes(symbols: string[]): Promise<{
    quotes: StockQuote[];
    errors: FetchError[];
  }> {
    const quotes: StockQuote[] = [];
    const errors: FetchError[] = [];

    logger.info(`Fetching ${symbols.length} quotes from IEX`);

    // Challenge 6: Rate limit with concurrent control
    const promises = symbols.map(symbol =>
      apiLimit(async () => {
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const quote = await this.fetchQuote(symbol);
        
        if (quote) {
          quotes.push(quote);
        } else {
          errors.push({
            symbol,
            error: 'Failed to fetch quote',
            retryable: true,
          });
        }
      })
    );

    await Promise.allSettled(promises);

    logger.info(`Fetched ${quotes.length}/${symbols.length} quotes`, {
      success: quotes.length,
      failed: errors.length,
    });

    return { quotes, errors };
  }

  private handleError(symbol: string, error: unknown): null {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 404) {
        logger.warn(`Stock not found: ${symbol}`);
        return null;
      }
      
      if (axiosError.response?.status === 429) {
        logger.error('IEX Cloud rate limit exceeded', {
          symbol,
          retryAfter: axiosError.response.headers['retry-after'],
        });
        // TODO: Implement exponential backoff
        return null;
      }
      
      if (axiosError.code === 'ETIMEDOUT') {
        logger.error('IEX Cloud timeout', { symbol });
        return null;
      }
      
      logger.error('IEX Cloud API error', {
        symbol,
        status: axiosError.response?.status,
        message: axiosError.message,
      });
    } else {
      logger.error('Unexpected error fetching from IEX', {
        symbol,
        error: String(error),
      });
    }
    
    return null;
  }
}

// ============================================
// ALPHA VANTAGE SERVICE (FALLBACK)
// ============================================

export class AlphaVantageService {
  private baseUrl: string;
  private apiKey: string;
  private readonly CACHE_TTL = 60; // 1 minute cache (free tier has lower limits)

  constructor() {
    this.baseUrl = config.apis.alphaVantage.baseUrl;
    this.apiKey = config.apis.alphaVantage.apiKey || '';
    
    if (!this.apiKey) {
      logger.warn('Alpha Vantage API key not configured');
    }
  }

  async fetchQuote(symbol: string): Promise<StockQuote | null> {
    const cacheKey = `stock:av:${symbol}`;
    const cached = await cache.get<StockQuote>(cacheKey);
    
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    try {
      logger.debug(`Fetching ${symbol} from Alpha Vantage`);
      
      const response = await axios.get(this.baseUrl + '/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      // Alpha Vantage returns error messages in JSON
      if (response.data['Error Message']) {
        logger.warn(`Alpha Vantage error for ${symbol}:`, response.data['Error Message']);
        return null;
      }

      if (response.data['Note']) {
        logger.warn('Alpha Vantage rate limit (Note message):', response.data['Note']);
        return null;
      }

      const validated = AlphaVantageQuoteSchema.safeParse(response.data);

      if (!validated.success) {
        logger.error('Invalid Alpha Vantage response', {
          symbol,
          errors: validated.error.issues,
        });
        return null;
      }

      const data = validated.data['Global Quote'];
      
      const quote: StockQuote = {
        symbol: data['01. symbol'],
        name: data['01. symbol'], // AV doesn't provide company name in this endpoint
        price: parseFloat(data['05. price']),
        change: parseFloat(data['09. change']),
        changePercent: parseFloat(data['10. change percent'].replace('%', '')),
        volume: parseInt(data['06. volume']),
        source: 'alphavantage',
        lastUpdated: new Date(),
      };

      await cache.set(cacheKey, quote, this.CACHE_TTL);
      
      return quote;

    } catch (error) {
      logger.error('Alpha Vantage API error', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

// ============================================
// UNIFIED STOCK SERVICE (WITH FALLBACKS)
// ============================================

export class StockPriceService {
  private iexService: IEXCloudService;
  private alphaVantageService: AlphaVantageService;

  constructor() {
    this.iexService = new IEXCloudService();
    this.alphaVantageService = new AlphaVantageService();
  }

  /**
   * Fetch stock quote with automatic fallback
   */
  async getQuote(symbol: string, exchange: string = 'NASDAQ'): Promise<StockQuote | null> {
    // Try IEX Cloud first (faster, real-time)
    let quote = await this.iexService.fetchQuote(symbol);
    
    if (quote) {
      return quote;
    }

    // Fallback to Alpha Vantage
    logger.info(`Falling back to Alpha Vantage for ${symbol}`);
    quote = await this.alphaVantageService.fetchQuote(symbol);
    
    if (quote) {
      return quote;
    }

    // All sources failed
    logger.error(`Failed to fetch quote for ${symbol} from all sources`);
    return null;
  }

  /**
   * Fetch multiple quotes with batch optimization
   */
  async getMultipleQuotes(
    symbols: string[],
    exchange: string = 'NASDAQ'
  ): Promise<StockQuote[]> {
    logger.info(`Fetching quotes for ${symbols.length} symbols`);

    // Use IEX batch endpoint (more efficient)
    const { quotes, errors } = await this.iexService.fetchMultipleQuotes(symbols);

    // Retry failed symbols with Alpha Vantage
    if (errors.length > 0) {
      logger.info(`Retrying ${errors.length} failed symbols with Alpha Vantage`);
      
      for (const { symbol } of errors) {
        const quote = await this.alphaVantageService.fetchQuote(symbol);
        if (quote) {
          quotes.push(quote);
        }
      }
    }

    return quotes;
  }

  /**
   * Get cached quote (no API call)
   */
  async getCachedQuote(symbol: string): Promise<StockQuote | null> {
    const iexCache = await cache.get<StockQuote>(`stock:iex:${symbol}`);
    if (iexCache) return iexCache;

    const avCache = await cache.get<StockQuote>(`stock:av:${symbol}`);
    if (avCache) return avCache;

    return null;
  }
}

// Export singleton instance
export const stockPriceService = new StockPriceService();
