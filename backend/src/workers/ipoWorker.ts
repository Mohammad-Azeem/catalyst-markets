import cron from 'node-cron';
import { ipoScraper } from '../services/ipoScraper';
import { aiIPOAnalyzer } from '../services/aiIPOAnalyzer';
import logger from '../utils/logger';

export function startIPOWorker() {
  // Scrape IPOs daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('🕷️  Starting daily IPO scrape...');
    await ipoScraper.updateDatabase();
  }, { timezone: 'Asia/Kolkata' });

  // Analyze new IPOs every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('🤖 Running AI IPO analysis...');
    await aiIPOAnalyzer.analyzeAll();
  }, { timezone: 'Asia/Kolkata' });

  logger.info('📅 IPO worker scheduled (scrape 9AM, analyze 6h)');
}