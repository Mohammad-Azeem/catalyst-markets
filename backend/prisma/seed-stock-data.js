import { PrismaClient } from '@prisma/client';

//const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STOCK_DATA = [
  {
    symbol: 'RELIANCE',
    eps: 85.5,
    peRatio: 16.5,
    pbRatio: 2.1,
    roe: 9.2,
    roce: 11.5,
    debtToEquity: 0.45,
    dividendYield: 0.35,
    bookValue: 670,
    revenue: 920000,
    profit: 73000,
    marketCap: 1750000,
  },
  {
    symbol: 'TCS',
    eps: 120,
    peRatio: 28.5,
    pbRatio: 11.2,
    roe: 42.5,
    roce: 48.2,
    debtToEquity: 0.02,
    dividendYield: 1.8,
    bookValue: 290,
    revenue: 225000,
    profit: 42000,
    marketCap: 1300000,
  },
  {
    symbol: 'HDFCBANK',
    eps: 75,
    peRatio: 20.5,
    pbRatio: 2.8,
    roe: 17.5,
    roce: 8.5,
    debtToEquity: 0.85,
    dividendYield: 1.2,
    bookValue: 540,
    revenue: 185000,
    profit: 48000,
    marketCap: 1150000,
  },
  {
    symbol: 'INFY',
    eps: 68,
    peRatio: 22.5,
    pbRatio: 7.5,
    roe: 31.2,
    roce: 35.8,
    debtToEquity: 0.08,
    dividendYield: 2.5,
    bookValue: 220,
    revenue: 152000,
    profit: 23500,
    marketCap: 620000,
  },
  {
    symbol: 'ICICIBANK',
    eps: 42,
    peRatio: 16.8,
    pbRatio: 2.4,
    roe: 16.8,
    roce: 9.2,
    debtToEquity: 0.92,
    dividendYield: 1.1,
    bookValue: 290,
    revenue: 145000,
    profit: 38000,
    marketCap: 750000,
  },
];

async function seedStockData() {
  console.log('📊 Seeding stock valuation data...');

  for (const data of STOCK_DATA) {
    try {
      await prisma.stock.updateMany({
        where: { symbol: data.symbol },
        data,
      });
      console.log(`✅ Updated ${data.symbol}`);
    } catch (error) {
      console.error(`❌ Failed ${data.symbol}:`, error.message);
    }
  }

  console.log('🎉 Stock data seeded!');
}

seedStockData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());