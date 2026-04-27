import prisma from '../db/prisma';
import logger from '../utils/logger';

interface PeerComparisonResult {
  stock: any;
  peers: any[];
  sectorAverage: {
    peRatio: number;
    pbRatio: number;
    roe: number;
    debtToEquity: number;
    dividendYield: number;
  };
}

export class PeerComparisonService {
  /**
   * Find peer companies (same sector, similar market cap)
   */
  async findPeers(symbol: string, limit: number = 5): Promise<PeerComparisonResult | null> {
    try {
      const stock = await prisma.stock.findFirst({
        where: { symbol: symbol.toUpperCase() },
      });

      if (!stock) {
        throw new Error('Stock not found');
      }

      const marketCap = Number(stock.marketCap) || 0;
      const sector = stock.sector;

      // Find peers: same sector, market cap within 50%-200% range
      const minCap = marketCap * 0.5;
      const maxCap = marketCap * 2.0;

      const peers = await prisma.stock.findMany({
        where: {
          sector,
          id: { not: stock.id }, // Exclude the stock itself
          marketCap: {
            gte: minCap,
            lte: maxCap,
          },
        },
        orderBy: { marketCap: 'desc' },
        take: limit,
      });

      // Calculate sector averages
      const allSectorStocks = await prisma.stock.findMany({
        where: { sector },
        select: {
          peRatio: true,
          pbRatio: true,
          roe: true,
          debtToEquity: true,
          dividendYield: true,
        },
      });

      const validStocks = allSectorStocks.filter(s => 
        s.peRatio && s.pbRatio && s.roe
      );

      const sectorAverage = {
        peRatio: this.calculateAverage(validStocks.map(s => Number(s.peRatio))),
        pbRatio: this.calculateAverage(validStocks.map(s => Number(s.pbRatio))),
        roe: this.calculateAverage(validStocks.map(s => Number(s.roe))),
        debtToEquity: this.calculateAverage(validStocks.map(s => Number(s.debtToEquity))),
        dividendYield: this.calculateAverage(validStocks.map(s => Number(s.dividendYield))),
      };

      logger.info(`Found ${peers.length} peers for ${symbol}`);

      return {
        stock,
        peers,
        sectorAverage,
      };
    } catch (error) {
      logger.error('Peer comparison error:', error);
      return null;
    }
  }

  /**
   * Calculate average, ignoring nulls and NaN
   */
  private calculateAverage(values: number[]): number {
    const valid = values.filter(v => !isNaN(v) && v !== null && v !== 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, v) => acc + v, 0);
    return Number((sum / valid.length).toFixed(2));
  }
}

export const peerComparisonService = new PeerComparisonService();