import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export class NewsService {
  private RSS_FEEDS = {  
    economicTimes: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
    moneycontrol: 'https://www.moneycontrol.com/rss/latestnews.xml',

  };

  async fetchNews(limit = 20): Promise<NewsItem[]> {
    try {
      const feeds = await Promise.all([
        this.parseFeed(this.RSS_FEEDS.economicTimes, 'ET'),
        this.parseFeed(this.RSS_FEEDS.moneycontrol, 'Moneycontrol'),
      ]);
      
      return feeds.flat().slice(0, limit);
    } catch (error) {
      logger.error('News fetch error:', error);
      return [];
    }
  }

  private async parseFeed(url: string, source: string): Promise<NewsItem[]> {
    try {
      const { data } = await axios.get(url, { timeout: 5000 });
      const $ = cheerio.load(data, { xmlMode: true });
      
      const items: NewsItem[] = [];
      $('item').each((_, el) => {
        items.push({
          title: $(el).find('title').text(),
          link: $(el).find('link').text(),
          pubDate: $(el).find('pubDate').text(),
          source,
        });
      });
      
      return items.slice(0, 10);
    } catch {
      return [];
    }
  }
}

export const newsService = new NewsService();