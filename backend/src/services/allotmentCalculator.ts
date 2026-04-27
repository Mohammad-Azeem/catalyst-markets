export class AllotmentCalculator {
  /**
   * Calculate allotment probability based on subscription
   * Formula: (Available shares / Total applications) * 100
   */
  calculateProbability(subscriptionTimes: number, category: string): number {
    if (!subscriptionTimes || subscriptionTimes <= 0) return 100;
    
    // QIB: Proportional allotment always
    if (category === 'QIB') {
      return subscriptionTimes >= 1 ? 100 : Math.round(subscriptionTimes * 100);
    }
    
    // HNI (NII): Proportional if oversubscribed
    if (category === 'NII' || category === 'BHNI' || category === 'SHNI') {
      if (subscriptionTimes < 1) return 100;
      if (subscriptionTimes < 2) return Math.round((1 / subscriptionTimes) * 100);
      if (subscriptionTimes < 5) return Math.round((1 / subscriptionTimes) * 80);
      if (subscriptionTimes < 10) return Math.round((1 / subscriptionTimes) * 70);
      return Math.max(5, Math.round((1 / subscriptionTimes) * 60));
    }
    
    // Retail: Lottery system if oversubscribed
    if (category === 'RETAIL') {
      if (subscriptionTimes < 1) return 100;
      if (subscriptionTimes < 1.5) return 85;
      if (subscriptionTimes < 2) return 65;
      if (subscriptionTimes < 3) return 45;
      if (subscriptionTimes < 5) return 28;
      if (subscriptionTimes < 10) return 15;
      if (subscriptionTimes < 20) return 8;
      return Math.max(3, Math.round((1 / subscriptionTimes) * 100));
    }
    
    return 50; // Default
  }
  
  /**
   * Update all IPO probabilities
   */
  async updateAllProbabilities() {
    const prisma = require('../db/prisma').default;
    const ipos = await prisma.iPO.findMany({
      where: { status: { in: ['OPEN', 'CLOSED'] } },
    });
    
    for (const ipo of ipos) {
      await prisma.iPO.update({
        where: { id: ipo.id },
        data: {
          qibProbability: this.calculateProbability(Number(ipo.qibTimes), 'QIB'),
          niiProbability: this.calculateProbability(Number(ipo.niiTimes), 'NII'),
          retailProbability: this.calculateProbability(Number(ipo.retailTimes), 'RETAIL'),
        },
      });
    }
  }
}

export const allotmentCalculator = new AllotmentCalculator();