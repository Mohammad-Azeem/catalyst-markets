//codex

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bot,
  CircleDashed,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { iposAPI } from '@/lib/api';
import styles from './ipos-board.module.css';

type FilterType = 'ALL' | 'OPEN' | 'UPCOMING' | 'CLOSED' | 'LISTED';
type SortType = 'close' | 'gmp' | 'subscription' | 'ai';
type InsightVerdict = 'APPLY' | 'AVOID' | 'WATCH';

interface RawIPO {
  id: number;
  companyName: string;
  type?: string | null;
  status?: string | null;
  industry?: string | null;
  issueSizeCr?: number | string | null;
  priceBandLow?: number | string | null;
  priceBandHigh?: number | string | null;
  lotSize?: number | string | null;
  openDate?: string | null;
  closeDate?: string | null;
  listingDate?: string | null;
  gmpPercent?: number | string | null;
  gmpPrice?: number | string | null;
  qibTimes?: number | string | null;
  niiTimes?: number | string | null;
  retailTimes?: number | string | null;
  totalTimes?: number | string | null;
  qibSubscription?: number | string | null;
  hniSubscription?: number | string | null;
  retailSubscription?: number | string | null;
  totalSubscription?: number | string | null;
  advisorVerdict?: string | null;
  advisorScore?: number | string | null;
  advisorReasoning?: string | null;
}

interface IPOView {
  id: number;
  companyName: string;
  type: string;
  status: string;
  industry: string | null;
  issueSizeCr: number | null;
  priceBandLow: number | null;
  priceBandHigh: number | null;
  lotSize: number | null;
  openDate: string;
  closeDate: string;
  listingDate: string | null;
  gmpPercent: number | null;
  gmpPrice: number | null;
  qib: number | null;
  hni: number | null;
  retail: number | null;
  total: number | null;
  advisorVerdict: string | null;
  advisorScore: number | null;
  advisorReasoning: string | null;
}

interface AdvisorApiResult {
  verdict: 'APPLY' | 'NEUTRAL' | 'AVOID';
  score: number;
  reasons: string[];
  risks: string[];
}

interface InsightView {
  verdict: InsightVerdict;
  score: number;
  brief: string;
  confidence: 'High' | 'Medium' | 'Low';
}

const FILTERS: FilterType[] = ['ALL', 'OPEN', 'UPCOMING', 'CLOSED', 'LISTED'];

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return '--';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCrores = (value: number | null) => {
  if (value === null) return '--';
  return `Rs ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
};

const formatPriceBand = (low: number | null, high: number | null) => {
  if (low === null || high === null) return '--';
  return `Rs ${low.toFixed(0)} - ${high.toFixed(0)}`;
};

const formatX = (value: number | null) => {
  if (value === null) return '--';
  return `${value.toFixed(2)}x`;
};

const formatGmp = (value: number | null) => {
  if (value === null) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

const deriveStatus = (rawStatus: string | null | undefined, openDate: string, closeDate: string) => {
  if (rawStatus) return rawStatus.toUpperCase();

  const now = new Date();
  const open = toDate(openDate);
  const close = toDate(closeDate);

  if (!open || !close) return 'UPCOMING';
  if (now < open) return 'UPCOMING';
  if (now >= open && now <= close) return 'OPEN';
  return 'CLOSED';
};

const buildFallbackInsight = (ipo: IPOView): InsightView => {
  let score = 5;
  let signalCount = 0;
  const positives: string[] = [];
  const risks: string[] = [];

  if (ipo.gmpPercent !== null) {
    signalCount += 1;
    if (ipo.gmpPercent >= 25) {
      score += 2;
      positives.push(`strong GMP at ${ipo.gmpPercent.toFixed(1)}%`);
    } else if (ipo.gmpPercent >= 10) {
      score += 1;
      positives.push(`healthy GMP at ${ipo.gmpPercent.toFixed(1)}%`);
    } else if (ipo.gmpPercent < 0) {
      score -= 2;
      risks.push(`negative GMP at ${ipo.gmpPercent.toFixed(1)}%`);
    }
  }

  if (ipo.total !== null) {
    signalCount += 1;
    if (ipo.total >= 20) {
      score += 2;
      positives.push(`very high total subscription at ${ipo.total.toFixed(2)}x`);
    } else if (ipo.total >= 5) {
      score += 1;
      positives.push(`decent total subscription at ${ipo.total.toFixed(2)}x`);
    } else if (ipo.total < 1) {
      score -= 1.5;
      risks.push(`low overall subscription at ${ipo.total.toFixed(2)}x`);
    }
  }

  if (ipo.qib !== null) {
    signalCount += 1;
    if (ipo.qib >= 10) {
      score += 1.5;
      positives.push(`strong institutional demand (${ipo.qib.toFixed(2)}x QIB)`);
    } else if (ipo.qib < 1) {
      score -= 1;
      risks.push(`weak QIB demand (${ipo.qib.toFixed(2)}x)`);
    }
  }

  if (ipo.retail !== null) {
    signalCount += 1;
    if (ipo.retail >= 2) {
      score += 0.8;
      positives.push(`retail participation is healthy (${ipo.retail.toFixed(2)}x)`);
    } else if (ipo.retail < 0.7) {
      score -= 0.8;
      risks.push(`retail demand is soft (${ipo.retail.toFixed(2)}x)`);
    }
  }

  if (ipo.type.toUpperCase() === 'SME') {
    signalCount += 1;
    score -= 0.5;
    risks.push('SME listing can be more volatile and less liquid');
  }

  score = Math.min(10, Math.max(0, score));

  let verdict: InsightVerdict = 'WATCH';
  if (score >= 7) verdict = 'APPLY';
  if (score <= 4) verdict = 'AVOID';

  let brief = 'Limited conviction. Track next subscription update before applying.';

  if (verdict === 'APPLY') {
    const snippets = positives.slice(0, 2);
    brief = snippets.length
      ? `Apply bias: ${snippets.join(', ')}.`
      : 'Apply bias due to improving demand and GMP momentum.';
  }

  if (verdict === 'AVOID') {
    const snippets = risks.slice(0, 2);
    brief = snippets.length
      ? `Avoid bias: ${snippets.join(', ')}.`
      : 'Avoid bias due to weak demand and limited listing upside.';
  }

  const confidence: InsightView['confidence'] =
    signalCount >= 4 ? 'High' : signalCount >= 2 ? 'Medium' : 'Low';

  return {
    verdict,
    score,
    brief,
    confidence,
  };
};

const normalizeIPO = (ipo: RawIPO): IPOView => {
  const qib = toNumber(ipo.qibTimes ?? ipo.qibSubscription);
  const hni = toNumber(ipo.niiTimes ?? ipo.hniSubscription);
  const retail = toNumber(ipo.retailTimes ?? ipo.retailSubscription);

  const weightedTotal =
    qib !== null || hni !== null || retail !== null
      ? (qib ?? 0) * 0.5 + (hni ?? 0) * 0.15 + (retail ?? 0) * 0.35
      : null;

  return {
    id: ipo.id,
    companyName: ipo.companyName,
    type: (ipo.type || 'MAINBOARD').toUpperCase(),
    status: deriveStatus(ipo.status, ipo.openDate || '', ipo.closeDate || ''),
    industry: ipo.industry || null,
    issueSizeCr: toNumber(ipo.issueSizeCr),
    priceBandLow: toNumber(ipo.priceBandLow),
    priceBandHigh: toNumber(ipo.priceBandHigh),
    lotSize: toNumber(ipo.lotSize),
    openDate: ipo.openDate || '',
    closeDate: ipo.closeDate || '',
    listingDate: ipo.listingDate || null,
    gmpPercent: toNumber(ipo.gmpPercent),
    gmpPrice: toNumber(ipo.gmpPrice),
    qib,
    hni,
    retail,
    total: toNumber(ipo.totalTimes ?? ipo.totalSubscription) ?? weightedTotal,
    advisorVerdict: ipo.advisorVerdict || null,
    advisorScore: toNumber(ipo.advisorScore),
    advisorReasoning: ipo.advisorReasoning || null,
  };
};

const verdictClassName = (verdict: InsightVerdict) => {
  if (verdict === 'APPLY') return styles.verdictApply;
  if (verdict === 'AVOID') return styles.verdictAvoid;
  return styles.verdictWatch;
};

const statusClassName = (status: string) => {
  if (status === 'OPEN') return styles.statusOpen;
  if (status === 'UPCOMING') return styles.statusUpcoming;
  if (status === 'LISTED') return styles.statusListed;
  return styles.statusClosed;
};

const scoreFromAdvisor = (rawScore: number) => {
  if (rawScore <= 10) return Math.max(0, Math.min(10, rawScore));
  return Math.max(0, Math.min(10, rawScore / 10));
};

const insightFromAdvisor = (result: AdvisorApiResult): InsightView => {
  const mappedVerdict: InsightVerdict =
    result.verdict === 'NEUTRAL' ? 'WATCH' : (result.verdict as InsightVerdict);

  const score = scoreFromAdvisor(result.score);
  const reason =
    mappedVerdict === 'APPLY'
      ? result.reasons?.[0]
      : mappedVerdict === 'AVOID'
      ? result.risks?.[0] || result.reasons?.[0]
      : result.reasons?.[0] || result.risks?.[0];

  return {
    verdict: mappedVerdict,
    score,
    brief: reason || 'AI suggests waiting for clearer demand trend.',
    confidence: 'High',
  };
};

const insightFromStoredAdvisor = (ipo: IPOView): InsightView | null => {
  if (!ipo.advisorVerdict) return null;

  const verdictMap: Record<string, InsightVerdict> = {
    APPLY: 'APPLY',
    AVOID: 'AVOID',
    NEUTRAL: 'WATCH',
    WATCH: 'WATCH',
  };

  const verdict = verdictMap[ipo.advisorVerdict.toUpperCase()] || 'WATCH';
  const score = ipo.advisorScore === null ? 5 : scoreFromAdvisor(ipo.advisorScore);

  return {
    verdict,
    score,
    brief:
      ipo.advisorReasoning ||
      (verdict === 'APPLY'
        ? 'Stored AI verdict favors applying at this stage.'
        : verdict === 'AVOID'
        ? 'Stored AI verdict signals elevated downside risk.'
        : 'Stored AI verdict is neutral. Wait for stronger cues.'),
    confidence: ipo.advisorReasoning ? 'High' : 'Medium',
  };
};

export default function IPOsPage() {
  const [ipos, setIpos] = useState<IPOView[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [sort, setSort] = useState<SortType>('close');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [advisorById, setAdvisorById] = useState<Record<number, AdvisorApiResult>>({});
  const [advisorLoadingById, setAdvisorLoadingById] = useState<Record<number, boolean>>({});

  const fetchIPOs = useCallback(async (isSilent = false) => {
    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const response: any = await iposAPI.getAll(filter === 'ALL' ? undefined : filter);
      const rows = (response?.data || []).map(normalizeIPO);
      setIpos(rows);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Unable to fetch IPO data. Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIPOs();
    const timer = window.setInterval(() => fetchIPOs(true), 45000);
    return () => window.clearInterval(timer);
  }, [fetchIPOs]);

  const runAdvisor = async (ipoId: number) => {
    setAdvisorLoadingById(prev => ({ ...prev, [ipoId]: true }));

    try {
      const response: any = await iposAPI.getAdvisor(ipoId);
      const data = response?.data as AdvisorApiResult;
      if (data?.verdict) {
        setAdvisorById(prev => ({ ...prev, [ipoId]: data }));
      }
    } catch {
      // Keep fallback insight when advisor API is unavailable.
    } finally {
      setAdvisorLoadingById(prev => ({ ...prev, [ipoId]: false }));
    }
  };

  const rowsWithInsights = useMemo(() => {
    return ipos.map(ipo => {
      const liveAdvisor = advisorById[ipo.id];
      const storedInsight = insightFromStoredAdvisor(ipo);
      const fallback = buildFallbackInsight(ipo);

      return {
        ...ipo,
        insight: liveAdvisor ? insightFromAdvisor(liveAdvisor) : storedInsight || fallback,
      };
    });
  }, [ipos, advisorById]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = rowsWithInsights.filter(ipo => {
      if (!query) return true;
      const haystack = `${ipo.companyName} ${ipo.industry || ''} ${ipo.type}`.toLowerCase();
      return haystack.includes(query);
    });

    const sorted = [...rows];
    sorted.sort((a, b) => {
      if (sort === 'gmp') return (b.gmpPercent ?? -999) - (a.gmpPercent ?? -999);
      if (sort === 'subscription') return (b.total ?? -999) - (a.total ?? -999);
      if (sort === 'ai') return b.insight.score - a.insight.score;

      const aClose = toDate(a.closeDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bClose = toDate(b.closeDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aClose - bClose;
    });

    return sorted;
  }, [rowsWithInsights, search, sort]);

  const metrics = useMemo(() => {
    const gmpValues = rowsWithInsights.map(row => row.gmpPercent).filter((n): n is number => n !== null);
    const avgGmp = gmpValues.length
      ? gmpValues.reduce((sum, n) => sum + n, 0) / gmpValues.length
      : null;

    const openCount = rowsWithInsights.filter(row => row.status === 'OPEN').length;
    const applyCount = rowsWithInsights.filter(row => row.insight.verdict === 'APPLY').length;
    const highestSub = rowsWithInsights.reduce((max, row) => Math.max(max, row.total ?? 0), 0);

    return { avgGmp, openCount, applyCount, highestSub };
  }, [rowsWithInsights]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.kicker}>
              <Activity size={14} />
              Live IPO board
            </p>
            <h1 className={styles.title}>IPO Pulse</h1>
            <p className={styles.subtitle}>
              Investorgain-style live GMP + subscriptions with an AI verdict layer for apply/avoid clarity.
            </p>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.liveTag}>
              <span className={styles.liveDot} />
              Live updates every 45s
            </div>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => fetchIPOs(true)}
              disabled={refreshing}
            >
              <RefreshCcw size={14} className={refreshing ? styles.spin : ''} />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>
            <div className={styles.updatedAt}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Waiting for first sync'}
            </div>
          </div>
        </header>

        <section className={styles.metricsRow}>
          <article className={styles.metricCard}>
            <p>Open IPOs</p>
            <strong>{metrics.openCount}</strong>
          </article>
          <article className={styles.metricCard}>
            <p>Average GMP</p>
            <strong>{metrics.avgGmp === null ? '--' : `${metrics.avgGmp.toFixed(1)}%`}</strong>
          </article>
          <article className={styles.metricCard}>
            <p>Highest Subscription</p>
            <strong>{metrics.highestSub > 0 ? `${metrics.highestSub.toFixed(2)}x` : '--'}</strong>
          </article>
          <article className={styles.metricCard}>
            <p>AI Apply Calls</p>
            <strong>{metrics.applyCount}</strong>
          </article>
        </section>

        <section className={styles.controls}>
          <div className={styles.searchWrap}>
            <Search size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company or industry"
            />
          </div>

          <select
            className={styles.sortSelect}
            value={sort}
            onChange={e => setSort(e.target.value as SortType)}
          >
            <option value="close">Sort: Closing soon</option>
            <option value="gmp">Sort: Highest GMP</option>
            <option value="subscription">Sort: Highest subscription</option>
            <option value="ai">Sort: Best AI score</option>
          </select>

          <div className={styles.filterWrap}>
            {FILTERS.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={item === filter ? styles.filterActive : styles.filterBtn}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className={styles.loadingBlock}>
            {[1, 2, 3, 4].map(index => (
              <div key={index} className={styles.skeletonRow} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.errorBlock}>{error}</div>
        ) : filteredRows.length === 0 ? (
          <div className={styles.emptyBlock}>
            <CircleDashed size={18} />
            No IPOs found for this filter.
          </div>
        ) : (
          <section className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Issue</th>
                  <th>GMP</th>
                  <th>Subscription (Q/H/R/T)</th>
                  <th>AI Insight</th>
                  <th>Close</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(ipo => {
                  const daysLeftRaw = toDate(ipo.closeDate)
                    ? Math.ceil(((toDate(ipo.closeDate)?.getTime() || 0) - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  const daysLeftLabel =
                    daysLeftRaw === null
                      ? '--'
                      : daysLeftRaw > 0
                      ? `${daysLeftRaw}d left`
                      : ipo.status === 'LISTED'
                      ? 'Listed'
                      : 'Closed';

                  return (
                    <tr key={ipo.id}>
                      <td>
                        <div className={styles.companyCell}>
                          <strong>{ipo.companyName}</strong>
                          <div className={styles.metaLine}>
                            <span className={`${styles.statusPill} ${statusClassName(ipo.status)}`}>
                              {ipo.status}
                            </span>
                            <span>{ipo.type}</span>
                            {ipo.industry ? <span>{ipo.industry}</span> : null}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className={styles.metricCell}>
                          <span>{formatPriceBand(ipo.priceBandLow, ipo.priceBandHigh)}</span>
                          <small>{formatCrores(ipo.issueSizeCr)} | Lot {ipo.lotSize ?? '--'}</small>
                        </div>
                      </td>

                      <td>
                        <div className={styles.metricCell}>
                          <span className={ipo.gmpPercent !== null && ipo.gmpPercent >= 0 ? styles.gain : styles.loss}>
                            {formatGmp(ipo.gmpPercent)}
                          </span>
                          <small>
                            {ipo.gmpPrice === null
                              ? 'GMP value --'
                              : `GMP Rs ${ipo.gmpPrice > 0 ? '+' : ''}${ipo.gmpPrice.toFixed(0)}`}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className={styles.metricCell}>
                          <span>
                            {formatX(ipo.qib)} / {formatX(ipo.hni)} / {formatX(ipo.retail)} / {formatX(ipo.total)}
                          </span>
                          <small>QIB / HNI / Retail / Total</small>
                        </div>
                      </td>

                      <td>
                        <div className={styles.aiCell}>
                          <div className={styles.aiTopRow}>
                            <span className={`${styles.verdictPill} ${verdictClassName(ipo.insight.verdict)}`}>
                              <Sparkles size={12} />
                              {ipo.insight.verdict}
                            </span>
                            <span className={styles.aiScore}>{ipo.insight.score.toFixed(1)}/10</span>
                            <span className={styles.aiConfidence}>{ipo.insight.confidence}</span>
                          </div>
                          <p>{ipo.insight.brief}</p>
                          <button
                            type="button"
                            className={styles.aiRefreshInline}
                            onClick={() => runAdvisor(ipo.id)}
                            disabled={advisorLoadingById[ipo.id]}
                          >
                            <Bot size={12} />
                            {advisorLoadingById[ipo.id] ? 'Analyzing...' : 'Re-run AI'}
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className={styles.actionCell}>
                          <span>{formatDate(ipo.closeDate)}</span>
                          <small>{daysLeftLabel}</small>
                          <Link href={`/ipos/${ipo.id}`} className={styles.detailLink}>
                            Details
                            {ipo.gmpPercent !== null && ipo.gmpPercent >= 0 ? (
                              <TrendingUp size={13} />
                            ) : (
                              <TrendingDown size={13} />
                            )}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

/*

'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Calendar, Users, Target, AlertTriangle } from 'lucide-react';

const VERDICT_COLORS = {
  APPLY: { bg: 'var(--green-lo)', text: 'var(--green)', icon: TrendingUp },
  AVOID: { bg: 'var(--red-lo)', text: 'var(--red)', icon: TrendingDown },
  NEUTRAL: { bg: 'var(--amber-lo)', text: 'var(--amber)', icon: Target },
};

export default function IPOsPage() {
  const [ipos, setIpos] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIPOs();
  }, [filter]);

  const fetchIPOs = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const url = filter === 'ALL' ? `${base}/ipos` : `${base}/ipos?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setIpos(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (closeDate: string) => {
    const days = Math.ceil((new Date(closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d left` : 'Closed';
  };

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
        
        <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: 20 }}>Live IPOs</h1>

        //{ Filters }
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['ALL', 'OPEN', 'UPCOMING', 'CLOSED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 16 }}>
            {ipos.map(ipo => {
              const verdict = ipo.advisorVerdict || 'NEUTRAL';
              const { bg, text, icon: Icon } = VERDICT_COLORS[verdict as keyof typeof VERDICT_COLORS];
              
              return (
                <div key={ipo.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  //{ Header }
                  <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{ipo.companyName}</h3>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className="badge badge-muted">{ipo.type}</span>
                          <span className={`badge ${ipo.status === 'OPEN' ? 'badge-green' : 'badge-muted'}`}>
                            {ipo.status}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: Number(ipo.gmpPercent) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {Number(ipo.gmpPercent) >= 0 ? '+' : ''}{Number(ipo.gmpPercent).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>GMP</div>
                      </div>
                    </div>

                    //{ Price Band }
                    <div style={{ fontSize: 13, color: 'var(--txt-2)' }}>
                      ₹{ipo.priceBandLow} - ₹{ipo.priceBandHigh} • Lot {ipo.lotSize}
                    </div>
                  </div>

                  //{ AI Verdict }
                  {ipo.advisorVerdict && (
                    <div style={{ padding: 16, background: bg, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <Icon size={18} style={{ color: text }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: text, textTransform: 'uppercase' }}>
                          {verdict}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 800, color: text }}>
                          {ipo.advisorScore}/10
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.5 }}>
                        {ipo.advisorReasoning}
                      </div>
                    </div>
                  )}

                  //{ Stats }
                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 4 }}>Subscription</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {ipo.totalTimes ? `${Number(ipo.totalTimes).toFixed(1)}x` : 'TBA'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 4 }}>Closes</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {getDaysLeft(ipo.closeDate)}
                      </div>
                    </div>
                  </div>

                  //{ Action }
                  <div style={{ padding: 16, paddingTop: 0 }}>
                    <button
                      onClick={() => window.location.href = `/ipos/${ipo.id}`}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

*/