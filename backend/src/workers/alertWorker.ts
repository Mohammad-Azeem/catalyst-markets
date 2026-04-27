import Bull from 'bull';
import prisma from '../db/prisma';
// import redis from '../db/redis';  // ❌ DON'T import redis client
import { emailService } from '../services/email';
import { clerkClient } from '@clerk/clerk-sdk-node';
import logger from '../utils/logger';
import cron from 'node-cron';


//const cron = require('node-cron');

// ✅ USE CONNECTION STRING, not the redis client object
export const alertQueue = new Bull('price-alerts', 
  process.env.REDIS_URL || 'redis://127.0.0.1:6379'
);

// ✅ SIMPLIFIED: Just use cron, no Bull repeat
export function scheduleAlertChecks() {
  
  
  cron.schedule('*/5 * * * *', async () => {  // Every 5 minutes (not every minute)
    logger.info('⏰ Checking price alerts...');
    
    try {
      await alertQueue.add({});  // Add job to queue
    } catch (error) {
      logger.error('Failed to add alert job:', error);
    }
  });
  
  logger.info('📅 Alert checks scheduled (every 5 minutes)');
}

// Process alerts (same as before)
alertQueue.process(async (job) => {
  logger.info('Processing price alerts...');

  try {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        isActive: true,
        notificationSent: false,
      },
      include: { stock: true },
    });

    logger.info(`Found ${alerts.length} active alerts`);

    for (const alert of alerts) {
      const currentPrice = Number(alert.stock.currentPrice);
      const targetPrice = Number(alert.targetPrice);

      let triggered = false;

      if (alert.condition === 'ABOVE' && currentPrice >= targetPrice) {
        triggered = true;
      } else if (alert.condition === 'BELOW' && currentPrice <= targetPrice) {
        triggered = true;
      }

      if (triggered) {
        logger.info(`🔔 Alert triggered: ${alert.stock.symbol}`);

        try {
          const user = await clerkClient.users.getUser(alert.userId );
          const email = user.emailAddresses[0]?.emailAddress;

          if (email) {
            await emailService.sendPriceAlert(email, {
              symbol: alert.stock.symbol,
              targetPrice,
              currentPrice,
              condition: alert.condition,
            });

            await prisma.priceAlert.update({
              where: { id: alert.id },
              data: {
                notificationSent: true,
                triggeredAt: new Date(),
              },
            });

            logger.info(`✅ Email sent to ${email}`);
          }
        } catch (error) {
          logger.error(`Failed to notify user ${alert.userId}:`, error);
        }
      }
    }

    return { processed: alerts.length };
  } catch (error) {
    logger.error('Alert processing error:', error);
    throw error;
  }
});

alertQueue.on('completed', (job, result) => {
  logger.info('Alert check completed:', result);
});

alertQueue.on('failed', (job, err) => {
  logger.error('Alert check failed:', err);
});



/*
import Bull from 'bull';
import prisma from '../db/prisma';
//import redis from '../db/redis';
import { emailService } from '../services/email';
import { clerkClient } from '@clerk/clerk-sdk-node';
import logger from '../utils/logger';
import cron from 'node-cron';


// Create queue

//  USE CONNECTION STRING, not the redis client object
export const alertQueue = new Bull('price-alerts', 
  process.env.REDIS_URL || 'redis://127.0.0.1:6379'
);


//export const alertQueue = new Bull('price-alerts', {
//  redis: {
//    host: process.env.REDIS_HOST || 'localhost',
//    port: parseInt(process.env.REDIS_PORT || '6379'),
//  },
//});


// Process alerts
alertQueue.process(async (job) => {
  logger.info('Processing price alerts...');

  try {
    // Get all active alerts
    const alerts = await prisma.priceAlert.findMany({
      where: {
        isActive: true,
        notificationSent: false,
      },
      include: {
        stock: true,
      },
    });

    logger.info(`Found ${alerts.length} active alerts to check`);

    for (const alert of alerts) {
      const currentPrice = Number(alert.stock.currentPrice);
      const targetPrice = Number(alert.targetPrice);

      let triggered = false;

      if (alert.condition === 'ABOVE' && currentPrice >= targetPrice) {
        triggered = true;
      } else if (alert.condition === 'BELOW' && currentPrice <= targetPrice) {
        triggered = true;
      }

      if (triggered) {
        logger.info(`Alert triggered for ${alert.stock.symbol}`);

        // Get user email from Clerk
        try {
          const user = await clerkClient.users.getUser(alert.userId as unknown as string);
          const email = user.emailAddresses[0]?.emailAddress;

          if (email) {
            // Send email
            await emailService.sendPriceAlert(email, {
              symbol: alert.stock.symbol,
              targetPrice,
              currentPrice,
              condition: alert.condition,
            });

            // Mark as notified
            await prisma.priceAlert.update({
              where: { id: alert.id },
              data: {
                notificationSent: true,
                triggeredAt: new Date(),
              },
            });

            logger.info(`Alert email sent to ${email}`);
          }
        } catch (error) {
          logger.error(`Failed to send alert for user ${alert.userId}:`, error);
        }
      }
    }

    return { processed: alerts.length };
  } catch (error) {
    logger.error('Alert worker error:', error);
    throw error;
  }
});

// Schedule job every minute


export const scheduleAlertChecks = () => {
  alertQueue.add(
    {},
    {
      repeat: {
        every: 60000, // Every minute
      },
    }
  );
  logger.info('📅 Alert checks scheduled (every minute)');
};


alertQueue.on('completed', (job, result) => {
  logger.info('Alert check completed:', result);
});

alertQueue.on('failed', (job, err) => {
  logger.error('Alert check failed:', err);
});

*/