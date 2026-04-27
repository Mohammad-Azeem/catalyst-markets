import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../db/prisma';
import logger from '../utils/logger';

export class IPOScraper {
  private readonly SOURCES = {
    chittorgarh: 'https://www.chittorgarh.com/ipo/ipo-in-india-list/81/',
    investorgain: 'https://www.investorgain.com/report/live-ipo-gmp/331/',
  };

  /**
   * Scrape live IPO data from Chittorgarh
   */

  
  async scrapeChittorgarh(): Promise<any[]> {
    try {
      const { data } = await axios.get(this.SOURCES.chittorgarh, { timeout: 10000 });
      const $ = cheerio.load(data);
      const ipos: any[] = [];

      $('table tbody tr').each((i, row) => {
        const cols = $(row).find('td');
        if (cols.length < 8) return;

        const name = $(cols[0]).text().trim();
        const type = name.includes('SME') ? 'SME' : 'MAINBOARD';
        const openDate = this.parseDate($(cols[1]).text());
        const closeDate = this.parseDate($(cols[2]).text());
        const listingDate = this.parseDate($(cols[3]).text());
        const priceText = $(cols[4]).text();
        const [low, high] = priceText.match(/\d+/g)?.map(Number) || [0, 0];
        const gmpText = $(cols[7]).text();
        const gmpMatch = gmpText.match(/([-+]?\d+)/);
        const gmpPrice = gmpMatch ? parseInt(gmpMatch[1]) : 0;

        ipos.push({
          companyName: name.replace(/\(SME\)/g, '').trim(),
          type,
          openDate,
          closeDate,
          listingDate,
          priceBandLow: low,
          priceBandHigh: high,
          gmpPrice,
          gmpPercent: high > 0 ? ((gmpPrice / high) * 100).toFixed(2) : 0,
        });
      });

      return ipos;
    } catch (error) {
      logger.error('Chittorgarh scrape error:', error);
      return [];
    }
  }

  /**
   * Scrape subscription data from Chittorgarh
   */
  async scrapeSubscriptions(ipoName: string): Promise<any> {
    try {
      // Mock for now - real implementation needs exact IPO page URL
      return {
        qibTimes: Math.random() * 50,
        niiTimes: Math.random() * 20,
        retailTimes: Math.random() * 5,
        totalTimes: Math.random() * 25,
      };
    } catch {
      return null;
    }
  }

  /**
   * Update database with scraped data
   */
  async updateDatabase(): Promise<number> {
    const scraped = await this.scrapeChittorgarh();
    let updated = 0;

    for (const data of scraped) {
      try {
        // Check if exists
        const existing = await prisma.iPO.findFirst({
          where: { companyName: { contains: data.companyName.split(' ')[0] } },
        });

        if (existing) {
          // Update GMP only
          await prisma.iPO.update({
            where: { id: existing.id },
            data: {
              gmpPrice: data.gmpPrice,
              gmpPercent: data.gmpPercent,
              lastGmpUpdate: new Date(),
            },
          });
        } else {
          // Create new IPO
          await prisma.iPO.create({
            data: {
              ...data,
              issueSizeCr: 0, // Will be updated manually
              lotSize: 1,
              status: this.determineStatus(data.openDate, data.closeDate),
            },
          });
        }
        updated++;
      } catch (error) {
        logger.error(`Failed to update ${data.companyName}:`, error);
      }
    }

    logger.info(`✅ Updated ${updated}/${scraped.length} IPOs`);
    return updated;
  }

  private parseDate(text: string): Date | null {
    const match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (!match) return null;
    const [, day, month, year] = match;
    return new Date(`${day} ${month} ${year}`);
  }

  private determineStatus(open: Date | null, close: Date | null): string {
    if (!open || !close) return 'UPCOMING';
    const now = new Date();
    if (now < open) return 'UPCOMING';
    if (now >= open && now <= close) return 'OPEN';
    return 'CLOSED';
  }
}

export const ipoScraper = new IPOScraper();