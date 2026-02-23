import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

// You MUST pass the adapter here for Prisma 7 "client" engine
const prisma = new PrismaClient({ adapter }) 
//const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // SEED STOCKS (NSE)
  // ============================================
  console.log('📈 Seeding NSE stocks...');

  const nseStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', sector: 'Energy', industry: 'Oil & Gas' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', sector: 'IT', industry: 'IT Services' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', sector: 'Financial Services', industry: 'Banking' },
    { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', sector: 'IT', industry: 'IT Services' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', sector: 'Financial Services', industry: 'Banking' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', exchange: 'NSE', sector: 'FMCG', industry: 'Consumer Goods' },
    { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', sector: 'FMCG', industry: 'Diversified' },
    { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', sector: 'Financial Services', industry: 'Banking' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE', sector: 'Telecom', industry: 'Telecommunications' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', exchange: 'NSE', sector: 'Financial Services', industry: 'Banking' },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd', exchange: 'NSE', sector: 'Infrastructure', industry: 'Construction' },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd', exchange: 'NSE', sector: 'Financial Services', industry: 'Banking' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', exchange: 'NSE', sector: 'Consumer Durables', industry: 'Paints' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', exchange: 'NSE', sector: 'Automobile', industry: 'Auto Manufacturers' },
    { symbol: 'WIPRO', name: 'Wipro Ltd', exchange: 'NSE', sector: 'IT', industry: 'IT Services' },
  ];

  for (const stock of nseStocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {},
      create: {
        ...stock,
        currentPrice: 0, // Will be updated by price workers
        dayChange: 0,
        dayChangePercent: 0,
        volume: BigInt(0),
      },
    });
  }

  console.log(`✅ Seeded ${nseStocks.length} NSE stocks`);

  // ============================================
  // SEED STOCKS (NASDAQ)
  // ============================================
  console.log('📈 Seeding NASDAQ stocks...');

  const nasdaqStocks = [
    { symbol: 'AAPL', name: 'Apple Inc', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', exchange: 'NASDAQ', sector: 'Technology', industry: 'Internet Services' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', exchange: 'NASDAQ', sector: 'Consumer Cyclical', industry: 'E-commerce' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
    { symbol: 'META', name: 'Meta Platforms Inc', exchange: 'NASDAQ', sector: 'Technology', industry: 'Social Media' },
    { symbol: 'TSLA', name: 'Tesla Inc', exchange: 'NASDAQ', sector: 'Automobile', industry: 'Electric Vehicles' },
    { symbol: 'AVGO', name: 'Broadcom Inc', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
    { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ', sector: 'Consumer Defensive', industry: 'Retail' },
    { symbol: 'NFLX', name: 'Netflix Inc', exchange: 'NASDAQ', sector: 'Communication Services', industry: 'Entertainment' },
  ];

  for (const stock of nasdaqStocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {},
      create: {
        ...stock,
        currentPrice: 0,
        dayChange: 0,
        dayChangePercent: 0,
        volume: BigInt(0),
      },
    });
  }

  console.log(`✅ Seeded ${nasdaqStocks.length} NASDAQ stocks`);

  // ============================================
  // SEED SAMPLE IPOs
  // ============================================
  console.log('💼 Seeding sample IPOs...');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const ipos = [
    {
      companyName: 'TechInnovate Solutions',
      issueSizeCr: 500,
      priceBandLow: 90,
      priceBandHigh: 95,
      openDate: tomorrow,
      closeDate: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
      lotSize: 150,
      industry: 'Technology',
      status: 'UPCOMING',
      gmpPercent: 25.5,
      retailSubscription: 0,
      hniSubscription: 0,
      qibSubscription: 0,
    },
    {
      companyName: 'GreenEnergy Power Ltd',
      issueSizeCr: 750,
      priceBandLow: 120,
      priceBandHigh: 125,
      openDate: nextWeek,
      closeDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      lotSize: 100,
      industry: 'Renewable Energy',
      status: 'UPCOMING',
      gmpPercent: 18.0,
      retailSubscription: 0,
      hniSubscription: 0,
      qibSubscription: 0,
    },
    {
      companyName: 'HealthCare Plus',
      issueSizeCr: 300,
      priceBandLow: 75,
      priceBandHigh: 80,
      openDate: nextMonth,
      closeDate: new Date(nextMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
      lotSize: 180,
      industry: 'Healthcare',
      status: 'UPCOMING',
      gmpPercent: 12.5,
      retailSubscription: 0,
      hniSubscription: 0,
      qibSubscription: 0,
    },
  ];

  for (const ipo of ipos) {
    await prisma.iPO.create({
      data: ipo,
    });
  }

  console.log(`✅ Seeded ${ipos.length} sample IPOs`);

  // ============================================
  // SEED FEAR & GREED HISTORY
  // ============================================
  console.log('📊 Seeding Fear & Greed history...');

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  for (const date of last30Days) {
    // Generate semi-random but realistic scores
    const baseScore = 55;
    const variation = Math.sin(date.getDate() / 5) * 20;
    const score = Math.round(baseScore + variation);

    let sentiment = 'NEUTRAL';
    if (score < 25) sentiment = 'EXTREME_FEAR';
    else if (score < 45) sentiment = 'FEAR';
    else if (score > 75) sentiment = 'EXTREME_GREED';
    else if (score > 55) sentiment = 'GREED';

    await prisma.fearGreedHistory.create({
      data: {
        market: 'INDIA',
        score,
        sentiment,
        vixValue: 15 + (50 - score) * 0.3,
        putCallRatio: 1.0 + (50 - score) * 0.01,
        marketMomentum: score > 50 ? 'BULLISH' : 'BEARISH',
        fiiNetFlow: (score - 50) * 100,
        recordedAt: date,
      },
    });
  }

  console.log(`✅ Seeded 30 days of Fear & Greed history`);

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });