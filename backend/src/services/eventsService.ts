import prisma from '../db/prisma';

interface Event {
  id: number;
  type: 'EARNINGS' | 'DIVIDEND' | 'IPO' | 'RESULT';
  symbol: string;
  companyName: string;
  date: Date;
  details: string;
}

export class EventsService {
  async getUpcomingEvents(days = 30): Promise<Event[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    // Get IPO events
    const ipos = await prisma.iPO.findMany({
      where: {
        closeDate: { gte: today, lte: futureDate },
      },
      select: { id: true, companyName: true, closeDate: true, listingDate: true },
    });

    const events: Event[] = ipos.flatMap(ipo => [
      {
        id: ipo.id,
        type: 'IPO' as const,
        symbol: ipo.companyName.split(' ')[0].toUpperCase(),
        companyName: ipo.companyName,
        date: ipo.closeDate,
        details: 'IPO closes',
      },
      ...(ipo.listingDate ? [{
        id: ipo.id + 10000,
        type: 'IPO' as const,
        symbol: ipo.companyName.split(' ')[0].toUpperCase(),
        companyName: ipo.companyName,
        date: ipo.listingDate,
        details: 'Listing date',
      }] : []),
    ]);

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

export const eventsService = new EventsService();