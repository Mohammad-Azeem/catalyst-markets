import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const REAL_IPOS = [
  {
    companyName: 'Hyundai Motor India',
    issueSizeCr: 27870,
    priceBandLow: 1865,
    priceBandHigh: 1960,
    openDate: new Date('2024-10-15'),
    closeDate: new Date('2024-10-17'),
    listingDate: new Date('2024-10-22'),
    lotSize: 7,
    gmpPercent: -2.5,
    gmpPrice: -50,
    retailSubscription: 0.48,
    hniSubscription: 0.60,
    qibSubscription: 6.97,
    totalSubscription: 2.37,
    status: 'LISTED',
    industry: 'Automobile',
    leadManager: 'Kotak Mahindra, Citi, HSBC',
    minInvestment: 13720,
    advisorVerdict: 'NEUTRAL',
    advisorScore: 6.5,
  },
  {
    companyName: 'Swiggy Limited',
    issueSizeCr: 11327,
    priceBandLow: 371,
    priceBandHigh: 390,
    openDate: new Date('2024-11-06'),
    closeDate: new Date('2024-11-08'),
    listingDate: new Date('2024-11-13'),
    lotSize: 38,
    gmpPercent: 8.5,
    gmpPrice: 33,
    retailSubscription: 1.14,
    hniSubscription: 3.10,
    qibSubscription: 6.02,
    totalSubscription: 3.59,
    status: 'LISTED',
    industry: 'Food Delivery',
    advisorVerdict: 'NEUTRAL',
    advisorScore: 6.0,
  },
  {
    companyName: 'Waaree Energies',
    issueSizeCr: 4321,
    priceBandLow: 1427,
    priceBandHigh: 1503,
    openDate: new Date('2024-10-21'),
    closeDate: new Date('2024-10-23'),
    listingDate: new Date('2024-10-28'),
    lotSize: 9,
    gmpPercent: 95.0,
    gmpPrice: 1428,
    retailSubscription: 1.99,
    hniSubscription: 4.56,
    qibSubscription: 61.43,
    totalSubscription: 59.64,
    status: 'LISTED',
    industry: 'Solar Panel',
    advisorVerdict: 'APPLY',
    advisorScore: 9.0,
  },
  {
    companyName: 'NTPC Green Energy',
    issueSizeCr: 10000,
    priceBandLow: 102,
    priceBandHigh: 108,
    openDate: new Date('2024-11-19'),
    closeDate: new Date('2024-11-22'),
    listingDate: new Date('2024-11-27'),
    lotSize: 138,
    gmpPercent: 4.2,
    gmpPrice: 4.5,
    retailSubscription: 2.56,
    hniSubscription: 3.23,
    qibSubscription: 4.90,
    totalSubscription: 3.40,
    status: 'LISTED',
    industry: 'Renewable Energy',
    advisorVerdict: 'APPLY',
    advisorScore: 7.5,
  },
  {
    companyName: 'Bajaj Housing Finance',
    issueSizeCr: 6560,
    priceBandLow: 66,
    priceBandHigh: 70,
    openDate: new Date('2024-09-09'),
    closeDate: new Date('2024-09-11'),
    listingDate: new Date('2024-09-16'),
    lotSize: 214,
    gmpPercent: 18.5,
    gmpPrice: 13,
    retailSubscription: 14.23,
    hniSubscription: 8.45,
    qibSubscription: 195.42,
    totalSubscription: 63.61,
    status: 'LISTED',
    industry: 'Housing Finance',
    advisorVerdict: 'APPLY',
    advisorScore: 8.5,
  },
  {
    companyName: 'Premier Energies',
    issueSizeCr: 2830,
    priceBandLow: 427,
    priceBandHigh: 450,
    openDate: new Date('2024-08-27'),
    closeDate: new Date('2024-08-29'),
    listingDate: new Date('2024-09-03'),
    lotSize: 33,
    gmpPercent: 52.0,
    gmpPrice: 234,
    retailSubscription: 3.45,
    hniSubscription: 12.67,
    qibSubscription: 68.90,
    totalSubscription: 72.19,
    status: 'LISTED',
    industry: 'Solar Cells',
    advisorVerdict: 'APPLY',
    advisorScore: 8.8,
  },
];

async function main() {
  console.log('🌱 Seeding REAL IPO data...');
  
  // Clear old data
  await prisma.iPO.deleteMany();
  console.log('🗑️  Cleared old IPOs');

  // Insert real data
  await prisma.iPO.createMany({
    data: REAL_IPOS,
    skipDuplicates: true,
  });

  console.log(`✅ Added ${REAL_IPOS.length} real IPOs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());