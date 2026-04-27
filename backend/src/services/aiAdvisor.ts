import OpenAI from 'openai';
import prisma from '../db/prisma';
import logger from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'org_3AEykopCWu4MvDopF3B14Q3VWL7',
});

interface StockAnalysis {
  verdict: 'BUY' | 'HOLD' | 'SELL';
  score: number; // 0-10
  reasoning: string;
  risks: string[];
  opportunities: string[];
}

interface IPOAnalysis {
  verdict: 'APPLY' | 'AVOID' | 'NEUTRAL';
  score: number; // 0-10
  reasoning: string;
  keyPoints: string[];
}

export class AIAdvisorService {
  /**
   * Analyze a stock using AI
   */
  async analyzeStock(symbol: string): Promise<StockAnalysis | null> {
    try {
      const stock = await prisma.stock.findFirst({
        where: { symbol: symbol.toUpperCase() },
      });

      if (!stock) {
        throw new Error('Stock not found');
      }

      // Build context for AI
      const context = `
Stock: ${stock.name} (${stock.symbol})
Sector: ${stock.sector}
Exchange: ${stock.exchange}

Current Price: ₹${stock.currentPrice}
Day Change: ${stock.dayChangePercent}%
Market Cap: ₹${stock.marketCap ? Number(stock.marketCap).toFixed(0) : 'N/A'} Cr

Valuation Metrics:
- P/E Ratio: ${stock.peRatio || 'N/A'}
- P/B Ratio: ${stock.pbRatio || 'N/A'}
- PEG Ratio: ${stock.pegRatio || 'N/A'}
- ROE: ${stock.roe || 'N/A'}%
- ROCE: ${stock.roce || 'N/A'}%
- Debt/Equity: ${stock.debtToEquity || 'N/A'}
- Dividend Yield: ${stock.dividendYield || 'N/A'}%

Fundamentals:
- Revenue: ₹${stock.revenue ? Number(stock.revenue).toFixed(0) : 'N/A'} Cr
- Profit: ₹${stock.profit ? Number(stock.profit).toFixed(0) : 'N/A'} Cr
- EPS: ₹${stock.eps || 'N/A'}

Quality Score: ${stock.qualityScore || 'N/A'}/10
Moat Rating: ${stock.moatRating || 'N/A'}
Fair Value: ₹${stock.fairValue || 'N/A'}
Valuation Gap: ${stock.valuationGap || 'N/A'}%
`;

      const prompt = `You are a professional Indian stock market analyst. Analyze this stock and provide:

${context}

Provide analysis in this exact JSON format (no markdown, just JSON):
{
  "verdict": "BUY" or "HOLD" or "SELL",
  "score": number from 0-10,
  "reasoning": "2-3 sentence summary of your recommendation",
  "risks": ["risk1", "risk2", "risk3"],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3"]
}

Consider: valuation, quality metrics, sector trends, and Indian market conditions.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Indian stock market analyst. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0].message.content?.trim() || '';
      
      // Parse JSON response
      const analysis: StockAnalysis = JSON.parse(responseText);

      logger.info(`AI analysis: ${stock.symbol} - ${analysis.verdict} (${analysis.score}/10)`);

      return analysis;
    } catch (error: any) {
      if (error.code === 'insufficient_quota') {
        logger.error('OpenAI API quota exceeded');
      } else {
        logger.error('AI stock analysis error:', error.message);
      }
      return null;
    }
  }

  /**
   * Analyze an IPO using AI
   */
  async analyzeIPO(ipoId: number): Promise<IPOAnalysis | null> {
    try {
      const ipo = await prisma.iPO.findUnique({
        where: { id: ipoId },
      });

      if (!ipo) {
        throw new Error('IPO not found');
      }

      const context = `
IPO: ${ipo.companyName}
Industry: ${ipo.industry || 'N/A'}

Issue Details:
- Issue Size: ₹${ipo.issueSizeCr} Cr
- Price Band: ₹${ipo.priceBandLow} - ₹${ipo.priceBandHigh}
- Lot Size: ${ipo.lotSize} shares
- Min Investment: ₹${ipo.minInvestment || 'N/A'}

Grey Market Premium:
- GMP: ${ipo.gmpPercent}%
- Absolute GMP: ₹${ipo.gmpPrice || 'N/A'}

Subscription:
- Retail: ${ipo.retailSubscription || 'N/A'}x
- HNI: ${ipo.hniSubscription || 'N/A'}x
- QIB: ${ipo.qibSubscription || 'N/A'}x
- Overall: ${ipo.totalSubscription || 'N/A'}x

Financials:
- Revenue: ₹${ipo.revenue ? Number(ipo.revenue).toFixed(0) : 'N/A'} Cr
- Profit: ₹${ipo.profit ? Number(ipo.profit).toFixed(0) : 'N/A'} Cr
- P/E Ratio: ${ipo.peRatio || 'N/A'}
- ROE: ${ipo.roe || 'N/A'}%
- Debt/Equity: ${ipo.debtToEquity || 'N/A'}
- Promoter Holding: ${ipo.promoterHolding || 'N/A'}%

Status: ${ipo.status}
`;

      const prompt = `You are a professional IPO analyst in India. Analyze this IPO and provide:

${context}

Provide analysis in this exact JSON format (no markdown, just JSON):
{
  "verdict": "APPLY" or "AVOID" or "NEUTRAL",
  "score": number from 0-10,
  "reasoning": "2-3 sentence summary",
  "keyPoints": ["point1", "point2", "point3", "point4"]
}

Consider: valuation, business fundamentals, GMP, subscription demand, and listing expectations.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert IPO analyst. Always respond in valid JSON format.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const responseText = completion.choices[0].message.content?.trim() || '';
      const analysis: IPOAnalysis = JSON.parse(responseText);

      // Update IPO with AI verdict
      await prisma.iPO.update({
        where: { id: ipoId },
        data: {
          advisorVerdict: analysis.verdict,
          advisorScore: analysis.score,
          advisorReasoning: analysis.reasoning,
        },
      });

      logger.info(`AI IPO analysis: ${ipo.companyName} - ${analysis.verdict} (${analysis.score}/10)`);

      return analysis;
    } catch (error: any) {
      logger.error('AI IPO analysis error:', error.message);
      return null;
    }
  }

  /**
   * Chat assistant - general investment queries
   */
  async chatAssistant(userMessage: string, conversationHistory: any[] = []): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        //logger.warn('OpenAI API key not configured');
        return 'OpenAI API key not configured. Add OPENAI_API_KEY to .env'; 
      }
      const messages = [
        {
          role: 'system' as const,
          content: `You are a helpful Indian stock market assistant. Help users with:
- Stock recommendations and analysis
- IPO guidance
- Investment concepts (P/E, ROE, etc.)
- Portfolio advice
- Market trends

Be concise, practical, and India-focused. Use ₹ for prices.`,
        },
        ...conversationHistory,
        { role: 'user' as const, content: userMessage },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.8,
        max_tokens: 300,
      });

      const response = completion.choices[0].message.content || 'Sorry, I could not generate a response.';
      
      logger.info('Chat assistant response generated');
      return response;
    } catch (error: any) {
      logger.error('Chat assistant error:', error.message);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }
}

export const aiAdvisorService = new AIAdvisorService();