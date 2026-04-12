import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300_000, retry: 1 } },
});

const API = 'https://mosaicfellowship.in/api/data/content/ads';
const fetchPage = async (p) => {
  const r = await fetch(`${API}?page=${p}&limit=100`);
  if (!r.ok) throw new Error(`Page ${p}: ${r.status}`);
  return r.json();
};

// ─── TYPOGRAPHY + ANIMATION ───────────────────────────────────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Geist:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body { background: #080806; }

    .f-display { font-family: 'Cormorant Garamond', Georgia, serif; }
    .f-body    { font-family: 'Geist', 'DM Sans', system-ui, sans-serif; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn  { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes shimmer  { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }

    .anim-up    { animation: fadeUp  .45s cubic-bezier(.22,.68,0,1.2) both; }
    .anim-slide { animation: slideIn .3s  cubic-bezier(.22,.68,0,1.2) both; }

    .row-base {
      border-left: 2px solid transparent;
      transition: border-color .15s, background .15s;
      cursor: pointer;
    }
    .row-base:hover         { background: rgba(255,255,255,.024); }
    .row-kill:hover         { border-left-color: #FF453A; background: rgba(255,69,58,.04); }
    .row-scale:hover        { border-left-color: #32D74B; background: rgba(50,215,75,.04); }
    .row-optimize:hover     { border-left-color: #FF9F0A; background: rgba(255,159,10,.03); }
    .row-watch:hover        { border-left-color: #BF5AF2; background: rgba(191,90,242,.03); }
    .row-pause:hover        { border-left-color: #636366; }
    .row-monitor:hover      { border-left-color: #3A3A3C; }

    .shimmer-bg {
      background: linear-gradient(90deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.07) 50%, rgba(255,255,255,.03) 100%);
      background-size: 400px 100%;
      animation: shimmer 1.6s infinite;
    }

    .filter-pill { transition: all .15s; border: 1px solid transparent; }
    .filter-pill:hover { border-color: rgba(255,255,255,.1); }

    ::-webkit-scrollbar       { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.15); }
  `}</style>
);

// ─── SIGNAL ENGINE ────────────────────────────────────────────────────────────
const analyzeAd = (raw, targetCpa) => {
  const spend   = +raw.spend || 0;
  const conv    = +raw.conversions || 0;
  const revenue = +raw.revenue || 0;
  const roas    = +raw.roas || 0;
  const days    = +raw.days_running || 0;
  const ctr     = +raw.ctr || 0;
  const cpc     = +raw.cpc || 0;
  const impr    = +raw.impressions || 0;
  const freq    = +raw.frequency || 0;
  const cs      = +raw.creative_score || 0;
  const lps     = +raw.landing_page_score || 0;
  const vcr     = raw.video_completion_rate != null ? +raw.video_completion_rate : null;
  const cpa     = +raw.cpa || (conv > 0 ? spend / conv : 0);
  const status  = (raw.status || '').toLowerCase();
  const S = [];

  // KILL
  if (spend > 3 * targetCpa && conv === 0)
    S.push({ id:'capital_bleed',   label:'Capital Bleed',        cat:'kill',     weight:100, desc:`₹${spend.toLocaleString()} spend — ${(spend/targetCpa).toFixed(1)}× target CPA — with zero conversions.` });
  if (roas > 0 && roas < 1 && days >= 14)
    S.push({ id:'sustained_loss',  label:'Sustained Loss',       cat:'kill',     weight:95,  desc:`ROAS ${roas.toFixed(2)}× below break-even for ${days} days. Revenue ₹${revenue.toLocaleString()} vs spend ₹${spend.toLocaleString()}.` });
  if (cs < 3 && lps < 4)
    S.push({ id:'funnel_collapse', label:'Funnel Collapse',      cat:'kill',     weight:90,  desc:`Creative ${cs.toFixed(1)}/10 and LP ${lps.toFixed(1)}/10. Both asset layers failing — structural, not tactical.` });
  if (impr > 2_000_000 && ctr < 0.3 && conv === 0)
    S.push({ id:'invisible',       label:'Ad Invisible',         cat:'kill',     weight:85,  desc:`${(impr/1e6).toFixed(1)}M impressions at ${ctr}% CTR with zero conversions. Audience is tuning it out.` });
  if (roas > 0 && roas < 0.5 && conv > 0 && days >= 7)
    S.push({ id:'deep_loss',       label:'Deep Conversion Loss', cat:'kill',     weight:88,  desc:`Converting but ROAS ${roas.toFixed(2)}× — each ₹1 spent returns ${(roas*100).toFixed(0)}p. Cut losses.` });

  // SCALE
  if (cpa > 0 && cpa <= targetCpa && ctr > 2 && days >= 5 && conv > 0)
    S.push({ id:'proven',          label:'Proven Performer',     cat:'scale',    weight:100, desc:`CPA ₹${cpa.toFixed(0)} on target. CTR ${ctr}%. ${days}-day validated run.` });
  if (roas >= 10 && conv > 0 && cpa <= targetCpa * 1.5)
    S.push({ id:'roas_champ',      label:'ROAS Champion',        cat:'scale',    weight:95,  desc:`${roas.toFixed(1)}× return on spend. ₹${revenue.toLocaleString()} revenue from ₹${spend.toLocaleString()}.` });
  if (cs > 7 && lps > 7 && roas > 3 && conv > 0)
    S.push({ id:'full_funnel',     label:'Full Funnel Firing',   cat:'scale',    weight:85,  desc:`Creative ${cs.toFixed(1)}/10, LP ${lps.toFixed(1)}/10, ROAS ${roas.toFixed(1)}×. Every stage working.` });
  if (vcr !== null && vcr > 70 && conv > 0 && cpa <= targetCpa)
    S.push({ id:'video_power',     label:'Video Dominance',      cat:'scale',    weight:82,  desc:`${vcr}% video completion with CPA on target. Content is deeply engaging.` });

  // OPTIMIZE
  if (ctr > 3 && lps < 5)
    S.push({ id:'lp_leak',         label:'LP Conversion Leak',   cat:'optimize', weight:72,  desc:`${ctr}% CTR shows a working hook but LP score ${lps.toFixed(1)}/10 is killing the sale.` });
  if (cs < 4 && ctr < 1 && spend > targetCpa)
    S.push({ id:'weak_creative',   label:'Weak Creative',        cat:'optimize', weight:62,  desc:`Creative ${cs.toFixed(1)}/10 with ${ctr}% CTR. Asset is not resonating. Replace creative.` });
  if (vcr !== null && vcr < 25 && spend > 1000)
    S.push({ id:'video_dropoff',   label:'Video Drop-off',       cat:'optimize', weight:58,  desc:`${vcr}% completion. 75%+ of viewers leave early. Rework the hook.` });
  if (lps < 5 && conv > 0 && roas > 2)
    S.push({ id:'lp_upside',       label:'LP Upside Unclaimed',  cat:'optimize', weight:52,  desc:`Generating ₹${revenue.toLocaleString()} despite LP ${lps.toFixed(1)}/10. A better page unlocks more ROAS.` });
  if (impr > 500_000 && ctr < 0.8 && cs < 6)
    S.push({ id:'feed_blindness',  label:'Feed Blindness',       cat:'optimize', weight:55,  desc:`${(impr/1e6).toFixed(1)}M impressions at ${ctr}% CTR. Creative ${cs.toFixed(1)}/10 — not stopping the scroll.` });

  // PAUSE
  if (freq > 7)
    S.push({ id:'fatigue',          label:'Audience Fatigue',    cat:'pause',    weight:68,  desc:`Frequency ${freq.toFixed(1)}× — same people seeing this too often. Rest it or rotate creative.` });
  if (freq > 5 && cpa > targetCpa * 0.8 && cpa <= targetCpa)
    S.push({ id:'creep_fatigue',    label:'Creeping Fatigue',    cat:'pause',    weight:58,  desc:`Frequency ${freq.toFixed(1)}× approaching saturation. CPA on target now but expect degradation.` });

  // WATCH
  if (conv > 0 && cpa > 2 * targetCpa)
    S.push({ id:'expensive_conv',   label:'Expensive Conversions',cat:'warn',    weight:52,  desc:`CPA ₹${cpa.toFixed(0)} is ${(cpa/targetCpa).toFixed(1)}× target. Converting but cost is unsustainable.` });
  if (cpc > 10 && conv === 0)
    S.push({ id:'high_cpc_zero',    label:'High CPC, No Return', cat:'warn',     weight:48,  desc:`₹${cpc.toFixed(2)} per click with zero conversions. Click cost exceeds value delivered.` });
  if (cpc > 10 && conv > 0)
    S.push({ id:'high_cpc',         label:'High CPC',            cat:'warn',     weight:38,  desc:`₹${cpc.toFixed(2)} per click. Conversions present but margin is being compressed.` });
  if (roas > 0 && roas < 1 && days < 14)
    S.push({ id:'early_loss',       label:'Early Loss',          cat:'warn',     weight:45,  desc:`ROAS ${roas.toFixed(2)}× below break-even but only ${days} days. Watch closely.` });
  if (status === 'paused' && roas > 3 && cpa <= targetCpa)
    S.push({ id:'paused_winner',    label:'Paused Winner',       cat:'warn',     weight:42,  desc:`Paused — but ROAS ${roas.toFixed(1)}× with CPA on target. Why is this paused?` });

  // INFO
  if (days < 5)
    S.push({ id:'early_stage',      label:'Early Stage',         cat:'info',     weight:22,  desc:`Only ${days} day${days!==1?'s':''} of data — insufficient for a reliable verdict.` });
  if (cs > 7 && roas < 2 && conv > 0)
    S.push({ id:'creative_mis',     label:'Creative Mismatch',   cat:'info',     weight:18,  desc:`Strong creative ${cs.toFixed(1)}/10 but ROAS ${roas.toFixed(1)}×. Creative isn't the problem — check audience or LP.` });

  S.sort((a, b) => b.weight - a.weight);

  let action = 'Monitor';
  if (S.some(s => s.cat === 'kill'))    action = 'Kill';
  else if (S.some(s => s.cat === 'scale')) action = 'Scale';
  else if (S.some(s => s.id === 'fatigue' || s.id === 'creep_fatigue')) action = 'Pause';
  else if (S.some(s => s.cat === 'optimize')) action = 'Optimize';
  else if (S.some(s => s.cat === 'warn')) action = 'Watch';

  return { action, signals: S };
};

// ─── VISUAL CONSTANTS ─────────────────────────────────────────────────────────
const A = {
  Kill:     { color:'#FF453A', dim:'rgba(255,69,58,.12)',  muted:'rgba(255,69,58,.45)',  rowClass:'row-kill' },
  Scale:    { color:'#32D74B', dim:'rgba(50,215,75,.10)',  muted:'rgba(50,215,75,.45)',  rowClass:'row-scale' },
  Optimize: { color:'#FF9F0A', dim:'rgba(255,159,10,.12)', muted:'rgba(255,159,10,.45)', rowClass:'row-optimize' },
  Pause:    { color:'#8E8E93', dim:'rgba(142,142,147,.1)', muted:'rgba(142,142,147,.4)', rowClass:'row-pause' },
  Watch:    { color:'#BF5AF2', dim:'rgba(191,90,242,.10)', muted:'rgba(191,90,242,.45)', rowClass:'row-watch' },
  Monitor:  { color:'#48484A', dim:'rgba(72,72,74,.15)',   muted:'rgba(255,255,255,.2)', rowClass:'row-monitor' },
};
const CAT = {
  kill:     { color:'#FF453A', bg:'rgba(255,69,58,.1)' },
  scale:    { color:'#32D74B', bg:'rgba(50,215,75,.1)' },
  optimize: { color:'#FF9F0A', bg:'rgba(255,159,10,.1)' },
  pause:    { color:'#8E8E93', bg:'rgba(142,142,147,.1)' },
  warn:     { color:'#BF5AF2', bg:'rgba(191,90,242,.1)' },
  info:     { color:'rgba(255,255,255,.4)', bg:'rgba(255,255,255,.05)' },
};
const PLAT = { meta:'#1877F2', facebook:'#1877F2', instagram:'#E1306C', youtube:'#FF0000', google:'#34A853' };
const platColor = (p='') => { const k=p.toLowerCase(); for(const n in PLAT) if(k.includes(n)) return PLAT[n]; return '#636366'; };

const fmt = (n, pre='₹') => {
  if (n==null||isNaN(n)) return '—';
  if (n>=1e7) return `${pre}${(n/1e7).toFixed(2)}Cr`;
  if (n>=1e5) return `${pre}${(n/1e5).toFixed(2)}L`;
  if (n>=1e3) return `${pre}${(n/1e3).toFixed(1)}K`;
  return `${pre}${Math.round(n).toLocaleString()}`;
};
const fmtPct = n => isNaN(+n) ? '—' : `${(+n).toFixed(2)}%`;
const Sk = ({ w='100%', h=13 }) => <div className="shimmer-bg" style={{ width:w, height:h, borderRadius:4 }} />;

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [targetCpa,      setTargetCpa]      = useState(50);
  const [editingCpa,     setEditingCpa]     = useState(false);
  const [selectedAd,     setSelectedAd]     = useState(null);
  const [filterAction,   setFilterAction]   = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortKey,        setSortKey]        = useState('spend');
  const [sortDir,        setSortDir]        = useState(-1);

  const page1      = useQuery({ queryKey:['ads',1], queryFn:()=>fetchPage(1) });
  const totalPages = page1.data?.pagination?.total_pages || 1;

  const restQ = useQueries({
    queries: Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      queryKey: ['ads', i + 2],
      queryFn:  () => fetchPage(i + 2),
      enabled:  page1.isSuccess && totalPages > 1,
    })),
  });

  const pagesLoaded = 1 + restQ.filter(q => q.isSuccess).length;
  const isFetching  = page1.isSuccess && pagesLoaded < totalPages;

  const allRaw = useMemo(() => {
    const rows = [];
    if (page1.data?.data) rows.push(...page1.data.data);
    restQ.forEach(q => { if (q.data?.data) rows.push(...q.data.data); });
    return rows;
  }, [page1.data, restQ]);

  const { ads, metrics, platforms } = useMemo(() => {
    if (!allRaw.length) return { ads:[], metrics:null, platforms:[] };

    const processed = allRaw.map(raw => {
      const spend = +raw.spend||0, revenue=+raw.revenue||0, conv=+raw.conversions||0;
      const roas  = +raw.roas||0,  cpa=(+raw.cpa)||(conv>0?spend/conv:0);
      const { action, signals } = analyzeAd(raw, targetCpa);
      return {
        ...raw, spend, revenue, conv, roas, cpa,
        ctr: +raw.ctr||0, cpc: +raw.cpc||0,
        impressions:+raw.impressions||0, clicks:+raw.clicks||0,
        days:+raw.days_running||0, frequency:+raw.frequency||0,
        creative_score:+raw.creative_score||0, landing_page_score:+raw.landing_page_score||0,
        vcr: raw.video_completion_rate!=null ? +raw.video_completion_rate : null,
        action, signals,
      };
    });

    const kills  = processed.filter(a=>a.action==='Kill');
    const scales = processed.filter(a=>a.action==='Scale');
    const optims = processed.filter(a=>a.action==='Optimize');
    const totalSpend   = processed.reduce((s,a)=>s+a.spend,0);
    const totalRevenue = processed.reduce((s,a)=>s+a.revenue,0);
    const wasted       = kills.reduce((s,a)=>s+a.spend,0);
    const pSet = new Set(processed.map(a=>a.platform).filter(Boolean));

    return {
      ads: processed,
      metrics: {
        total:processed.length, totalSpend, totalRevenue, wasted,
        overallRoas: totalSpend>0 ? totalRevenue/totalSpend : 0,
        killCount:kills.length, scaleCount:scales.length, optimCount:optims.length,
        wasteRatio: totalSpend>0 ? wasted/totalSpend : 0,
      },
      platforms: Array.from(pSet).sort(),
    };
  }, [allRaw, targetCpa]);

  const displayed = useMemo(() => {
    let list = [...ads];
    if (filterAction   !== 'all') list = list.filter(a=>a.action===filterAction);
    if (filterPlatform !== 'all') list = list.filter(a=>a.platform===filterPlatform);
    const ORD = { Kill:0,Scale:1,Optimize:2,Watch:3,Pause:4,Monitor:5 };
    list.sort((a,b) => {
      if (filterAction === 'all') {
        const d = (ORD[a.action]??5) - (ORD[b.action]??5);
        if (d !== 0) return d;
      }
      return ((b[sortKey]??0) - (a[sortKey]??0)) * sortDir;
    });
    return list;
  }, [ads, filterAction, filterPlatform, sortKey, sortDir]);

  const handleSort = k => { if (sortKey===k) setSortDir(d=>d*-1); else { setSortKey(k); setSortDir(-1); } };
  const SC = ({ k }) => sortKey===k ? (sortDir===-1 ? <ChevronDown size={10} style={{display:'inline',marginLeft:2,opacity:.6}}/> : <ChevronUp size={10} style={{display:'inline',marginLeft:2,opacity:.6}}/>) : null;

  return (
    <div className="f-body" style={{ minHeight:'100vh', background:'#080806', color:'rgba(255,255,255,.85)' }}>
      <Fonts />

      {/* Progress bar */}
      {isFetching && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:2, zIndex:100 }}>
          <div style={{ height:'100%', background:'rgba(255,159,10,.7)', width:`${(pagesLoaded/totalPages)*100}%`, transition:'width .4s ease', borderRadius:'0 1px 1px 0' }} />
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,.06)', padding:'18px 40px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:18 }}>
          <h1 className="f-display" style={{ fontSize:21, fontWeight:400, letterSpacing:'-.02em', color:'rgba(255,255,255,.88)' }}>
            Ad Intelligence
          </h1>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.2)', fontWeight:300 }}>
            {metrics?.total.toLocaleString()||'—'} ads
            {isFetching && <span style={{ color:'rgba(255,159,10,.6)', marginLeft:8 }}>fetching {pagesLoaded}/{totalPages}…</span>}
          </span>
        </div>
        {/* Editable CPA target */}
        <div onClick={()=>setEditingCpa(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 14px', border:'1px solid rgba(255,255,255,.07)', borderRadius:8, cursor:'text', background:'rgba(255,255,255,.025)' }}>
          <Target size={12} style={{ color:'rgba(255,255,255,.28)' }} />
          <span style={{ fontSize:11, color:'rgba(255,255,255,.28)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:500 }}>Target CPA</span>
          {editingCpa ? (
            <input type="number" value={targetCpa} autoFocus
              onChange={e=>setTargetCpa(Math.max(1,+e.target.value))}
              onBlur={()=>setEditingCpa(false)}
              style={{ width:60, background:'transparent', border:'none', outline:'none', color:'rgba(255,255,255,.8)', fontSize:13, fontWeight:500, textAlign:'right', fontFamily:'inherit' }} />
          ) : (
            <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,.78)' }}>₹{targetCpa}</span>
          )}
        </div>
      </div>

      {/* ── HERO METRICS ── */}
      <div style={{ padding:'44px 40px 36px', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        {page1.isLoading ? (
          <div style={{ display:'flex', gap:20, flexDirection:'column' }}>
            <Sk w={220} h={60} />
            <div style={{ display:'flex', gap:24 }}>{Array.from({length:5}).map((_,i)=><Sk key={i} w={100} h={36}/>)}</div>
          </div>
        ) : metrics ? (
          <>
            {/* The big number */}
            <div className="anim-up" style={{ display:'flex', alignItems:'flex-end', gap:40, marginBottom:32, flexWrap:'wrap' }}>
              <div>
                <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.14em', color:'rgba(255,255,255,.25)', fontWeight:500, marginBottom:10 }}>
                  Capital at risk
                </p>
                <div className="f-display" style={{ fontSize:60, fontWeight:300, lineHeight:1, color:'#FF453A', letterSpacing:'-.03em' }}>
                  {fmt(metrics.wasted)}
                </div>
                <p style={{ fontSize:12, color:'rgba(255,69,58,.45)', marginTop:7, fontWeight:300 }}>
                  {metrics.killCount} ads to terminate &nbsp;·&nbsp; {(metrics.wasteRatio*100).toFixed(1)}% of total spend
                </p>
              </div>
              {/* Waste ratio bar */}
              <div style={{ flex:'1 1 160px', maxWidth:200, paddingBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.22)', textTransform:'uppercase', letterSpacing:'.08em' }}>Waste ratio</span>
                  <span style={{ fontSize:10, color:'rgba(255,69,58,.6)' }}>{(metrics.wasteRatio*100).toFixed(1)}%</span>
                </div>
                <div style={{ height:2, background:'rgba(255,255,255,.07)', borderRadius:1, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${metrics.wasteRatio*100}%`, background:'#FF453A', borderRadius:1, transition:'width .9s cubic-bezier(.22,.68,0,1.2)' }} />
                </div>
              </div>
            </div>

            {/* Secondary strip */}
            <div style={{ display:'flex', gap:0, flexWrap:'wrap' }}>
              {[
                { label:'Total spend',   val:fmt(metrics.totalSpend),                   clr:'rgba(255,255,255,.75)' },
                { label:'Total revenue', val:fmt(metrics.totalRevenue),                  clr:'rgba(255,255,255,.75)' },
                { label:'Overall ROAS',  val:`${metrics.overallRoas.toFixed(2)}×`,       clr:metrics.overallRoas>=2?'#32D74B':metrics.overallRoas<1?'#FF453A':'rgba(255,255,255,.78)' },
                { label:'Scale now',     val:metrics.scaleCount,                         clr:'#32D74B' },
                { label:'Optimize',      val:metrics.optimCount,                         clr:'#FF9F0A' },
              ].map(({ label, val, clr }, i) => (
                <div key={label} className="anim-up"
                  style={{ animationDelay:`${i*45}ms`, paddingRight:28, borderRight:'1px solid rgba(255,255,255,.06)', marginRight:28, marginBottom:8 }}>
                  <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,.24)', fontWeight:500, marginBottom:5 }}>{label}</p>
                  <p className="f-display" style={{ fontSize:26, fontWeight:300, lineHeight:1, color:clr, letterSpacing:'-.02em', fontVariantNumeric:'tabular-nums' }}>{val}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ padding:'14px 40px', borderBottom:'1px solid rgba(255,255,255,.05)', display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
        {['all','Kill','Scale','Optimize','Watch','Pause','Monitor'].map(f => {
          const active = filterAction === f;
          const cfg    = A[f];
          const count  = f !== 'all' ? ads.filter(a=>a.action===f).length : ads.length;
          return (
            <button key={f} onClick={()=>setFilterAction(f)} className="filter-pill"
              style={{
                padding:'5px 13px', borderRadius:100, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit',
                background: active ? (cfg?cfg.dim:'rgba(255,255,255,.1)') : 'rgba(255,255,255,.04)',
                color:      active ? (cfg?cfg.color:'rgba(255,255,255,.88)') : 'rgba(255,255,255,.35)',
                borderColor:active ? (cfg?cfg.muted:'rgba(255,255,255,.2)') : 'transparent',
              }}>
              {f==='all'?'All':f}
              <span style={{ marginLeft:5, opacity:.5, fontSize:10 }}>{count}</span>
            </button>
          );
        })}
        {platforms.length > 0 && <div style={{ width:1, height:14, background:'rgba(255,255,255,.07)', margin:'0 4px' }} />}
        {platforms.map(p => {
          const active = filterPlatform === p;
          const c = platColor(p);
          return (
            <button key={p} onClick={()=>setFilterPlatform(active?'all':p)} className="filter-pill"
              style={{
                padding:'5px 13px', borderRadius:100, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit',
                background:  active ? `${c}1A` : 'rgba(255,255,255,.04)',
                color:       active ? c : 'rgba(255,255,255,.3)',
                borderColor: active ? `${c}55` : 'transparent',
              }}>
              <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:c, marginRight:6, verticalAlign:'middle' }} />
              {p}
            </button>
          );
        })}
        <span style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,.18)' }}>{displayed.length} shown</span>
      </div>

      {/* ── TABLE ── */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:860 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(255,255,255,.06)' }}>
              {[
                { label:'Action',    key:null,        w:80  },
                { label:'Brand',     key:null,        w:null },
                { label:'Spend',     key:'spend',     w:105 },
                { label:'Revenue',   key:'revenue',   w:115 },
                { label:'ROAS',      key:'roas',      w:80  },
                { label:'CPA',       key:'cpa',       w:95  },
                { label:'CTR',       key:'ctr',       w:72  },
                { label:'Conv.',     key:'conv',      w:72  },
                { label:'Days',      key:'days',      w:60  },
                { label:'Signals',   key:null,        w:170 },
              ].map(({ label, key, w }) => (
                <th key={label} onClick={()=>key&&handleSort(key)}
                  style={{ padding:'10px 16px', textAlign:'left', fontSize:9, fontWeight:500, textTransform:'uppercase',
                    letterSpacing:'.12em', color:'rgba(255,255,255,.22)', cursor:key?'pointer':'default',
                    userSelect:'none', whiteSpace:'nowrap', width:w||undefined }}>
                  {label}<SC k={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page1.isLoading ? (
              Array.from({length:14}).map((_,i) => (
                <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.03)' }}>
                  {Array.from({length:10}).map((_,j) => (
                    <td key={j} style={{ padding:'13px 16px' }}>
                      <Sk w={j===1?110:55} h={11} />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayed.map((ad, i) => {
              const cfg    = A[ad.action] || A.Monitor;
              const topSig = ad.signals[0];
              const nKill  = ad.signals.filter(s=>s.cat==='kill').length;
              const nScale = ad.signals.filter(s=>s.cat==='scale').length;
              return (
                <tr key={ad.ad_id||i} onClick={()=>setSelectedAd(ad)}
                  className={`row-base ${cfg.rowClass} anim-up`}
                  style={{ borderBottom:'1px solid rgba(255,255,255,.035)', animationDelay:`${Math.min(i*16,280)}ms` }}>

                  {/* Action */}
                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ fontSize:11, fontWeight:500, color:cfg.color, letterSpacing:'.03em' }}>
                      {ad.action}
                    </span>
                  </td>

                  {/* Brand */}
                  <td style={{ padding:'13px 16px' }}>
                    <div className="f-display" style={{ fontSize:16, fontWeight:400, fontStyle:'italic', color:'rgba(255,255,255,.82)', lineHeight:1.2 }}>
                      {ad.brand || ad.ad_id}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.25)', marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ display:'inline-block', width:4, height:4, borderRadius:'50%', background:platColor(ad.platform), flexShrink:0 }} />
                      {ad.platform} · {ad.category} · {ad.ad_type}
                    </div>
                  </td>

                  {/* Spend */}
                  <td style={{ padding:'13px 16px', fontSize:12, color:'rgba(255,255,255,.58)', fontVariantNumeric:'tabular-nums' }}>
                    {fmt(ad.spend)}
                  </td>

                  {/* Revenue */}
                  <td style={{ padding:'13px 16px', fontSize:12, color:'rgba(255,255,255,.45)', fontVariantNumeric:'tabular-nums' }}>
                    {fmt(ad.revenue)}
                  </td>

                  {/* ROAS — editorial size */}
                  <td style={{ padding:'13px 16px' }}>
                    <span className="f-display" style={{
                      fontSize:17, fontWeight:400, lineHeight:1, fontVariantNumeric:'tabular-nums',
                      color: ad.roas>=2?'#32D74B':ad.roas>0&&ad.roas<1?'#FF453A':'rgba(255,255,255,.68)'
                    }}>
                      {ad.roas.toFixed(2)}×
                    </span>
                  </td>

                  {/* CPA */}
                  <td style={{ padding:'13px 16px', fontSize:12, fontVariantNumeric:'tabular-nums', color:ad.cpa<=targetCpa?'rgba(50,215,75,.75)':'rgba(255,69,58,.75)' }}>
                    {fmt(ad.cpa)}
                  </td>

                  {/* CTR */}
                  <td style={{ padding:'13px 16px', fontSize:12, color:'rgba(255,255,255,.38)', fontVariantNumeric:'tabular-nums' }}>
                    {fmtPct(ad.ctr)}
                  </td>

                  {/* Conv */}
                  <td style={{ padding:'13px 16px', fontSize:12, color:'rgba(255,255,255,.4)', fontVariantNumeric:'tabular-nums' }}>
                    {ad.conv.toLocaleString()}
                  </td>

                  {/* Days */}
                  <td style={{ padding:'13px 16px', fontSize:11, color:'rgba(255,255,255,.26)' }}>
                    {ad.days}d
                  </td>

                  {/* Signals */}
                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {nKill>0 && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(255,69,58,.12)', color:'#FF453A', fontWeight:500 }}>{nKill} kill</span>}
                      {nScale>0 && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(50,215,75,.1)', color:'#32D74B', fontWeight:500 }}>{nScale} scale</span>}
                      {topSig && !['kill','scale'].includes(topSig.cat) && (
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:CAT[topSig.cat]?.bg, color:CAT[topSig.cat]?.color, opacity:.82 }}>
                          {topSig.label}
                        </span>
                      )}
                      {ad.signals.length > (nKill+nScale+(topSig&&!['kill','scale'].includes(topSig.cat)?1:0)) && (
                        <span style={{ fontSize:10, color:'rgba(255,255,255,.18)', padding:'2px 3px' }}>
                          +{ad.signals.length-(nKill+nScale+(topSig&&!['kill','scale'].includes(topSig.cat)?1:0))}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!page1.isLoading && displayed.length === 0 && (
          <div style={{ padding:'80px 40px', textAlign:'center', color:'rgba(255,255,255,.18)', fontSize:14 }}>
            No ads match the current filter.
          </div>
        )}
      </div>

      {/* ── DOSSIER PANEL ── */}
      {selectedAd && (() => {
        const cfg = A[selectedAd.action] || A.Monitor;
        return (
          <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', justifyContent:'flex-end' }}>
            <div onClick={()=>setSelectedAd(null)} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)' }} />
            <div className="anim-slide f-body" style={{ position:'relative', width:'100%', maxWidth:460, background:'#0C0C0A', borderLeft:'1px solid rgba(255,255,255,.07)', height:'100%', overflowY:'auto', display:'flex', flexDirection:'column' }}>

              {/* Dossier top */}
              <div style={{ padding:'22px 26px 18px', borderBottom:'1px solid rgba(255,255,255,.06)', position:'sticky', top:0, background:'#0C0C0A', zIndex:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.14em', color:'rgba(255,255,255,.22)', display:'block', marginBottom:7 }}>
                      Intelligence Brief
                    </span>
                    <h2 className="f-display" style={{ fontSize:28, fontWeight:400, fontStyle:'italic', color:'rgba(255,255,255,.88)', lineHeight:1.2, letterSpacing:'-.01em' }}>
                      {selectedAd.brand || selectedAd.ad_id}
                    </h2>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,.28)', marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:platColor(selectedAd.platform) }} />
                      {selectedAd.platform} · {selectedAd.ad_type} · {selectedAd.category}
                    </p>
                  </div>
                  <button onClick={()=>setSelectedAd(null)}
                    style={{ background:'rgba(255,255,255,.06)', border:'none', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,.45)', flexShrink:0, marginTop:2 }}>
                    <X size={15} />
                  </button>
                </div>
                {/* Action verdict */}
                <div style={{ marginTop:14, padding:'10px 14px', borderRadius:8, background:cfg.dim, borderLeft:`3px solid ${cfg.color}` }}>
                  <span style={{ fontSize:10, fontWeight:600, color:cfg.color, textTransform:'uppercase', letterSpacing:'.08em' }}>{selectedAd.action}</span>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:3, lineHeight:1.55 }}>
                    {selectedAd.signals[0]?.desc || 'No dominant signal. Performance within normal range.'}
                  </p>
                </div>
              </div>

              <div style={{ padding:'22px 26px', flex:1 }}>
                {/* Key metrics grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:22 }}>
                  {[
                    { l:'Spend',    v:fmt(selectedAd.spend) },
                    { l:'Revenue',  v:fmt(selectedAd.revenue) },
                    { l:'ROAS',     v:`${selectedAd.roas.toFixed(2)}×`, c:selectedAd.roas>=2?'#32D74B':selectedAd.roas>0&&selectedAd.roas<1?'#FF453A':'rgba(255,255,255,.8)' },
                    { l:'CPA',      v:fmt(selectedAd.cpa), c:selectedAd.cpa<=targetCpa?'rgba(50,215,75,.8)':'rgba(255,69,58,.8)' },
                    { l:'CTR',      v:fmtPct(selectedAd.ctr) },
                    { l:'Conv.',    v:selectedAd.conv.toLocaleString() },
                    { l:'Creative', v:`${selectedAd.creative_score.toFixed(1)}/10`, c:selectedAd.creative_score>=7?'#32D74B':selectedAd.creative_score<4?'#FF453A':'rgba(255,255,255,.75)' },
                    { l:'LP score', v:`${selectedAd.landing_page_score.toFixed(1)}/10`, c:selectedAd.landing_page_score>=7?'#32D74B':selectedAd.landing_page_score<4?'#FF453A':'rgba(255,255,255,.75)' },
                    { l:'Freq.',    v:`${selectedAd.frequency.toFixed(1)}×`, c:selectedAd.frequency>7?'#FF453A':'rgba(255,255,255,.72)' },
                  ].map(({ l, v, c='rgba(255,255,255,.72)' }) => (
                    <div key={l} style={{ padding:'9px 11px', border:'1px solid rgba(255,255,255,.06)', borderRadius:7, background:'rgba(255,255,255,.02)' }}>
                      <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', color:'rgba(255,255,255,.25)', fontWeight:500, marginBottom:4 }}>{l}</p>
                      <p className="f-display" style={{ fontSize:18, fontWeight:300, lineHeight:1, color:c, fontVariantNumeric:'tabular-nums' }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div style={{ marginBottom:22 }}>
                  {[
                    ['Audience',    selectedAd.target_audience],
                    ['Theme',       selectedAd.creative_theme],
                    ['Status',      selectedAd.status],
                    ['Ad type',     selectedAd.ad_type],
                    ['Days live',   `${selectedAd.days}d (since ${selectedAd.start_date})`],
                    ['CPC',         fmt(selectedAd.cpc)],
                    ['Impressions', (+selectedAd.impressions||0).toLocaleString()],
                    ['Clicks',      (+selectedAd.clicks||0).toLocaleString()],
                    ['Video compl.',selectedAd.vcr!=null?`${selectedAd.vcr}%`:'N/A'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,.25)' }}>{label}</span>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,.6)', fontWeight:400 }}>{value||'—'}</span>
                    </div>
                  ))}
                </div>

                {/* Signals */}
                <div>
                  <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.12em', color:'rgba(255,255,255,.22)', fontWeight:500, marginBottom:10 }}>
                    {selectedAd.signals.length} signal{selectedAd.signals.length!==1?'s':''} detected
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {selectedAd.signals.length === 0 ? (
                      <p style={{ fontSize:13, color:'rgba(255,255,255,.22)', fontStyle:'italic', fontFamily:"'Cormorant Garamond', serif" }}>
                        No active signals — performance within normal range.
                      </p>
                    ) : selectedAd.signals.map(sig => {
                      const sc = CAT[sig.cat] || CAT.info;
                      return (
                        <div key={sig.id} style={{ padding:'10px 13px', borderRadius:7, background:sc.bg, borderLeft:`2px solid ${sc.color}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                            <span style={{ fontSize:10, fontWeight:600, color:sc.color, letterSpacing:'.04em' }}>{sig.label}</span>
                            <span style={{ fontSize:9, color:'rgba(255,255,255,.18)', textTransform:'uppercase', letterSpacing:'.08em' }}>{sig.cat}</span>
                          </div>
                          <p style={{ fontSize:12, color:'rgba(255,255,255,.46)', lineHeight:1.55 }}>{sig.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
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