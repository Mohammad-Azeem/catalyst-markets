import prisma from '../db/prisma';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';

interface SentimentData {
  score: number;
  sentiment: string;
  marketMomentum: number;
  volatilityIndex: number;
  putCallRatio: number;
  advanceDecline: number;
}

export class FearGreedService {
  /**
   * Calculate Fear & Greed Index (0-100)
   * Inspired by CNN Fear & Greed Index methodology
   */
  async calculateIndex(): Promise<SentimentData> {
    try {
      // Get all stocks for market breadth calculation
      const stocks = await prisma.stock.findMany({
        select: {
          dayChangePercent: true,
          high52Week: true,
          low52Week: true,
          currentPrice: true,
        },
      });

      if (stocks.length === 0) {
        throw new Error('No stock data available');
      }

      // 1. MARKET MOMENTUM (25% weight)
      // Calculate % of stocks above their 50-day moving average (simplified)
      const positiveStocks = stocks.filter((s) => Number(s.dayChangePercent) > 0).length;
      const marketMomentum = (positiveStocks / stocks.length) * 100;

      // 2. VOLATILITY INDEX (20% weight)
      // Simplified: Use average absolute price change as volatility proxy
      const volatilityIndex = Math.min(
        stocks.reduce((sum, s) => sum + Math.abs(Number(s.dayChangePercent)), 0) / stocks.length,
        50 // Cap at 50
      );

      // 3. PUT-CALL RATIO (15% weight)
      // Simplified: Random for now, replace with actual options data
      // Higher ratio = more fear (people buying puts for protection)
      const putCallRatio = 0.7 + Math.random() * 0.6; // 0.7-1.3 range

      // 4. ADVANCE-DECLINE RATIO (20% weight)
      // % of stocks advancing vs declining
      const advancing = stocks.filter((s) => Number(s.dayChangePercent) > 0).length;
      const declining = stocks.filter((s) => Number(s.dayChangePercent) < 0).length;
      const advanceDecline = declining > 0 ? (advancing / declining) * 100 : 100;

      // 5. 52-WEEK HIGH/LOW (20% weight)
      // % of stocks near 52-week highs vs lows
      const nearHighs = stocks.filter((s) => {
        if (!s.high52Week || !s.currentPrice) return false;
        const ratio = Number(s.currentPrice) / Number(s.high52Week);
        return ratio >= 0.95; // Within 5% of 52W high
      }).length;

      const high52WeekPercent = (nearHighs / stocks.length) * 100;

      // CALCULATE WEIGHTED SCORE
      let score = 0;

      // Market Momentum (25%): Higher momentum = more greed
      score += (marketMomentum / 100) * 25;

      // Volatility (20%): Lower volatility = more greed
      score += (1 - volatilityIndex / 50) * 20;

      // Put-Call Ratio (15%): Lower ratio = more greed
      score += (1 - Math.min(putCallRatio, 1.5) / 1.5) * 15;

      // Advance-Decline (20%): More advances = more greed
      score += Math.min(advanceDecline / 200, 1) * 20;

      // 52-Week Highs (20%): More highs = more greed
      score += (high52WeekPercent / 100) * 20;

      // Clamp score between 0-100
      score = Math.max(0, Math.min(100, score));

      // Determine sentiment label
      let sentiment: string;
      if (score <= 25) sentiment = 'EXTREME_FEAR';
      else if (score <= 45) sentiment = 'FEAR';
      else if (score <= 55) sentiment = 'NEUTRAL';
      else if (score <= 75) sentiment = 'GREED';
      else sentiment = 'EXTREME_GREED';

      return {
        score: Math.round(score),
        sentiment,
        marketMomentum: Number(marketMomentum.toFixed(2)),
        volatilityIndex: Number(volatilityIndex.toFixed(2)),
        putCallRatio: Number(putCallRatio.toFixed(3)),
        advanceDecline: Number(advanceDecline.toFixed(2)),
      };
    } catch (error) {
      logger.error('Fear/Greed calculation error:', error);
      throw error;
    }
  }

  /**
   * Save today's sentiment to database
   */
  async saveSentiment(data: SentimentData): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.marketSentiment.upsert({
      where: { date: today },
      update: {
        fearGreedScore: data.score,
        marketMomentum: data.marketMomentum,
        volatilityIndex: data.volatilityIndex,
        putCallRatio: data.putCallRatio,
        advanceDecline: data.advanceDecline,
        sentiment: data.sentiment,
      },
      create: {
        date: today,
        fearGreedScore: data.score,
        marketMomentum: data.marketMomentum,
        volatilityIndex: data.volatilityIndex,
        putCallRatio: data.putCallRatio,
        advanceDecline: data.advanceDecline,
        sentiment: data.sentiment,
      },
    });

    logger.info(`Saved Fear/Greed Index: ${data.score} (${data.sentiment})`);
  }

  /**
   * Get current sentiment
   */
  async getCurrentSentiment(): Promise<SentimentData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sentiment = await prisma.marketSentiment.findUnique({
      where: { date: today },
    });

    // If not calculated today, calculate now
    if (!sentiment) {
      const data = await this.calculateIndex();
      await this.saveSentiment(data);
      return data;
    }

    return {
      score: sentiment.fearGreedScore,
      sentiment: sentiment.sentiment,
      marketMomentum: Number(sentiment.marketMomentum),
      volatilityIndex: Number(sentiment.volatilityIndex),
      putCallRatio: Number(sentiment.putCallRatio),
      advanceDecline: Number(sentiment.advanceDecline),
    };
  }

  /**
   * Get historical sentiment (last 30 days)
   */
  async getHistoricalSentiment(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await prisma.marketSentiment.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });
  }
}

export const fearGreedService = new FearGreedService();