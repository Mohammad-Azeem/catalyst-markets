import prisma from '../db/prisma';
import { cache } from '../db/redis';
import logger from '../utils/logger';

// ============================================
// PORTFOLIO SERVICE
// ============================================

export interface PortfolioStock {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  quantity: number;
  buyPrice: number;
  buyDate: Date;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface Portfolio {
  id: number;
  name: string;
  description?: string;
  stocks: PortfolioStock[];
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export class PortfolioService {
  /**
   * Get all portfolios for a user
   */
  async getUserPortfolios(userId: number): Promise<Portfolio[]> {
    const cacheKey = `portfolios:user:${userId}`;
    const cached = await cache.get<Portfolio[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        stocks: {
          include: {
            stock: true,
          },
        },
      },
    });

    const result = await Promise.all(
      portfolios.map((p:any) => this.calculatePortfolioMetrics(p))
    );

    // Cache for 1 minute
    await cache.set(cacheKey, result, 60);

    return result;
  }

  /**
   * Get single portfolio by ID
   */
  async getPortfolio(portfolioId: number, userId: number): Promise<Portfolio | null> {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        stocks: {
          include: {
            stock: true,
          },
        },
      },
    });

    if (!portfolio) return null;

    return this.calculatePortfolioMetrics(portfolio);
  }

  /**
   * Create new portfolio
   */
  async createPortfolio(
    userId: number,
    name: string,
    description?: string
  ): Promise<Portfolio> {
    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name,
        description,
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
    await cache.del(`portfolios:user:${userId}`);

    return this.calculatePortfolioMetrics(portfolio);
  }

  /**
   * Add stock to portfolio
   */
  async addStock(
    portfolioId: number,
    userId: number,
    data: {
      symbol: string;
      quantity: number;
      buyPrice: number;
      buyDate: Date;
    }
  ): Promise<void> {
    // Verify portfolio belongs to user
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Find or create stock
    let stock = await prisma.stock.findUnique({
      where: { symbol: data.symbol },
    });

    if (!stock) {
      throw new Error('Stock not found');
    }

    // Check if stock already in portfolio
    const existing = await prisma.portfolioStock.findFirst({
      where: {
        portfolioId,
        stockId: stock.id,
      },
    });

    if (existing) {
      throw new Error('Stock already in portfolio');
    }

    // Add stock to portfolio
    await prisma.portfolioStock.create({
      data: {
        portfolioId,
        stockId: stock.id,
        buyPrice: data.buyPrice,
        quantity: data.quantity,
        buyDate: data.buyDate,
      },
    });

    // Invalidate cache
    await cache.del(`portfolios:user:${userId}`);

    logger.info('Stock added to portfolio', {
      portfolioId,
      symbol: data.symbol,
      quantity: data.quantity,
    });
  }

  /**
   * Remove stock from portfolio
   */
  async removeStock(
    portfolioId: number,
    stockId: number,
    userId: number
  ): Promise<void> {
    // Verify portfolio belongs to user
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    await prisma.portfolioStock.delete({
      where: {
        portfolioId_stockId: {
          portfolioId,
          stockId,
        },
      },
    });

    // Invalidate cache
    await cache.del(`portfolios:user:${userId}`);

    logger.info('Stock removed from portfolio', { portfolioId, stockId });
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(portfolioId: number, userId: number): Promise<void> {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    await prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    // Invalidate cache
    await cache.del(`portfolios:user:${userId}`);

    logger.info('Portfolio deleted', { portfolioId });
  }

  /**
   * Calculate portfolio metrics (P&L)
   */
  private async calculatePortfolioMetrics(portfolio: any): Promise<Portfolio> {
    let totalInvested = 0;
    let currentValue = 0;

    const stocks: PortfolioStock[] = portfolio.stocks.map((ps: any) => {
      const invested = ps.buyPrice * ps.quantity;
      const current = ps.stock.currentPrice * ps.quantity;
      const gainLoss = current - invested;
      const gainLossPercent = (gainLoss / invested) * 100;

      totalInvested += invested;
      currentValue += current;

      return {
        id: ps.id,
        symbol: ps.stock.symbol,
        name: ps.stock.name,
        exchange: ps.stock.exchange,
        quantity: ps.quantity,
        buyPrice: ps.buyPrice,
        buyDate: ps.buyDate,
        currentPrice: ps.stock.currentPrice,
        currentValue: current,
        investedValue: invested,
        gainLoss,
        gainLossPercent,
      };
    });

    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 
      ? (totalGainLoss / totalInvested) * 100 
      : 0;

    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      stocks,
      totalInvested,
      currentValue,
      totalGainLoss,
      totalGainLossPercent,
    };
  }
}

export const portfolioService = new PortfolioService();