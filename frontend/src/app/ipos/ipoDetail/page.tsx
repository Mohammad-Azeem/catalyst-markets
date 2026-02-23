'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertCircle,
} from 'lucide-react';
import { iposAPI } from '@/lib/api';

interface IPODetail {
  id: number;
  companyName: string;
  issueSizeCr: number;
  priceBandLow: number;
  priceBandHigh: number;
  openDate: string;
  closeDate: string;
  listingDate: string | null;
  lotSize: number;
  gmpPercent: number | null;
  retailSubscription: number | null;
  hniSubscription: number | null;
  qibSubscription: number | null;
  totalSubscription: number | null;
  advisorVerdict: string | null;
  advisorScore: number | null;
  status: string;
  industry: string | null;
  revenue3yrCagr: number | null;
  profitMarginAvg: number | null;
  debtToEquity: number | null;
  promoterHoldingPercent: number | null;
}

interface AdvisorResult {
  verdict: string;
  score: number;
  reasons: string[];
  risks: string[];
}

export default function IPODetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [ipo, setIpo] = useState<IPODetail | null>(null);
  const [advisor, setAdvisor] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  useEffect(() => {
    if (id) fetchIPO();
  }, [id]);

  const fetchIPO = async () => {
    try {
      const res: any = await iposAPI.getById(Number(id));
      setIpo(res.data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const fetchAdvisor = async () => {
    setAdvisorLoading(true);
    try {
      const res: any = await iposAPI.getAdvisor(Number(id));
      setAdvisor(res.data);
    } catch {
      alert('Failed to get advisor verdict');
    }
    setAdvisorLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!ipo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">IPO not found</p>
      </div>
    );
  }

  const verdictConfig = {
    APPLY: {
      icon: CheckCircle,
      color: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Apply',
    },
    NEUTRAL: {
      icon: MinusCircle,
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Neutral',
    },
    AVOID: {
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Avoid',
    },
  };

  const v = (advisor?.verdict || ipo.advisorVerdict) as keyof typeof verdictConfig;
  const verdict = v ? verdictConfig[v] : null;

  const daysLeft = Math.ceil(
    (new Date(ipo.closeDate).getTime() - Date.now()) / 86400000
  );

  const subscriptionBars = [
    { label: 'Retail', value: ipo.retailSubscription },
    { label: 'HNI',    value: ipo.hniSubscription    },
    { label: 'QIB',    value: ipo.qibSubscription     },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-black mb-1">{ipo.companyName}</h1>
              {ipo.industry && (
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                  {ipo.industry}
                </span>
              )}
            </div>

            {/* Status / GMP */}
            <div className="text-right">
              <div className="text-sm opacity-80 mb-1">Grey Market Premium</div>
              {ipo.gmpPercent !== null ? (
                <div
                  className={`flex items-center justify-end space-x-1 text-2xl font-black ${
                    ipo.gmpPercent >= 0 ? 'text-green-300' : 'text-red-300'
                  }`}
                >
                  {ipo.gmpPercent >= 0 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                  <span>
                    {ipo.gmpPercent >= 0 ? '+' : ''}
                    {ipo.gmpPercent.toFixed(1)}%
                  </span>
                </div>
              ) : (
                <span className="text-white opacity-60">No GMP data</span>
              )}
            </div>
          </div>

          {/* Key Numbers */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
              <p className="text-xs opacity-70 mb-1">Price Band</p>
              <p className="font-bold">
                ₹{ipo.priceBandLow}–{ipo.priceBandHigh}
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
              <p className="text-xs opacity-70 mb-1">Issue Size</p>
              <p className="font-bold">₹{ipo.issueSizeCr} Cr</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
              <p className="text-xs opacity-70 mb-1">Lot Size</p>
              <p className="font-bold">{ipo.lotSize} shares</p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="px-6 py-4 flex flex-wrap gap-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-gray-500">Opens:</span>
            <span className="font-semibold text-gray-900">
              {new Date(ipo.openDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-red-500" />
            <span className="text-gray-500">Closes:</span>
            <span className="font-semibold text-gray-900">
              {new Date(ipo.closeDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
          {daysLeft > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-orange-600">
                {daysLeft === 1 ? 'Last day!' : `${daysLeft} days left`}
              </span>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Subscription</span>
            {ipo.totalSubscription !== null && (
              <span className="ml-auto text-blue-700 font-bold text-base">
                {ipo.totalSubscription.toFixed(2)}x overall
              </span>
            )}
          </h3>

          {subscriptionBars.map(({ label, value }) => (
            <div key={label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">
                  {value !== null ? `${value.toFixed(2)}x` : '—'}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                  style={{ width: `${Math.min((value ?? 0) * 10, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Advisor Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span>AI Investment Advisor</span>
          </h2>

          <button
            onClick={fetchAdvisor}
            disabled={advisorLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {advisorLoading ? 'Analysing...' : 'Get Verdict'}
          </button>
        </div>

        {verdict ? (
          <div
            className={`rounded-xl border p-5 ${verdict.bg} ${verdict.border}`}
          >
            <div className={`flex items-center space-x-3 mb-4 ${verdict.color}`}>
              <verdict.icon className="w-8 h-8" />
              <span className="text-2xl font-black">{verdict.label}</span>
              {(advisor?.score ?? ipo.advisorScore) !== null && (
                <span className="ml-auto text-sm font-medium opacity-70">
                  Score: {advisor?.score ?? ipo.advisorScore}/10
                </span>
              )}
            </div>

            {advisor && (
              <div className="grid sm:grid-cols-2 gap-4">
                {advisor.reasons.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-green-800 mb-2">
                      ✅ Positive Signals
                    </p>
                    <ul className="space-y-1">
                      {advisor.reasons.map((r, i) => (
                        <li key={i} className="text-sm text-green-700">
                          • {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {advisor.risks.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      ⚠️ Risk Factors
                    </p>
                    <ul className="space-y-1">
                      {advisor.risks.map((r, i) => (
                        <li key={i} className="text-sm text-red-700">
                          • {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Click "Get Verdict" to get an AI-powered analysis</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          ⚠️ AI analysis is for educational purposes only. Not SEBI-registered advice.
        </p>
      </div>
    </div>
  );
}
