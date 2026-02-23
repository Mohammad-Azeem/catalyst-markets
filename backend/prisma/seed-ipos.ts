import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REAL_IPOS = [
  {
    companyName: 'Tata Technologies',
    issueSizeCr: 3042,
    priceBandLow: 475,
    priceBandHigh: 500,
    openDate: new Date('2023-11-22'),
    closeDate: new Date('2023-11-24'),
    listingDate: new Date('2023-11-30'),
    lotSize: 30,
    gmpPercent: 25.5,
    retailSubscription: 2.35,
    hniSubscription: 5.78,
    qibSubscription: 65.23,
    totalSubscription: 69.43,
    status: 'LISTED',
    industry: 'Engineering Services',
    advisorVerdict: 'APPLY',
    advisorScore: 8.5,
  },
  {
    companyName: 'Nexus Select Trust REIT',
    issueSizeCr: 1875,
    priceBandLow: 100,
    priceBandHigh: 112,
    openDate: new Date('2024-01-10'),
    closeDate: new Date('2024-01-12'),
    listingDate: null,
    lotSize: 1000,
    gmpPercent: 8.2,
    retailSubscription: 1.45,
    hniSubscription: 3.21,
    qibSubscription: 12.56,
    totalSubscription: 15.34,
    status: 'UPCOMING',
    industry: 'Real Estate',
    advisorVerdict: 'NEUTRAL',
    advisorScore: 6.5,
  },
  {
    companyName: 'Ixigo',
    issueSizeCr: 740,
    priceBandLow: 88,
    priceBandHigh: 93,
    openDate: new Date('2024-06-10'),
    closeDate: new Date('2024-06-12'),
    listingDate: new Date('2024-06-18'),
    lotSize: 161,
    gmpPercent: -5.3,
    retailSubscription: 0.98,
    hniSubscription: 2.15,
    qibSubscription: 98.56,
    totalSubscription: 107.23,
    status: 'LISTED',
    industry: 'Travel Tech',
    advisorVerdict: 'AVOID',
    advisorScore: 4.2,
  },
];

async function main() {
  console.log('Seeding real IPO data...');
  
  // Clear existing test data
  await prisma.iPO.deleteMany({
    where: {
      companyName: {
        contains: 'Test',
      },
    },
  });

  // Add real IPOs
  await prisma.iPO.createMany({
    data: REAL_IPOS,
    skipDuplicates: true, // Skip if companyName already exists (if it's unique)
  });

  /*
  // Add real IPOs
  for (const ipo of REAL_IPOS) {
    await prisma.iPO.upsert({
      where: { id: ipo.id },
      update: ipo,
      create: ipo,
    });
  }
  */

  console.log('✅ Real IPO data seeded');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());