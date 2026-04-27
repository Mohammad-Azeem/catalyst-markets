import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../db/prisma';
import logger from '../utils/logger';

interface GMPData {
  companyName: string;
  gmpPercent: number;
  gmpPrice: number;
}

export class GMPScraperService {
  private readonly CHITTORGARH_URL = 'https://www.chittorgarh.com/ipo/ipo_grey_market_premium.asp';
  private readonly USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

  /**
   * Scrape GMP data from Chittorgarh
   * Note: This is a simplified version. Real scraping may need to handle
   * dynamic content, pagination, or API endpoints.
   */
  async scrapeGMP(): Promise<GMPData[]> {
    try {
      logger.info('🕷️  Scraping GMP data from Chittorgarh...');

      const response = await axios.get(this.CHITTORGARH_URL, {
        headers: { 'User-Agent': this.USER_AGENT },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const gmpData: GMPData[] = [];

      // Parse the IPO GMP table
      // NOTE: This selector may need adjustment based on actual HTML structure
      $('table.table-ipo tr').each((index, element) => {
        if (index === 0) return; // Skip header row

        const cols = $(element).find('td');
        if (cols.length < 3) return;

        const companyName = $(cols[0]).text().trim();
        const gmpText = $(cols[2]).text().trim();

        // Extract GMP value (e.g., "₹50 (25%)" or "+50")
        const gmpMatch = gmpText.match(/[+-]?\\d+/);
        if (!gmpMatch) return;

        const gmpPrice = parseInt(gmpMatch[0]);
        const percentMatch = gmpText.match(/\\(([-+]?\\d+\\.?\\d*)%\\)/);
        const gmpPercent = percentMatch ? parseFloat(percentMatch[1]) : 0;

        gmpData.push({
          companyName,
          gmpPrice,
          gmpPercent,
        });
      });

      logger.info(`✅ Scraped ${gmpData.length} IPO GMP entries`);
      return gmpData;
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 429) {
        logger.warn('⚠️  Chittorgarh blocked request (403/429)');
      } else {
        logger.error('GMP scraping error:', error.message);
      }
      return [];
    }
  }

  /**
   * Update IPO GMP data in database
   */
  async updateGMPData(): Promise<number> {
    const scrapedData = await this.scrapeGMP();
    if (scrapedData.length === 0) {
      logger.warn('No GMP data scraped, skipping update');
      return 0;
    }

    let updated = 0;

    for (const data of scrapedData) {
      try {
        // Find IPO by company name (fuzzy match)
        const ipo = await prisma.iPO.findFirst({
          where: {
            companyName: {
              contains: data.companyName.split(' ')[0], // Match first word
              mode: 'insensitive',
            },
            status: { in: ['UPCOMING', 'OPEN'] }, // Only update active IPOs
          },
        });

        if (!ipo) continue;

        // Update GMP data
        await prisma.iPO.update({
          where: { id: ipo.id },
          data: {
            gmpPercent: data.gmpPercent,
            gmpPrice: data.gmpPrice,
            lastGmpUpdate: new Date(),
          },
        });

        logger.info(`✅ Updated GMP for ${ipo.companyName}: ${data.gmpPercent}%`);
        updated++;
      } catch (error) {
        logger.error(`Failed to update GMP for ${data.companyName}:`, error);
      }
    }

    logger.info(`📊 Updated GMP for ${updated}/${scrapedData.length} IPOs`);
    return updated;
  }

  /**
   * Fallback: Use mock GMP updates (for testing when scraping fails)
   */
  async mockGMPUpdate(): Promise<number> {
    logger.info('🎲 Using mock GMP updates (scraping unavailable)');

    const activeIPOs = await prisma.iPO.findMany({
      where: { status: { in: ['UPCOMING', 'OPEN'] } },
    });

    let updated = 0;

    for (const ipo of activeIPOs) {
      // Generate realistic mock GMP fluctuation (±5% from current)
      const currentGMP = Number(ipo.gmpPercent) || 0;
      const fluctuation = (Math.random() - 0.5) * 10; // -5% to +5%
      const newGMP = Math.max(-50, Math.min(200, currentGMP + fluctuation)); // Cap between -50% and 200%

      await prisma.iPO.update({
        where: { id: ipo.id },
        data: {
          gmpPercent: Number(newGMP.toFixed(2)),
          lastGmpUpdate: new Date(),
        },
      });

      updated++;
    }

    logger.info(`✅ Mock-updated ${updated} IPO GMPs`);
    return updated;
  }
}

export const gmpScraperService = new GMPScraperService();