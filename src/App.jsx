import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import {
  MessageCircle, Camera, Tv, Globe, X, Zap, TrendingUp,
  TrendingDown, AlertTriangle, Eye, Pause, BarChart3, Loader2,
  ChevronUp, ChevronDown, SlidersHorizontal, Target
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300_000, retry: 1 } },
});

const API = 'https://mosaicfellowship.in/api/data/content/ads';

const fetchPage = async (page) => {
  const res = await fetch(`${API}?page=${page}&limit=100`);
  if (!res.ok) throw new Error(`Page ${page}: HTTP ${res.status}`);
  return res.json();
};

// ─── PLATFORM IDENTITY ────────────────────────────────────────────────────────
const getPlatform = (platform = '') => {
  const p = platform.toLowerCase();
  if (p.includes('meta') || p.includes('facebook')) return { icon: MessageCircle, name: 'Meta', color: '#1877F2' };
  if (p.includes('instagram')) return { icon: Camera, name: 'Instagram', color: '#C13584' };
  if (p.includes('youtube')) return { icon: Tv, name: 'YouTube', color: '#FF0000' };
  if (p.includes('google')) return { icon: Globe, name: 'Google', color: '#34A853' };
  return { icon: Globe, name: platform || 'Network', color: '#94a3b8' };
};

// ─── COMPREHENSIVE SIGNAL ENGINE ──────────────────────────────────────────────
// Every available field is considered. Signals are prioritized by weight.
// The highest-weight category determines the final action.
const analyzeAd = (raw, targetCpa) => {
  const spend     = +raw.spend || 0;
  const conv      = +raw.conversions || 0;
  const revenue   = +raw.revenue || 0;
  const roas      = +raw.roas || 0;
  const days      = +raw.days_running || 0;
  const ctr       = +raw.ctr || 0;
  const cpc       = +raw.cpc || 0;
  const impr      = +raw.impressions || 0;
  const clicks    = +raw.clicks || 0;
  const freq      = +raw.frequency || 0;
  const cs        = +raw.creative_score || 0;
  const lps       = +raw.landing_page_score || 0;
  const vcr       = raw.video_completion_rate != null ? +raw.video_completion_rate : null;
  const cpa       = +raw.cpa || (conv > 0 ? spend / conv : 0);
  const status    = (raw.status || '').toLowerCase();

  const signals = [];

  // ── KILL signals (weight 80-100) ──────────────────────────────────────────
  // Classic budget drain: meaningful spend, zero proof of life
  if (spend > 3 * targetCpa && conv === 0)
    signals.push({ id: 'capital_bleed', label: 'Capital Bleed', cat: 'kill', weight: 100,
      desc: `₹${spend.toLocaleString()} spent — ${(spend / targetCpa).toFixed(1)}× target CPA — with zero conversions. No signal of intent.` });

  // Sustained negative ROAS with enough data to know it won't turn around
  if (roas > 0 && roas < 1 && days >= 14)
    signals.push({ id: 'sustained_loss', label: 'Sustained Loss', cat: 'kill', weight: 95,
      desc: `ROAS ${roas.toFixed(2)}x below break-even for ${days} days. Revenue ₹${revenue.toLocaleString()} vs spend ₹${spend.toLocaleString()}.` });

  // Both creative and landing page are failing — structural problem, no quick fix
  if (cs < 3 && lps < 4)
    signals.push({ id: 'funnel_collapse', label: 'Funnel Collapse', cat: 'kill', weight: 90,
      desc: `Creative ${cs.toFixed(1)}/10 and LP ${lps.toFixed(1)}/10. Both asset layers failing — structural, not tactical.` });

  // Massive reach, essentially invisible — no resonance at scale
  if (impr > 2_000_000 && ctr < 0.3 && conv === 0)
    signals.push({ id: 'invisible', label: 'Ad Invisible', cat: 'kill', weight: 85,
      desc: `${(impr / 1e6).toFixed(1)}M impressions at ${ctr}% CTR with zero conversions. Audience is tuning it out.` });

  // Deeply unprofitable even when converting (roas < 0.5 = losing more than half of spend)
  if (roas > 0 && roas < 0.5 && conv > 0 && days >= 7)
    signals.push({ id: 'deep_loss', label: 'Deep Conversion Loss', cat: 'kill', weight: 88,
      desc: `Converting but ROAS is ${roas.toFixed(2)}x — each ₹1 spent returns ${(roas * 100).toFixed(0)} paise. Cut losses.` });

  // ── SCALE signals (weight 80-100) ─────────────────────────────────────────
  // Classic proven performer: CPA on target, strong CTR, enough days to validate
  if (cpa > 0 && cpa <= targetCpa && ctr > 2 && days >= 5 && conv > 0)
    signals.push({ id: 'proven', label: 'Proven Performer', cat: 'scale', weight: 100,
      desc: `CPA ₹${cpa.toFixed(0)} ≤ target. CTR ${ctr}%. ${days}-day run validated. Ready for budget increase.` });

  // Exceptional ROAS — rare, must scale aggressively
  if (roas >= 10 && conv > 0 && cpa <= targetCpa * 1.5)
    signals.push({ id: 'roas_champ', label: 'ROAS Champion', cat: 'scale', weight: 95,
      desc: `${roas.toFixed(1)}× return on spend. ₹${revenue.toLocaleString()} revenue from ₹${spend.toLocaleString()} spend.` });

  // Full funnel alignment: creative quality + LP quality + actual results
  if (cs > 7 && lps > 7 && roas > 3 && conv > 0)
    signals.push({ id: 'full_funnel', label: 'Full Funnel Firing', cat: 'scale', weight: 85,
      desc: `Creative ${cs.toFixed(1)}/10, LP ${lps.toFixed(1)}/10, ROAS ${roas.toFixed(1)}x. Every stage of funnel working.` });

  // Strong video engagement driving conversions — video content working
  if (vcr !== null && vcr > 70 && conv > 0 && cpa <= targetCpa)
    signals.push({ id: 'video_power', label: 'Video Dominance', cat: 'scale', weight: 82,
      desc: `${vcr}% video completion rate with CPA on target. Content is deeply engaging.` });

  // ── OPTIMIZE signals (weight 50-75) ───────────────────────────────────────
  // Good hook, bad landing page — specific fix available
  if (ctr > 3 && lps < 5)
    signals.push({ id: 'lp_leak', label: 'LP Conversion Leak', cat: 'optimize', weight: 72,
      desc: `${ctr}% CTR shows a working hook but LP score ${lps.toFixed(1)}/10 is losing the sale. Fix the page.` });

  // Creative underperforming despite spend — needs a refresh
  if (cs < 4 && ctr < 1 && spend > targetCpa)
    signals.push({ id: 'weak_creative', label: 'Weak Creative', cat: 'optimize', weight: 62,
      desc: `Creative score ${cs.toFixed(1)}/10 with ${ctr}% CTR. Asset is not resonating. Replace creative.` });

  // Video dropping off too early — hook problem
  if (vcr !== null && vcr < 25 && spend > 1000)
    signals.push({ id: 'video_dropoff', label: 'Video Drop-off', cat: 'optimize', weight: 58,
      desc: `${vcr}% video completion. 75%+ of viewers leave in first few seconds. Rework the hook.` });

  // Converting but LP has room to unlock more — optimization opportunity, not a problem
  if (lps < 5 && conv > 0 && roas > 2)
    signals.push({ id: 'lp_upside', label: 'LP Upside Unclaimed', cat: 'optimize', weight: 52,
      desc: `Generating ₹${revenue.toLocaleString()} despite LP score ${lps.toFixed(1)}/10. A better page could meaningfully increase ROAS.` });

  // High impressions but low click-through — ad isn't standing out in feed
  if (impr > 500_000 && ctr < 0.8 && cs < 6)
    signals.push({ id: 'feed_blindness', label: 'Feed Blindness', cat: 'optimize', weight: 55,
      desc: `${(impr / 1e6).toFixed(1)}M impressions at ${ctr}% CTR with creative score ${cs.toFixed(1)}/10. Ad is not stopping the scroll.` });

  // ── PAUSE signals (weight 55-70) ──────────────────────────────────────────
  // Audience saturation — seen it too many times
  if (freq > 7)
    signals.push({ id: 'fatigue', label: 'Audience Fatigue', cat: 'pause', weight: 68,
      desc: `Frequency ${freq.toFixed(1)}× — same people seeing this ad too often. Rest it or rotate creative.` });

  // High frequency eating into a good CPA — performance will degrade
  if (freq > 5 && cpa > targetCpa * 0.8 && cpa <= targetCpa)
    signals.push({ id: 'creeping_fatigue', label: 'Creeping Fatigue', cat: 'pause', weight: 58,
      desc: `Frequency ${freq.toFixed(1)}× approaching saturation. CPA still on target but expect degradation soon.` });

  // ── WATCH signals (weight 30-55) ───────────────────────────────────────────
  // Converting but too expensive — needs optimisation before scaling
  if (conv > 0 && cpa > 2 * targetCpa)
    signals.push({ id: 'expensive_conv', label: 'Expensive Conversions', cat: 'warn', weight: 52,
      desc: `CPA ₹${cpa.toFixed(0)} is ${(cpa / targetCpa).toFixed(1)}× target. Converting but cost is unsustainable.` });

  // Clicks too expensive relative to CPA potential
  if (cpc > 10 && conv === 0)
    signals.push({ id: 'high_cpc_zero', label: 'High CPC, No Return', cat: 'warn', weight: 48,
      desc: `₹${cpc.toFixed(2)} per click with zero conversions. Click cost alone exceeds value delivered.` });

  if (cpc > 10 && conv > 0)
    signals.push({ id: 'high_cpc', label: 'High CPC', cat: 'warn', weight: 38,
      desc: `₹${cpc.toFixed(2)} per click. ${conv} conversions present but click cost is compressing margin.` });

  // Losing money but early — might improve, watch closely
  if (roas > 0 && roas < 1 && days < 14)
    signals.push({ id: 'early_loss', label: 'Early Loss', cat: 'warn', weight: 45,
      desc: `ROAS ${roas.toFixed(2)}x below break-even but only ${days} days running. Monitor for trend.` });

  // Paused status with good underlying metrics — should be reactivated
  if (status === 'paused' && roas > 3 && cpa <= targetCpa)
    signals.push({ id: 'paused_winner', label: 'Paused Winner', cat: 'warn', weight: 42,
      desc: `Status: Paused but ROAS ${roas.toFixed(1)}x with CPA on target. Investigate why this was paused.` });

  // ── INFO signals (weight < 30) ─────────────────────────────────────────────
  // Not enough run time to make a call
  if (days < 5)
    signals.push({ id: 'early_stage', label: 'Early Stage', cat: 'info', weight: 22,
      desc: `Only ${days} day${days !== 1 ? 's' : ''} of data — insufficient for a reliable verdict.` });

  // Good creative, poor results — creative not the issue, look at targeting/LP
  if (cs > 7 && roas < 2 && conv > 0)
    signals.push({ id: 'creative_mismatch', label: 'Creative Mismatch', cat: 'info', weight: 18,
      desc: `Strong creative ${cs.toFixed(1)}/10 but ROAS ${roas.toFixed(1)}x. Creative isn't the problem — check audience or LP.` });

  signals.sort((a, b) => b.weight - a.weight);

  // Determine action from dominant signal category
  let action = 'Monitor';
  if (signals.some(s => s.cat === 'kill'))     action = 'Kill';
  else if (signals.some(s => s.cat === 'scale')) action = 'Scale';
  else if (signals.some(s => s.id === 'fatigue' || s.id === 'creeping_fatigue')) action = 'Pause';
  else if (signals.some(s => s.cat === 'optimize')) action = 'Optimize';
  else if (signals.some(s => s.cat === 'warn')) action = 'Watch';

  return { action, signals };
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACTION_CONFIG = {
  Kill:     { bg: 'bg-red-600',      text: 'text-white',      ring: 'ring-red-600',     badge: 'bg-red-600 text-white',           border: 'border-l-red-500',    icon: TrendingDown, dot: '#ef4444' },
  Scale:    { bg: 'bg-emerald-700',  text: 'text-white',      ring: 'ring-emerald-700', badge: 'bg-emerald-700 text-white',       border: 'border-l-emerald-500',icon: TrendingUp,   dot: '#10b981' },
  Optimize: { bg: 'bg-amber-500',    text: 'text-white',      ring: 'ring-amber-500',   badge: 'bg-amber-500 text-white',         border: 'border-l-amber-400',  icon: SlidersHorizontal, dot: '#f59e0b' },
  Pause:    { bg: 'bg-slate-400',    text: 'text-white',      ring: 'ring-slate-400',   badge: 'bg-slate-400 text-white',         border: 'border-l-slate-400',  icon: Pause,        dot: '#94a3b8' },
  Watch:    { bg: 'bg-violet-600',   text: 'text-white',      ring: 'ring-violet-600',  badge: 'bg-violet-600 text-white',        border: 'border-l-violet-500', icon: Eye,          dot: '#7c3aed' },
  Monitor:  { bg: 'bg-slate-100',    text: 'text-slate-600',  ring: 'ring-slate-200',   badge: 'bg-slate-100 text-slate-600',     border: 'border-l-slate-200',  icon: BarChart3,    dot: '#94a3b8' },
};

const CAT_STYLE = {
  kill:     'bg-red-50 border border-red-200 text-red-800',
  scale:    'bg-emerald-50 border border-emerald-200 text-emerald-800',
  optimize: 'bg-amber-50 border border-amber-200 text-amber-800',
  pause:    'bg-slate-100 border border-slate-200 text-slate-600',
  warn:     'bg-violet-50 border border-violet-200 text-violet-800',
  info:     'bg-sky-50 border border-sky-200 text-sky-700',
};

const fmt = (n, prefix = '₹') => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e7) return `${prefix}${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `${prefix}${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(1)}K`;
  return `${prefix}${Math.round(n).toLocaleString()}`;
};

const fmtPct = (n) => isNaN(+n) ? '—' : `${(+n).toFixed(2)}%`;

const SORT_KEYS = ['spend', 'revenue', 'roas', 'cpa', 'ctr', 'days_running', 'conversions', 'impressions'];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Dashboard = () => {
  const [targetCpa, setTargetCpa] = useState(50);
  const [editingCpa, setEditingCpa] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [filterAction, setFilterAction] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState(-1);

  // Fetch page 1 first — response tells us total_pages
  const page1 = useQuery({ queryKey: ['ads', 1], queryFn: () => fetchPage(1) });
  const totalPages = page1.data?.pagination?.total_pages || 1;
  const totalAds = page1.data?.pagination?.total || 0;

  // Fetch all remaining pages in parallel once we know how many there are
  const restQueries = useQueries({
    queries: Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      queryKey: ['ads', i + 2],
      queryFn: () => fetchPage(i + 2),
      enabled: page1.isSuccess && totalPages > 1,
    })),
  });

  const pagesLoaded = 1 + restQueries.filter(q => q.isSuccess).length;
  const isLoading = page1.isLoading;
  const isFetching = page1.isSuccess && pagesLoaded < totalPages;

  // Merge all raw rows
  const allRaw = useMemo(() => {
    const rows = [];
    if (page1.data?.data) rows.push(...page1.data.data);
    restQueries.forEach(q => { if (q.data?.data) rows.push(...q.data.data); });
    return rows;
  }, [page1.data, restQueries]);

  // Run signal engine on all ads
  const { ads, metrics, platforms } = useMemo(() => {
    if (!allRaw.length) return { ads: [], metrics: null, platforms: [] };

    const processed = allRaw.map(raw => {
      const spend   = +raw.spend || 0;
      const revenue = +raw.revenue || 0;
      const conv    = +raw.conversions || 0;
      const roas    = +raw.roas || 0;
      const cpa     = +raw.cpa || (conv > 0 ? spend / conv : 0);
      const { action, signals } = analyzeAd(raw, targetCpa);
      return {
        ...raw, spend, revenue, conversions: conv, roas, cpa,
        ctr: +raw.ctr || 0, cpc: +raw.cpc || 0,
        impressions: +raw.impressions || 0, clicks: +raw.clicks || 0,
        days_running: +raw.days_running || 0, frequency: +raw.frequency || 0,
        creative_score: +raw.creative_score || 0,
        landing_page_score: +raw.landing_page_score || 0,
        video_completion_rate: raw.video_completion_rate != null ? +raw.video_completion_rate : null,
        platform: getPlatform(raw.platform),
        platformName: raw.platform || 'Unknown',
        action, signals,
      };
    });

    const kills  = processed.filter(a => a.action === 'Kill');
    const scales = processed.filter(a => a.action === 'Scale');
    const totalSpend   = processed.reduce((s, a) => s + a.spend, 0);
    const totalRevenue = processed.reduce((s, a) => s + a.revenue, 0);
    const wastedSpend  = kills.reduce((s, a) => s + a.spend, 0);
    const pSet = new Set(processed.map(a => a.platformName).filter(Boolean));

    return {
      ads: processed,
      metrics: {
        total: processed.length, totalSpend, totalRevenue, wastedSpend,
        overallRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        killCount: kills.length, scaleCount: scales.length,
        optimizeCount: processed.filter(a => a.action === 'Optimize').length,
      },
      platforms: Array.from(pSet).sort(),
    };
  }, [allRaw, targetCpa]);

  // Filter + sort
  const displayed = useMemo(() => {
    let list = [...ads];
    if (filterAction !== 'all') list = list.filter(a => a.action === filterAction);
    if (filterPlatform !== 'all') list = list.filter(a => a.platformName === filterPlatform);

    list.sort((a, b) => {
      // Primary: action priority order
      const order = { Kill: 0, Scale: 1, Optimize: 2, Watch: 3, Pause: 4, Monitor: 5 };
      if (filterAction === 'all') {
        const oa = order[a.action] ?? 5, ob = order[b.action] ?? 5;
        if (oa !== ob) return oa - ob;
      }
      // Secondary: user-chosen sort key
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return (bv - av) * sortDir;
    });
    return list;
  }, [ads, filterAction, filterPlatform, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === -1 ? <ChevronDown size={12} className="inline ml-1" /> : <ChevronUp size={12} className="inline ml-1" />)
    : <span className="inline-block w-3" />;

  if (isLoading) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-white mx-auto mb-4" size={32} />
        <p className="text-slate-400 text-sm">Loading ad intelligence…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <div className="border-b border-white/8 px-8 py-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Ad Intelligence</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {metrics?.total.toLocaleString() || 0} ads
              {isFetching && <span className="ml-2 text-amber-400">· loading page {pagesLoaded + 1} of {totalPages}…</span>}
              {!isFetching && totalPages > 1 && <span className="text-slate-600"> · {totalPages} pages</span>}
            </p>
          </div>

          {/* Target CPA control */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              <Target size={14} className="text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Target CPA</span>
              {editingCpa ? (
                <input
                  type="number"
                  value={targetCpa}
                  onChange={e => setTargetCpa(Math.max(1, +e.target.value))}
                  onBlur={() => setEditingCpa(false)}
                  className="w-20 bg-transparent text-white text-sm font-bold text-right outline-none border-b border-white/30"
                  autoFocus
                />
              ) : (
                <button onClick={() => setEditingCpa(true)} className="text-white text-sm font-bold hover:text-amber-400 transition-colors">
                  ₹{targetCpa}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── HEADLINE METRICS ── */}
      {metrics && (
        <div className="px-8 py-6 border-b border-white/8">
          <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total Spend',   value: fmt(metrics.totalSpend),   sub: null,         accent: 'text-white' },
              { label: 'Total Revenue', value: fmt(metrics.totalRevenue),  sub: null,         accent: 'text-white' },
              { label: 'Overall ROAS',  value: `${metrics.overallRoas.toFixed(2)}×`, sub: null, accent: metrics.overallRoas >= 2 ? 'text-emerald-400' : metrics.overallRoas < 1 ? 'text-red-400' : 'text-white' },
              { label: 'Wasted Spend',  value: fmt(metrics.wastedSpend),  sub: `${metrics.killCount} Kill`,     accent: 'text-red-400' },
              { label: 'Kill',          value: metrics.killCount,          sub: 'terminate',  accent: 'text-red-400' },
              { label: 'Scale',         value: metrics.scaleCount,         sub: 'increase budget', accent: 'text-emerald-400' },
              { label: 'Optimize',      value: metrics.optimizeCount,      sub: 'fix & test', accent: 'text-amber-400' },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="bg-white/4 border border-white/8 rounded-xl px-4 py-3.5">
                <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-xl font-bold ${accent}`}>{value}</p>
                {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTERS ── */}
      <div className="px-8 py-4 border-b border-white/8">
        <div className="max-w-[1600px] mx-auto flex flex-wrap gap-2 items-center">
          {/* Action filters */}
          {['all', 'Kill', 'Scale', 'Optimize', 'Watch', 'Pause', 'Monitor'].map(f => {
            const active = filterAction === f;
            const cfg = ACTION_CONFIG[f];
            return (
              <button key={f} onClick={() => setFilterAction(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  active
                    ? f === 'all' ? 'bg-white text-black border-white' : `${cfg.bg} ${cfg.text} border-transparent`
                    : 'bg-white/4 text-slate-400 border-white/8 hover:bg-white/8 hover:text-white'
                }`}>
                {f === 'all' ? 'All' : f}
                {f !== 'all' && metrics && (
                  <span className="ml-1.5 opacity-60">{ads.filter(a => a.action === f).length}</span>
                )}
              </button>
            );
          })}
          {platforms.length > 0 && <div className="h-4 w-px bg-white/10 mx-1" />}
          {platforms.map(p => {
            const plt = getPlatform(p);
            const active = filterPlatform === p;
            return (
              <button key={p} onClick={() => setFilterPlatform(active ? 'all' : p)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  active ? 'bg-white/15 text-white border-white/20' : 'bg-white/4 text-slate-400 border-white/8 hover:bg-white/8'
                }`}>
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: plt.color }} />
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    {[
                      { key: null, label: 'Action' },
                      { key: null, label: 'Ad / Brand' },
                      { key: 'spend', label: 'Spend' },
                      { key: 'revenue', label: 'Revenue' },
                      { key: 'roas', label: 'ROAS' },
                      { key: 'cpa', label: 'CPA' },
                      { key: 'ctr', label: 'CTR' },
                      { key: 'conversions', label: 'Conv.' },
                      { key: 'days_running', label: 'Days' },
                      { key: null, label: 'Signals' },
                    ].map(({ key, label }) => (
                      <th key={label}
                        onClick={() => key && handleSort(key)}
                        className={`text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap ${key ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}`}>
                        {label}{key && <SortIcon k={key} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((ad, i) => {
                    const cfg = ACTION_CONFIG[ad.action] || ACTION_CONFIG.Monitor;
                    const ActionIcon = cfg.icon;
                    const killSigs = ad.signals.filter(s => s.cat === 'kill').length;
                    const scaleSigs = ad.signals.filter(s => s.cat === 'scale').length;
                    return (
                      <tr key={ad.ad_id || i}
                        onClick={() => setSelectedAd(ad)}
                        className={`border-b border-white/5 cursor-pointer hover:bg-white/4 transition-colors border-l-2 ${cfg.border}`}>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.badge}`}>
                            <ActionIcon size={11} />
                            {ad.action}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-sm text-white">{ad.brand || '—'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ad.platform.color }} />
                            {ad.platformName} · {ad.category}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-200 tabular-nums">{fmt(ad.spend)}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-200 tabular-nums">{fmt(ad.revenue)}</td>
                        <td className="px-4 py-3.5 text-sm tabular-nums font-semibold" style={{ color: ad.roas >= 2 ? '#10b981' : ad.roas < 1 && ad.roas > 0 ? '#ef4444' : '#e2e8f0' }}>
                          {ad.roas.toFixed(2)}×
                        </td>
                        <td className={`px-4 py-3.5 text-sm tabular-nums ${ad.cpa > targetCpa ? 'text-red-400' : 'text-emerald-400'}`}>
                          {fmt(ad.cpa)}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-slate-300 tabular-nums">{fmtPct(ad.ctr)}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-300 tabular-nums">{ad.conversions.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-sm text-slate-400 tabular-nums">{ad.days_running}d</td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1">
                            {killSigs > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950 text-red-400 text-[10px] font-bold border border-red-900">
                                {killSigs}×
                              </span>
                            )}
                            {scaleSigs > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-900">
                                {scaleSigs}×
                              </span>
                            )}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-slate-500 text-[10px]">
                              {ad.signals.length} sig
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center text-slate-600 text-sm">
                        No ads match the current filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-slate-700 text-xs mt-3 text-right">
            Showing {displayed.length} of {ads.length} loaded · Target CPA ₹{targetCpa}
          </p>
        </div>
      </div>

      {/* ── DOSSIER SLIDE-OUT ── */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-lg bg-[#111111] border-l border-white/10 h-full overflow-y-auto flex flex-col">

            {/* Dossier header */}
            <div className="sticky top-0 bg-[#111111]/95 backdrop-blur border-b border-white/8 px-6 py-4 flex items-start justify-between gap-4 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {(() => { const cfg = ACTION_CONFIG[selectedAd.action]; const Icon = cfg.icon;
                    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.badge}`}><Icon size={11} />{selectedAd.action}</span>; })()}
                </div>
                <h2 className="text-xl font-bold text-white">{selectedAd.brand || selectedAd.ad_id}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: selectedAd.platform.color }} />
                  {selectedAd.platformName} · {selectedAd.ad_type} · {selectedAd.category}
                </p>
              </div>
              <button onClick={() => setSelectedAd(null)} className="text-slate-600 hover:text-white transition-colors mt-1 shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Key numbers */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Spend',    value: fmt(selectedAd.spend) },
                  { label: 'Revenue',  value: fmt(selectedAd.revenue) },
                  { label: 'ROAS',     value: `${selectedAd.roas.toFixed(2)}×`, color: selectedAd.roas >= 2 ? '#10b981' : selectedAd.roas < 1 && selectedAd.roas > 0 ? '#ef4444' : '#e2e8f0' },
                  { label: 'CPA',      value: fmt(selectedAd.cpa), color: selectedAd.cpa <= targetCpa ? '#10b981' : '#ef4444' },
                  { label: 'CTR',      value: fmtPct(selectedAd.ctr) },
                  { label: 'Conv.',    value: selectedAd.conversions.toLocaleString() },
                  { label: 'Creative', value: `${selectedAd.creative_score.toFixed(1)}/10`, color: selectedAd.creative_score >= 7 ? '#10b981' : selectedAd.creative_score < 4 ? '#ef4444' : '#e2e8f0' },
                  { label: 'LP Score', value: `${selectedAd.landing_page_score.toFixed(1)}/10`, color: selectedAd.landing_page_score >= 7 ? '#10b981' : selectedAd.landing_page_score < 4 ? '#ef4444' : '#e2e8f0' },
                  { label: 'Freq.',    value: `${selectedAd.frequency.toFixed(1)}×`, color: selectedAd.frequency > 7 ? '#ef4444' : '#e2e8f0' },
                ].map(({ label, value, color = '#e2e8f0' }) => (
                  <div key={label} className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{label}</p>
                    <p className="text-sm font-bold mt-0.5 tabular-nums" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Extra details */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ad type',     value: selectedAd.ad_type },
                  { label: 'Status',      value: selectedAd.status },
                  { label: 'Audience',    value: selectedAd.target_audience },
                  { label: 'Theme',       value: selectedAd.creative_theme },
                  { label: 'CPC',         value: fmt(selectedAd.cpc) },
                  { label: 'Impressions', value: (+selectedAd.impressions).toLocaleString() },
                  { label: 'Clicks',      value: (+selectedAd.clicks).toLocaleString() },
                  { label: 'VCR',         value: selectedAd.video_completion_rate != null ? `${selectedAd.video_completion_rate}%` : 'N/A' },
                  { label: 'Days running',value: `${selectedAd.days_running}d (since ${selectedAd.start_date})` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-baseline border-b border-white/5 pb-2">
                    <span className="text-[11px] text-slate-500">{label}</span>
                    <span className="text-[11px] text-slate-200 font-medium text-right max-w-[55%] truncate">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Signal breakdown — the core of the analysis */}
              <div>
                <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                  <Zap size={12} className="text-amber-400" />
                  Signal breakdown · {selectedAd.signals.length} signal{selectedAd.signals.length !== 1 ? 's' : ''} detected
                </h3>
                <div className="space-y-2">
                  {selectedAd.signals.length === 0 ? (
                    <p className="text-sm text-slate-600 italic">No active signals — ad is performing within normal range.</p>
                  ) : selectedAd.signals.map(sig => (
                    <div key={sig.id} className={`rounded-xl px-4 py-3 ${CAT_STYLE[sig.cat]}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wide">{sig.label}</span>
                        <span className="text-[10px] opacity-60 uppercase">{sig.cat}</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-80">{sig.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}