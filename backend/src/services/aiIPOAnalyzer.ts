import OpenAI from 'openai';
import prisma from '../db/prisma';
import logger from '../utils/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

interface AIInsight {
  verdict: 'APPLY' | 'AVOID' | 'NEUTRAL';
  score: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedReturn: string;
}

export class AIIPOAnalyzer {
  /**
   * Generate AI insights for IPO
   */
  async analyzeIPO(ipoId: number): Promise<AIInsight | null> {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI key missing, using rule-based analysis');
      return this.ruleBasedAnalysis(ipoId);
    }

    try {
      const ipo = await prisma.iPO.findUnique({ where: { id: ipoId } });
      if (!ipo) return null;

      const prompt = `Analyze this Indian IPO and provide verdict:

Company: ${ipo.companyName}
Type: ${ipo.type}
Price Band: ₹${ipo.priceBandLow}-${ipo.priceBandHigh}
Issue Size: ₹${ipo.issueSizeCr} Cr
GMP: ${ipo.gmpPercent}% (₹${ipo.gmpPrice})
Subscription: QIB ${ipo.qibTimes}x, HNI ${ipo.niiTimes}x, Retail ${ipo.retailTimes}x

Financials:
- Revenue: ₹${ipo.revenue || 'N/A'} Cr
- Profit: ₹${ipo.profit || 'N/A'} Cr
- P/E: ${ipo.peRatio || 'N/A'}
- ROE: ${ipo.roe || 'N/A'}%
- Promoter: ${ipo.promoterHolding || 'N/A'}%

Respond ONLY with valid JSON:
{
  "verdict": "APPLY" or "AVOID" or "NEUTRAL",
  "score": 0-10,
  "reasoning": "2-3 sentences",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weak1", "weak2"],
  "riskLevel": "LOW" or "MEDIUM" or "HIGH",
  "expectedReturn": "Flat" or "Gain 5-10%" or "Premium 15%+"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an IPO analyst. Respond only with JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const text = response.choices[0].message.content?.trim() || '{}';
      const insight: AIInsight = JSON.parse(text);

      // Update IPO with AI verdict
      await prisma.iPO.update({
        where: { id: ipoId },
        data: {
          advisorVerdict: insight.verdict,
          advisorScore: insight.score,
          advisorReasoning: insight.reasoning,
          expectedListing: insight.expectedReturn,
        },
      });

      logger.info(`AI analyzed ${ipo.companyName}: ${insight.verdict} (${insight.score}/10)`);
      return insight;
    } catch (error: any) {
      logger.error('AI analysis error:', error.message);
      return this.ruleBasedAnalysis(ipoId);
    }
  }

  /**
   * Rule-based analysis (fallback when AI unavailable)
   */
  private async ruleBasedAnalysis(ipoId: number): Promise<AIInsight | null> {
    const ipo = await prisma.iPO.findUnique({ where: { id: ipoId } });
    if (!ipo) return null;

    let score = 5;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // GMP analysis
    const gmp = Number(ipo.gmpPercent) || 0;
    if (gmp > 20) {
      score += 2;
      strengths.push(`Strong GMP of ${gmp}%`);
    } else if (gmp < 0) {
      score -= 2;
      weaknesses.push(`Negative GMP of ${gmp}%`);
    }

    // Subscription analysis
    const retail = Number(ipo.retailTimes) || 0;
    if (retail > 3) {
      score += 1;
      strengths.push(`Strong retail demand (${retail}x)`);
    } else if (retail < 1) {
      score -= 1;
      weaknesses.push(`Weak retail subscription (${retail}x)`);
    }

    // Type analysis
    if (ipo.type === 'SME') {
      strengths.push('SME IPOs historically give higher returns');
      weaknesses.push('Higher risk and lower liquidity');
    }

    // Financials
    if (ipo.profit && Number(ipo.profit) > 0) {
      score += 1;
      strengths.push('Profitable company');
    } else if (ipo.profit && Number(ipo.profit) < 0) {
      score -= 1;
      weaknesses.push('Loss-making company');
    }

    score = Math.max(0, Math.min(10, score));

    let verdict: 'APPLY' | 'AVOID' | 'NEUTRAL' = 'NEUTRAL';
    if (score >= 7) verdict = 'APPLY';
    else if (score <= 4) verdict = 'AVOID';

    const riskLevel = ipo.type === 'SME' ? 'HIGH' : score >= 7 ? 'LOW' : 'MEDIUM';
    const expectedReturn = gmp > 20 ? 'Premium 20%+' : gmp > 10 ? 'Gain 10-15%' : 'Flat to 5%';

    return {
      verdict,
      score,
      reasoning: `${verdict} based on GMP ${gmp}%, subscription ${retail}x retail, and fundamentals.`,
      strengths,
      weaknesses,
      riskLevel,
      expectedReturn,
    };
  }

  /**
   * Batch analyze all IPOs without AI verdict
   */
  async analyzeAll(): Promise<number> {
    const ipos = await prisma.iPO.findMany({
      where: {
        OR: [
          { advisorVerdict: null },
          { advisorScore: null },
        ],
      },
    });

    let analyzed = 0;
    for (const ipo of ipos) {
      const insight = await this.analyzeIPO(ipo.id);
      if (insight) analyzed++;
      await new Promise(r => setTimeout(r, 500)); // Rate limit
    }

    logger.info(`✅ Analyzed ${analyzed}/${ipos.length} IPOs`);
    return analyzed;
  }
}

export const aiIPOAnalyzer = new AIIPOAnalyzer();