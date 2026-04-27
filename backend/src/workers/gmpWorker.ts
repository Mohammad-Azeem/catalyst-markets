import cron from 'node-cron';
import { gmpScraperService } from '../services/gmpScraper';
import logger from '../utils/logger';

export function startGMPWorker() {
  // Update GMP every 30 minutes during market hours (9 AM - 4 PM IST)
  cron.schedule('*/30 9-16 * * 1-5', async () => {
    logger.info('📊 Starting GMP update...');
    
    try {
      const updated = await gmpScraperService.updateGMPData();
      
      // If scraping failed, use mock updates
      if (updated === 0) {
        await gmpScraperService.mockGMPUpdate();
      }
    } catch (error) {
      logger.error('GMP worker error:', error);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('📅 GMP updater scheduled (every 30min, market hours)');
}