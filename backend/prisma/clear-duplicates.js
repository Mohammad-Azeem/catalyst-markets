import { PrismaClient } from '@prisma/client';

//const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();



async function clearDuplicates() {
  console.log('🗑️  Clearing all IPOs...');
  
  const deleted = await prisma.iPO.deleteMany({});
  console.log(`✅ Deleted ${deleted.count} IPO records`);
  
  console.log('✨ Database is clean and ready for real data');
}

clearDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());