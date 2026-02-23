import prisma from '../db/prisma';
import { cache } from '../db/redis';
import logger from '../utils/logger';

// ============================================
// WATCHLIST SERVICE
// ============================================

export interface WatchlistStock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  currentPrice: number;
  dayChangePercent: number;
  addedAt: Date;
}

export interface Watchlist {
  id: number;
  name: string;
  stocks: WatchlistStock[];
  stockCount: number;
}

export class WatchlistService {
  /**
   * Get all watchlists for a user
   */
  async getUserWatchlists(userId: number): Promise<Watchlist[]> {
    const cacheKey = `watchlists:user:${userId}`;
    const cached = await cache.get<Watchlist[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const watchlists = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        stocks: {
          include: {
            stock: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    const result =  watchlists.map((w: any) => ({
      id: w.id,
      name: w.name,
      stocks: w.stocks.map((ws: any) => ({
        id: ws.id,
        symbol: ws.stock.symbol,
        name: ws.stock.name,
        exchange: ws.stock.exchange,
        currentPrice: ws.stock.currentPrice.toNumber(),
        dayChangePercent: ws.stock.dayChangePercent.toNumber(),
        addedAt: ws.addedAt,
      })),
      stockCount: w.stocks.length,
    }));

    // Cache for 30 seconds
    await cache.set(cacheKey, result, 30);

    return result;
  }

  /**
   * Get single watchlist
   */
  async getWatchlist(watchlistId: number, userId: number): Promise<Watchlist | null> {
    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
      include: {
        stocks: {
          include: {
            stock: true,
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });

    if (!watchlist) return null;

    return {
      id: watchlist.id,
      name: watchlist.name,
      stocks: watchlist.stocks.map((ws: any) => ({
        id: ws.id,
        symbol: ws.stock.symbol,
        name: ws.stock.name,
        exchange: ws.stock.exchange,
        currentPrice: ws.stock.currentPrice.toNumber(),
        dayChangePercent: ws.stock.dayChangePercent.toNumber(),
        addedAt: ws.addedAt,
      })),
      stockCount: watchlist.stocks.length,
    };
  }

  /**
   * Create new watchlist
   */
  async createWatchlist(userId: number, name: string): Promise<Watchlist> {
    const watchlist = await prisma.watchlist.create({
      data: {
        userId,
        name,
      },
      include: {
        stocks: {
          include: {
            stock: true,
          },
        },
      },
    });

    // Invalidate cache
    await cache.del(`watchlists:user:${userId}`);

    return {
      id: watchlist.id,
      name: watchlist.name,
      stocks: [],
      stockCount: 0,
    };
  }

  /**
   * Add stock to watchlist
   */
  async addStock(
    watchlistId: number,
    userId: number,
    symbol: string
  ): Promise<void> {
    // Verify watchlist belongs to user
    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    // Find stock
    const stock = await prisma.stock.findUnique({
      where: { symbol },
    });

    if (!stock) {
      throw new Error('Stock not found');
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistStock.findFirst({
      where: {
        watchlistId,
        stockId: stock.id,
      },
    });

    if (existing) {
      throw new Error('Stock already in watchlist');
    }

    // Add to watchlist
    await prisma.watchlistStock.create({
      data: {
        watchlistId,
        stockId: stock.id,
      },
    });

    // Invalidate cache
    await cache.del(`watchlists:user:${userId}`);

    logger.info('Stock added to watchlist', {
      watchlistId,
      symbol,
    });
  }

  /**
   * Remove stock from watchlist
   */
  async removeStock(
    watchlistId: number,
    stockId: number,
    userId: number
  ): Promise<void> {
    // Verify watchlist belongs to user
    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    await prisma.watchlistStock.delete({
      where: {
        watchlistId_stockId: {
          watchlistId,
          stockId,
        },
      },
    });

    // Invalidate cache
    await cache.del(`watchlists:user:${userId}`);

    logger.info('Stock removed from watchlist', { watchlistId, stockId });
  }

  /**
   * Delete watchlist
   */
  async deleteWatchlist(watchlistId: number, userId: number): Promise<void> {
    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    await prisma.watchlist.delete({
      where: { id: watchlistId },
    });

    // Invalidate cache
    await cache.del(`watchlists:user:${userId}`);

    logger.info('Watchlist deleted', { watchlistId });
  }
}

export const watchlistService = new WatchlistService();