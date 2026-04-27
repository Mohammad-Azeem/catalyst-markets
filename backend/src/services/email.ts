import { Resend } from 'resend';
import logger from '../utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  async sendPriceAlert(
    to: string,
    alert: {
      symbol: string;
      targetPrice: number;
      currentPrice: number;
      condition: string;
    }
  ): Promise<boolean> {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Catalyst Markets <alerts@catalystmarkets.com>',
        to: [to],
        subject: `🔔 Price Alert: ${alert.symbol} ${alert.condition} ₹${alert.targetPrice}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #14d2b4;">Price Alert Triggered!</h2>
            <p><strong>${alert.symbol}</strong> has crossed your target price.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Target Price:</strong> ₹${alert.targetPrice}</p>
              <p style="margin: 10px 0 0 0;"><strong>Current Price:</strong> ₹${alert.currentPrice}</p>
              <p style="margin: 10px 0 0 0;"><strong>Condition:</strong> ${alert.condition}</p>
            </div>
            <p>
              <a href="https://catalystmarkets.com/stocks/${alert.symbol}" 
                 style="background: #14d2b4; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                View Stock Details
              </a>
            </p>
          </div>
        `,
      });

      if (error) {
        logger.error('Email send error:', error);
        return false;
      }

      logger.info(`Alert email sent to ${to} for ${alert.symbol}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();