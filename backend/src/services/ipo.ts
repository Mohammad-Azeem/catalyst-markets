import axios from 'axios';
import { z } from 'zod';
import prisma from '../db/prisma';
import { cache } from '../db/redis';
import logger from '../utils/logger';
import { Prisma } from '@prisma/client';
//import type { Decimal } from '@prisma/client/runtime/library';

// ============================================
// IPO SERVICE
// ============================================

type Decimal = Prisma.Decimal;

export interface IPODetails {
  id: number;
  companyName: string;
  issueSizeCr: number | Prisma.Decimal;
  priceBandLow: number | Prisma.Decimal;
  priceBandHigh: number | Prisma.Decimal;
  openDate: Date;
  closeDate: Date;
  listingDate?: Date;
  lotSize: number;
  gmpPercent?: number | Decimal;
  retailSubscription?: number | Decimal;
  hniSubscription?: number;
  qibSubscription?: number;
  totalSubscription?: number;
  advisorVerdict?: string;
  advisorScore?: number;
  status: string;
}

export class IPOService {
  /**
   * Get all IPOs with filtering
   */
  async getIPOs(status?: string): Promise<IPODetails[]> {
    const cacheKey = `ipos:list:${status || 'all'}`;
    const cached = await cache.get<IPODetails[]>(cacheKey);
    
    if (cached) {
      logger.debug('Cache hit for IPO list');
      return cached;
    }

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const ipos = await prisma.iPO.findMany({
      where,
      orderBy: { openDate: 'desc' },
    });

    // Cache for 5 minutes
    await cache.set(cacheKey, ipos, 300);

    return ipos as unknown as IPODetails[];
  }

  /**
   * Get single IPO by ID
   */
  async getIPOById(id: number): Promise<IPODetails | null> {
    const ipo = await prisma.iPO.findUnique({
      where: { id },
    });

    return ipo as IPODetails | null;
  }

  /**
   * Simulate GMP data fetching (in real app, scrape from websites)
   */
  async updateGMPData(ipoId: number): Promise<void> {
    // In production, this would scrape from Chittorgarh/Investorgain
    // For now, simulate with random data
    
    const gmpPercent = Math.random() * 40 - 5; // -5% to 35%
    
    await prisma.iPO.update({
      where: { id: ipoId },
      data: {
        gmpPercent,
        gmpLastUpdated: new Date(),
      },
    });

    logger.info(`Updated GMP for IPO ${ipoId}`, { gmpPercent });
  }

  /**
   * Update subscription data
   */
  async updateSubscriptionData(
    ipoId: number,
    data: {
      retailSubscription: number;
      hniSubscription: number;
      qibSubscription: number;
    }
  ): Promise<void> {
    const totalSubscription = 
      (data.retailSubscription * 0.35) +
      (data.hniSubscription * 0.15) +
      (data.qibSubscription * 0.50);

    await prisma.iPO.update({
      where: { id: ipoId },
      data: {
        ...data,
        totalSubscription,
        subscriptionLastUpdated: new Date(),
      },
    });

    logger.info(`Updated subscription data for IPO ${ipoId}`, data);
  }

  /**
   * IPO Advisor - Calculate verdict
   */
  async calculateAdvisorVerdict(ipoId: number): Promise<{
    verdict: 'APPLY' | 'NEUTRAL' | 'AVOID';
    score: number;
    reasons: string[];
    risks: string[];
  }> {
    const ipo = await prisma.iPO.findUnique({
      where: { id: ipoId },
    });

    if (!ipo) {
      throw new Error('IPO not found');
    }

    let score = 0;
    const reasons: string[] = [];
    const risks: string[] = [];

    // Positive signals
    if (ipo.gmpPercent && Number(ipo.gmpPercent) > 20) {
      score += 2;
      reasons.push(`Strong GMP of ${ipo.gmpPercent.toFixed(1)}%`);
    }

    if (ipo.qibSubscription && Number(ipo.qibSubscription) > 3) {
      score += 2;
      reasons.push(`QIB subscription ${ipo.qibSubscription.toFixed(1)}x`);
    }

    if (ipo.revenue3yrCagr && Number(ipo.revenue3yrCagr) > 25) {
      score += 1;
      reasons.push(`3-year revenue CAGR: ${ipo.revenue3yrCagr}%`);
    }

    if (ipo.promoterHoldingPercent && Number(ipo.promoterHoldingPercent) > 60) {
      score += 1;
      reasons.push(`High promoter holding: ${ipo.promoterHoldingPercent}%`);
    }

    // Negative signals
    if (ipo.debtToEquity && Number(ipo.debtToEquity) > 2) {
      score -= 2;
      risks.push(`High debt-to-equity ratio: ${ipo.debtToEquity}`);
    }

    if (ipo.profitMarginAvg && Number(ipo.profitMarginAvg) < 5) {
      score -= 1;
      risks.push(`Low profit margins: ${ipo.profitMarginAvg}%`);
    }

    // Determine verdict
    let verdict: 'APPLY' | 'NEUTRAL' | 'AVOID';
    if (score >= 4) {
      verdict = 'APPLY';
    } else if (score >= 2) {
      verdict = 'NEUTRAL';
    } else {
      verdict = 'AVOID';
    }

    // Update database
    await prisma.iPO.update({
      where: { id: ipoId },
      data: {
        advisorVerdict: verdict,
        advisorScore: score,
        advisorFlags: risks,
      },
    });

    return { verdict, score, reasons, risks };
  }

  /**
   * Get upcoming IPOs
   */
  async getUpcomingIPOs(): Promise<IPODetails[]> {
    const now = new Date();

    const ipos = await prisma.iPO.findMany({
      where: {
        openDate: { gt: now },
      },
      orderBy: { openDate: 'asc' },
      take: 10,
    });

    return ipos as unknown as IPODetails[];
  }

  /**
   * Get open IPOs (currently accepting applications)
   */
  async getOpenIPOs(): Promise<IPODetails[]> {
    const now = new Date();

    const ipos = await prisma.iPO.findMany({
      where: {
        openDate: { lte: now },
        closeDate: { gte: now },
      },
      orderBy: { closeDate: 'asc' },
    });

    return ipos as unknown as IPODetails[];
  }
}

export const ipoService = new IPOService();
