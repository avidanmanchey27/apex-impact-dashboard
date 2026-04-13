import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown } from 'lucide-react';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 300_000, retry: 1 } } });

const API = 'https://mosaicfellowship.in/api/data/content/ads';
const fetchPage = async (p) => {
  const r = await fetch(`${API}?page=${p}&limit=100`);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Geist:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F3EEE5; }
    .fd { font-family: 'Cormorant Garamond', Georgia, serif; }
    .fb { font-family: 'Geist', system-ui, sans-serif; }

    @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
    @keyframes slideIn { from { opacity:0; transform:translateX(36px) } to { opacity:1; transform:translateX(0) } }
    @keyframes shimmer { 0%{ background-position:-400px 0 } 100%{ background-position:400px 0 } }

    .au { animation: fadeUp  .4s cubic-bezier(.22,.68,0,1.2) both }
    .as { animation: slideIn .32s cubic-bezier(.22,.68,0,1.2) both }

    .skel {
      background: linear-gradient(90deg, rgba(0,0,0,.04) 0%, rgba(0,0,0,.08) 50%, rgba(0,0,0,.04) 100%);
      background-size: 400px 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .row {
      border-left: 2px solid transparent;
      transition: border-color .14s, background .14s;
      cursor: pointer;
    }
    .row:hover               { background: rgba(0,0,0,.025); }
    .rk:hover { border-left-color:#B91C1C; background:rgba(185,28,28,.035); }
    .rs:hover { border-left-color:#166534; background:rgba(22,101,52,.03); }
    .ru:hover { border-left-color:#92400E; background:rgba(146,64,14,.03); }
    .ro:hover { border-left-color:#B45309; background:rgba(180,83,9,.03); }
    .rw:hover { border-left-color:#6D28D9; background:rgba(109,40,217,.025); }
    .rp:hover { border-left-color:#9CA3AF; }
    .rm:hover { border-left-color:#D1C9BE; }

    .fp { transition: all .13s; }
    .fp:hover { background: rgba(0,0,0,.05) !important; }

    ::-webkit-scrollbar       { width:5px }
    ::-webkit-scrollbar-track { background:transparent }
    ::-webkit-scrollbar-thumb { background:rgba(0,0,0,.12); border-radius:5px }
  `}</style>
);

// ─── THE MARKETING BRAIN ──────────────────────────────────────────────────────
//
// Mental model:
//   1. Is this ad EARNING its place? → Scale
//   2. Is it earning but leaving money on table due to weak creative/LP? → Upgrade
//   3. Is it provably destroying capital with zero hope? → Kill (high bar)
//   4. Is it broken in a specific, fixable way? → Optimize
//   5. Is the audience tired of it? → Pause
//   6. Is it shaky but converting? → Watch
//   7. Too early or nothing wrong → Monitor
//
// KILL is reserved. An ad generating ANY meaningful revenue is not a kill —
// it's a problem to fix. Kill = money leaving with zero signal of return.
//
const analyzeAd = (raw, tCpa) => {
  const spend  = +raw.spend   || 0;
  const conv   = +raw.conversions || 0;
  const rev    = +raw.revenue || 0;
  const roas   = +raw.roas    || 0;
  const days   = +raw.days_running || 0;
  const ctr    = +raw.ctr     || 0;
  const cpc    = +raw.cpc     || 0;
  const impr   = +raw.impressions || 0;
  const freq   = +raw.frequency || 0;
  const cs     = +raw.creative_score || 0;
  const lps    = +raw.landing_page_score || 0;
  const vcr    = raw.video_completion_rate != null ? +raw.video_completion_rate : null;
  const cpa    = +raw.cpa || (conv > 0 ? spend / conv : 0);
  const status = (raw.status || '').toLowerCase();
  const S      = [];

  // ── KILL: Only when there is truly no hope left ──────────────────────────
  // Classic drain: significant spend, no proof of life, enough time to know
  if (spend > 3 * tCpa && conv === 0 && days >= 5)
    S.push({ id:'drain',       label:'Budget Drain',        cat:'kill', weight:100,
      desc:`₹${spend.toLocaleString()} spent over ${days} days — ${(spend/tCpa).toFixed(1)}× target CPA — with zero conversions. No signal of intent whatsoever.` });

  // Revenue is negative territory AND has had enough run to prove it will stay that way
  if (roas > 0 && roas < 0.4 && days >= 21)
    S.push({ id:'deep_ruin',   label:'Confirmed Loss',      cat:'kill', weight:96,
      desc:`ROAS ${roas.toFixed(2)}× — returning less than 40 paise per rupee spent. ${days} days of data confirms this is structural, not a warm-up dip.` });

  // Invisible at scale — shown to millions, not a single conversion
  if (impr > 3_000_000 && ctr < 0.2 && conv === 0 && days >= 7)
    S.push({ id:'ghost',       label:'Ghost Ad',             cat:'kill', weight:90,
      desc:`${(impr/1e6).toFixed(1)}M impressions, ${ctr}% CTR, zero conversions across ${days} days. The audience has voted with their thumbs.` });

  // Complete structural failure: creative AND LP are both in the floor
  // BUT only kill if there's also no revenue — if it's making money despite bad scores, upgrade instead
  if (cs < 2.5 && lps < 3 && conv === 0 && spend > tCpa)
    S.push({ id:'structural',  label:'Structural Failure',  cat:'kill', weight:88,
      desc:`Creative ${cs.toFixed(1)}/10, LP ${lps.toFixed(1)}/10, zero conversions. Both ends of the funnel are rejecting this — there is nothing to salvage in its current form.` });

  // ── UPGRADE: Making money but creative/LP is holding it back ────────────
  // This is the most important insight: an ad EARNING despite poor assets
  // means upgrading those assets could multiply returns dramatically.
  if (conv > 0 && rev > 0 && cs < 5 && roas > 1.5)
    S.push({ id:'creative_ceiling', label:'Creative Ceiling',  cat:'upgrade', weight:95,
      desc:`Generating ₹${fmt(rev)} revenue at ${roas.toFixed(1)}× ROAS despite creative score ${cs.toFixed(1)}/10. This ad is working harder than it should have to. Upgrade the creative and watch ROAS climb.` });

  if (conv > 0 && rev > 0 && lps < 4.5 && roas > 1.5)
    S.push({ id:'lp_ceiling',       label:'Landing Page Ceiling', cat:'upgrade', weight:90,
      desc:`LP score ${lps.toFixed(1)}/10 is suppressing conversions on an ad that's clearly resonating (${roas.toFixed(1)}× ROAS). A better landing experience could halve the CPA.` });

  // Good creative but weak LP — clicks are being bought but not converted
  if (cs > 6 && lps < 4 && ctr > 2 && conv > 0)
    S.push({ id:'lp_drag',          label:'LP Drag',              cat:'upgrade', weight:82,
      desc:`Creative ${cs.toFixed(1)}/10 is driving ${ctr}% CTR, but LP ${lps.toFixed(1)}/10 is squandering those clicks. Fix the page and the creative investment pays off more.` });

  // Strong creative, weak results — creative score high but something in the chain is off
  if (cs > 7.5 && roas < 2 && conv > 0 && lps < 5)
    S.push({ id:'creative_wasted',  label:'Creative Wasted on Bad LP', cat:'upgrade', weight:78,
      desc:`Creative ${cs.toFixed(1)}/10 is doing its job — but LP ${lps.toFixed(1)}/10 is wasting that quality traffic. Align the page with the ad's promise.` });

  // Converting well but video is cutting off — fix hook to extend reach
  if (vcr !== null && vcr < 30 && conv > 0 && cs < 6)
    S.push({ id:'video_unlock',     label:'Video Hook Upgrade',   cat:'upgrade', weight:72,
      desc:`${vcr}% video completion. Most viewers leave before the message lands. Compress the value proposition into the first 3 seconds — this ad's fundamentals are sound.` });

  // ── SCALE: Proven, working, expand budget ────────────────────────────────
  if (cpa > 0 && cpa <= tCpa && ctr > 2 && days >= 5 && conv > 0)
    S.push({ id:'proven',      label:'Proven Performer',    cat:'scale', weight:100,
      desc:`CPA ₹${cpa.toFixed(0)} on target. CTR ${ctr}%. ${days}-day validated run with consistent conversions. Ready for budget expansion.` });

  if (roas >= 10 && conv > 0)
    S.push({ id:'roas_champ',  label:'ROAS Champion',       cat:'scale', weight:96,
      desc:`${roas.toFixed(1)}× return. ₹${fmt(rev)} from ₹${fmt(spend)}. This is a rare performer — push budget aggressively before auction dynamics shift.` });

  if (cs > 7 && lps > 7 && roas > 3 && conv > 0)
    S.push({ id:'full_funnel', label:'Full Funnel Firing',  cat:'scale', weight:88,
      desc:`Creative ${cs.toFixed(1)}/10, LP ${lps.toFixed(1)}/10, ROAS ${roas.toFixed(1)}×. Every stage of the funnel is working. Scale now.` });

  if (vcr !== null && vcr > 70 && conv > 0 && cpa <= tCpa * 1.2)
    S.push({ id:'vid_scale',   label:'Video Performer',     cat:'scale', weight:82,
      desc:`${vcr}% video completion rate with CPA near target. High engagement signals strong audience-message fit.` });

  // ── OPTIMIZE: Specific, addressable technical problems ──────────────────
  // Hook working, site failing — precise LP fix
  if (ctr > 3 && lps < 5 && conv === 0)
    S.push({ id:'lp_zero',     label:'LP Blocking Conversions', cat:'optimize', weight:75,
      desc:`${ctr}% CTR proves the ad is stopping the scroll — but LP ${lps.toFixed(1)}/10 is converting zero. The creative is working. Fix the page.` });

  // Weak creative with enough spend to diagnose
  if (cs < 3.5 && ctr < 0.8 && spend > tCpa && conv === 0)
    S.push({ id:'dead_creative', label:'Creative Not Landing', cat:'optimize', weight:65,
      desc:`Creative ${cs.toFixed(1)}/10 with ${ctr}% CTR. The ad is not breaking through the feed. A new creative test should be the first intervention.` });

  // Impressions scaling but CTR dying — content-audience mismatch at scale
  if (impr > 800_000 && ctr < 0.6 && cs < 6 && conv === 0)
    S.push({ id:'mismatch',    label:'Audience Mismatch',   cat:'optimize', weight:60,
      desc:`${(impr/1e6).toFixed(1)}M impressions at ${ctr}% CTR. The creative isn't speaking to this audience. Test new targeting or creative angle.` });

  // Video dropping off — hook problem, not content problem
  if (vcr !== null && vcr < 20 && spend > 500 && conv === 0)
    S.push({ id:'hook_fail',   label:'Hook Failing',        cat:'optimize', weight:55,
      desc:`${vcr}% video completion — viewers are leaving in the first seconds. Rework the opening 3 seconds entirely. The rest may be fine.` });

  // ── PAUSE: Audience has seen it too much ─────────────────────────────────
  if (freq > 8)
    S.push({ id:'saturated',   label:'Audience Saturated',  cat:'pause', weight:72,
      desc:`Frequency ${freq.toFixed(1)}× — the same users are being shown this ad far too often. Diminishing returns have set in. Pull back, refresh creative, return in 2 weeks.` });

  if (freq > 5.5 && cpa > tCpa * 0.85)
    S.push({ id:'fatigue',     label:'Fatigue Setting In',  cat:'pause', weight:58,
      desc:`Frequency ${freq.toFixed(1)}× and CPA ${fmt(cpa)} approaching ceiling. Performance will degrade as audience tires. Rotate before it drops.` });

  // ── WATCH: Converting but at a cost that needs monitoring ───────────────
  if (conv > 0 && cpa > 1.8 * tCpa && days >= 7)
    S.push({ id:'costly',      label:'Costly Conversions',  cat:'watch', weight:55,
      desc:`CPA ₹${cpa.toFixed(0)} is ${(cpa/tCpa).toFixed(1)}× target. Converting, but the economics don't hold. Watch trend: if CPA doesn't fall in 7 days, move to Optimize.` });

  if (cpc > 12 && conv > 0)
    S.push({ id:'cpc_margin',  label:'Click Cost Eating Margin', cat:'watch', weight:45,
      desc:`₹${cpc.toFixed(2)} per click. Conversions are happening but high click cost is compressing margin. Monitor CPA trend.` });

  // ROAS below break-even but early — give it time
  if (roas > 0 && roas < 1 && days < 14 && conv > 0)
    S.push({ id:'early_struggle', label:'Early Stage Struggle', cat:'watch', weight:42,
      desc:`ROAS ${roas.toFixed(2)}× below break-even, but only ${days} days in with ${conv} conversions. Many ads dip early as the algorithm learns. Watch 7 more days.` });

  if (status === 'paused' && roas > 2 && cpa <= tCpa * 1.3)
    S.push({ id:'paused_win',  label:'Paused With Potential', cat:'watch', weight:38,
      desc:`Status: Paused — but underlying ROAS is ${roas.toFixed(1)}× with near-target CPA. Understand why this was paused before leaving it dormant.` });

  // ── INFO: Context signals, not actionable alone ──────────────────────────
  if (days < 4)
    S.push({ id:'newborn',     label:'Too Early to Judge',  cat:'info', weight:20,
      desc:`${days} day${days!==1?'s':''} of data. Give it at least 5 days and ₹${(tCpa*3).toLocaleString()} in spend before drawing conclusions.` });

  if (cs > 8 && roas < 2 && conv > 0 && lps > 7)
    S.push({ id:'mystery',     label:'High Quality, Low Return', cat:'info', weight:15,
      desc:`Creative ${cs.toFixed(1)}/10 and LP ${lps.toFixed(1)}/10 are both strong. ROAS ${roas.toFixed(1)}× suggests the audience targeting may be the weak link.` });

  S.sort((a, b) => b.weight - a.weight);

  // Determine verdict — Upgrade takes priority over Optimize when there's revenue
  let action = 'Monitor';
  const hasCat = (c) => S.some(s => s.cat === c);

  if (hasCat('kill'))         action = 'Kill';
  else if (hasCat('scale'))   action = 'Scale';
  else if (hasCat('upgrade')) action = 'Upgrade';
  else if (S.some(s => s.id === 'saturated' || s.id === 'fatigue')) action = 'Pause';
  else if (hasCat('optimize')) action = 'Optimize';
  else if (hasCat('watch'))   action = 'Watch';

  return { action, signals: S };
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n, pre='₹') => {
  if (n==null||isNaN(n)) return '—';
  if (n>=1e7) return `${pre}${(n/1e7).toFixed(2)}Cr`;
  if (n>=1e5) return `${pre}${(n/1e5).toFixed(2)}L`;
  if (n>=1e3) return `${pre}${(n/1e3).toFixed(1)}K`;
  return `${pre}${Math.round(n).toLocaleString()}`;
};
const fmtPct = n => isNaN(+n) ? '—' : `${(+n).toFixed(2)}%`;

const PLAT = { meta:'#1877F2', facebook:'#1877F2', instagram:'#E1306C', youtube:'#CC0000', google:'#188038' };
const platColor = (p='') => { const k=p.toLowerCase(); for(const n in PLAT) if(k.includes(n)) return PLAT[n]; return '#9CA3AF'; };

// ─── VISUAL SYSTEM (warm light theme) ────────────────────────────────────────
const BG   = '#F3EEE5';   // warm parchment
const SURF = '#FEFCF8';   // slightly warmer white
const BORD = 'rgba(60,45,20,.09)';
const TXT  = '#1C1814';
const TXT2 = '#7A7060';
const TXT3 = '#B0A898';

const A = {
  Kill:     { color:'#B91C1C', dim:'rgba(185,28,28,.08)',   muted:'rgba(185,28,28,.35)',  rc:'rk', badge:'#B91C1C', badgeTxt:'#fff'    },
  Scale:    { color:'#166534', dim:'rgba(22,101,52,.07)',   muted:'rgba(22,101,52,.35)',  rc:'rs', badge:'#166534', badgeTxt:'#fff'    },
  Upgrade:  { color:'#92400E', dim:'rgba(146,64,14,.07)',   muted:'rgba(146,64,14,.35)',  rc:'ru', badge:'#92400E', badgeTxt:'#fff'    },
  Optimize: { color:'#B45309', dim:'rgba(180,83,9,.07)',    muted:'rgba(180,83,9,.35)',   rc:'ro', badge:'#B45309', badgeTxt:'#fff'    },
  Pause:    { color:'#6B7280', dim:'rgba(107,114,128,.07)', muted:'rgba(107,114,128,.3)', rc:'rp', badge:'#6B7280', badgeTxt:'#fff'    },
  Watch:    { color:'#6D28D9', dim:'rgba(109,40,217,.07)',  muted:'rgba(109,40,217,.3)',  rc:'rw', badge:'#6D28D9', badgeTxt:'#fff'    },
  Monitor:  { color:TXT3,      dim:'rgba(60,45,20,.04)',    muted:TXT3,                   rc:'rm', badge:'rgba(60,45,20,.08)', badgeTxt:TXT2 },
};

const CAT_S = {
  kill:    { color:'#B91C1C', bg:'rgba(185,28,28,.06)' },
  scale:   { color:'#166534', bg:'rgba(22,101,52,.06)' },
  upgrade: { color:'#92400E', bg:'rgba(146,64,14,.07)' },
  optimize:{ color:'#B45309', bg:'rgba(180,83,9,.06)'  },
  pause:   { color:'#6B7280', bg:'rgba(107,114,128,.06)' },
  watch:   { color:'#6D28D9', bg:'rgba(109,40,217,.06)' },
  info:    { color:TXT3,      bg:'rgba(60,45,20,.04)' },
};

const Sk = ({ w='100%', h=13 }) => <div className="skel" style={{ width:w, height:h }} />;

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [tCpa,    setTCpa]    = useState(50);
  const [editCpa, setEditCpa] = useState(false);
  const [sel,     setSel]     = useState(null);
  const [fAct,    setFAct]    = useState('all');
  const [fPlat,   setFPlat]   = useState('all');
  const [sk,      setSk]      = useState('spend');
  const [sd,      setSd]      = useState(-1);

  const p1     = useQuery({ queryKey:['ads',1], queryFn:()=>fetchPage(1) });
  const nPages = p1.data?.pagination?.total_pages || 1;

  const rest = useQueries({
    queries: Array.from({ length: Math.max(0, nPages - 1) }, (_, i) => ({
      queryKey: ['ads', i + 2],
      queryFn:  () => fetchPage(i + 2),
      enabled:  p1.isSuccess && nPages > 1,
    })),
  });

  const loaded   = 1 + rest.filter(q => q.isSuccess).length;
  const fetching = p1.isSuccess && loaded < nPages;

  const allRaw = useMemo(() => {
    const rows = [];
    if (p1.data?.data) rows.push(...p1.data.data);
    rest.forEach(q => { if (q.data?.data) rows.push(...q.data.data); });
    return rows;
  }, [p1.data, rest]);

  const { ads, metrics, platforms } = useMemo(() => {
    if (!allRaw.length) return { ads:[], metrics:null, platforms:[] };

    const processed = allRaw.map(raw => {
      const spend = +raw.spend||0, revenue=+raw.revenue||0, conv=+raw.conversions||0;
      const roas  = +raw.roas||0,  cpa=(+raw.cpa)||(conv>0?spend/conv:0);
      const { action, signals } = analyzeAd(raw, tCpa);
      return {
        ...raw, spend, revenue, conv, roas, cpa,
        ctr:+raw.ctr||0, cpc:+raw.cpc||0,
        impressions:+raw.impressions||0, clicks:+raw.clicks||0,
        days:+raw.days_running||0, freq:+raw.frequency||0,
        cs:+raw.creative_score||0, lps:+raw.landing_page_score||0,
        vcr: raw.video_completion_rate!=null ? +raw.video_completion_rate : null,
        action, signals,
      };
    });

    const byAct = (a) => processed.filter(x => x.action === a);
    const kills = byAct('Kill');
    const totalSpend = processed.reduce((s,a)=>s+a.spend,0);
    const totalRev   = processed.reduce((s,a)=>s+a.revenue,0);
    const wasted     = kills.reduce((s,a)=>s+a.spend,0);
    const pSet = new Set(processed.map(a=>a.platform).filter(Boolean));

    return {
      ads: processed,
      metrics: {
        total:processed.length, totalSpend, totalRev, wasted,
        roas: totalSpend > 0 ? totalRev/totalSpend : 0,
        kills: kills.length,
        scales: byAct('Scale').length,
        upgrades: byAct('Upgrade').length,
        optimizes: byAct('Optimize').length,
        wasteRatio: totalSpend > 0 ? wasted/totalSpend : 0,
      },
      platforms: Array.from(pSet).sort(),
    };
  }, [allRaw, tCpa]);

  const displayed = useMemo(() => {
    let list = [...ads];
    if (fAct  !== 'all') list = list.filter(a => a.action   === fAct);
    if (fPlat !== 'all') list = list.filter(a => a.platform === fPlat);
    const ORD = { Kill:0, Scale:1, Upgrade:2, Optimize:3, Watch:4, Pause:5, Monitor:6 };
    list.sort((a, b) => {
      if (fAct === 'all') {
        const d = (ORD[a.action]??6) - (ORD[b.action]??6);
        if (d !== 0) return d;
      }
      return ((b[sk]??0) - (a[sk]??0)) * sd;
    });
    return list;
  }, [ads, fAct, fPlat, sk, sd]);

  const handleSort = k => { if (sk===k) setSd(d=>d*-1); else { setSk(k); setSd(-1); } };
  const SC = ({ k }) => sk===k
    ? (sd===-1 ? <ChevronDown size={9} style={{display:'inline',marginLeft:2,opacity:.5}}/> : <ChevronUp size={9} style={{display:'inline',marginLeft:2,opacity:.5}}/>)
    : null;

  const isLoading = p1.isLoading;

  return (
    <div className="fb" style={{ minHeight:'100vh', background:BG, color:TXT }}>
      <Fonts />

      {/* Page-load progress */}
      {fetching && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:2, zIndex:100 }}>
          <div style={{ height:'100%', background:'#92400E', width:`${(loaded/nPages)*100}%`, transition:'width .4s ease', borderRadius:'0 1px 1px 0', opacity:.7 }} />
        </div>
      )}

      {/* ── NAV ── */}
      <div style={{ borderBottom:`1px solid ${BORD}`, padding:'16px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', background:SURF }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:16 }}>
          <h1 className="fd" style={{ fontSize:20, fontWeight:400, fontStyle:'italic', letterSpacing:'-.01em', color:TXT }}>
            Ad Intelligence
          </h1>
          <span style={{ fontSize:11, color:TXT3, fontWeight:300 }}>
            {metrics?.total.toLocaleString()||'—'} ads
            {fetching && <span style={{ color:'#92400E', marginLeft:8, opacity:.75 }}>· loading {loaded}/{nPages}…</span>}
          </span>
        </div>
        {/* CPA editor */}
        <div onClick={()=>setEditCpa(true)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 13px', border:`1px solid ${BORD}`, borderRadius:8, cursor:'text', background:BG }}>
          <Target size={12} style={{ color:TXT3 }} />
          <span style={{ fontSize:11, color:TXT3, textTransform:'uppercase', letterSpacing:'.07em', fontWeight:500 }}>Target CPA</span>
          {editCpa ? (
            <input type="number" value={tCpa} autoFocus
              onChange={e=>setTCpa(Math.max(1,+e.target.value))}
              onBlur={()=>setEditCpa(false)}
              style={{ width:56, background:'transparent', border:'none', outline:'none', color:TXT, fontSize:13, fontWeight:500, textAlign:'right', fontFamily:'inherit' }} />
          ) : (
            <span style={{ fontSize:13, fontWeight:500, color:TXT }}>₹{tCpa}</span>
          )}
        </div>
      </div>

      {/* ── HERO ── */}
      <div style={{ padding:'44px 40px 36px', borderBottom:`1px solid ${BORD}` }}>
        {isLoading ? (
          <div>
            <Sk w={240} h={56} /><div style={{height:12}}/>
            <div style={{display:'flex',gap:20}}>
              {[120,100,100,90,90].map((w,i)=><Sk key={i} w={w} h={32}/>)}
            </div>
          </div>
        ) : metrics ? (
          <>
            {/* Primary: wasted spend */}
            <div className="au" style={{ display:'flex', alignItems:'flex-end', gap:36, marginBottom:30, flexWrap:'wrap' }}>
              <div>
                <p style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'.13em', color:TXT3, fontWeight:500, marginBottom:9 }}>
                  Capital at risk
                </p>
                <div className="fd" style={{ fontSize:58, fontWeight:300, lineHeight:1, color:'#B91C1C', letterSpacing:'-.03em' }}>
                  {fmt(metrics.wasted)}
                </div>
                <p style={{ fontSize:12, color:'rgba(185,28,28,.5)', marginTop:6, fontWeight:300 }}>
                  {metrics.kills} ads confirmed for termination &nbsp;·&nbsp; {(metrics.wasteRatio*100).toFixed(1)}% of total budget
                </p>
              </div>
              {/* Waste bar */}
              <div style={{ flex:'1 1 140px', maxWidth:180, paddingBottom:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:9, color:TXT3, textTransform:'uppercase', letterSpacing:'.1em' }}>Waste</span>
                  <span style={{ fontSize:10, color:'rgba(185,28,28,.6)' }}>{(metrics.wasteRatio*100).toFixed(1)}%</span>
                </div>
                <div style={{ height:2, background:'rgba(60,45,20,.1)', borderRadius:1, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${metrics.wasteRatio*100}%`, background:'#B91C1C', transition:'width 1s cubic-bezier(.22,.68,0,1.2)' }} />
                </div>
              </div>
            </div>

            {/* Secondary strip */}
            <div style={{ display:'flex', gap:0, flexWrap:'wrap' }}>
              {[
                { l:'Total spend',   v:fmt(metrics.totalSpend),          c:TXT },
                { l:'Total revenue', v:fmt(metrics.totalRev),            c:TXT },
                { l:'Overall ROAS',  v:`${metrics.roas.toFixed(2)}×`,    c:metrics.roas>=2?'#166534':metrics.roas<1?'#B91C1C':TXT },
                { l:'Scale',         v:metrics.scales,                   c:'#166534' },
                { l:'Upgrade',       v:metrics.upgrades,                 c:'#92400E' },
                { l:'Optimize',      v:metrics.optimizes,                c:'#B45309' },
              ].map(({ l, v, c }, i) => (
                <div key={l} className="au" style={{ animationDelay:`${i*40}ms`, paddingRight:24, borderRight:`1px solid ${BORD}`, marginRight:24, marginBottom:8 }}>
                  <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', color:TXT3, fontWeight:500, marginBottom:4 }}>{l}</p>
                  <p className="fd" style={{ fontSize:24, fontWeight:300, lineHeight:1, color:c, fontVariantNumeric:'tabular-nums', letterSpacing:'-.01em' }}>{v}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* ── FILTERS ── */}
      <div style={{ padding:'13px 40px', borderBottom:`1px solid ${BORD}`, background:SURF, display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
        {['all','Kill','Scale','Upgrade','Optimize','Watch','Pause','Monitor'].map(f => {
          const active = fAct === f;
          const cfg = A[f];
          const count = f !== 'all' ? ads.filter(a=>a.action===f).length : ads.length;
          return (
            <button key={f} onClick={()=>setFAct(f)} className="fp"
              style={{
                padding:'5px 13px', borderRadius:100, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit',
                border:`1px solid ${active ? (cfg ? cfg.muted : BORD) : BORD}`,
                background: active ? (cfg ? cfg.dim : 'rgba(60,45,20,.05)') : 'transparent',
                color:      active ? (cfg ? cfg.color : TXT) : TXT2,
                transition: 'all .13s',
              }}>
              {f === 'all' ? 'All' : f}
              <span style={{ marginLeft:5, opacity:.45, fontSize:10 }}>{count}</span>
            </button>
          );
        })}
        {platforms.length > 0 && <div style={{ width:1, height:13, background:BORD, margin:'0 3px' }} />}
        {platforms.map(p => {
          const active = fPlat === p;
          const c = platColor(p);
          return (
            <button key={p} onClick={()=>setFPlat(active?'all':p)} className="fp"
              style={{
                padding:'5px 13px', borderRadius:100, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit',
                border:`1px solid ${active ? `${c}44` : BORD}`,
                background: active ? `${c}12` : 'transparent',
                color: active ? c : TXT2,
                transition:'all .13s',
              }}>
              <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:c, marginRight:5, verticalAlign:'middle' }} />
              {p}
            </button>
          );
        })}
        <span style={{ marginLeft:'auto', fontSize:11, color:TXT3 }}>{displayed.length} shown</span>
      </div>

      {/* ── TABLE ── */}
      <div style={{ overflowX:'auto', background:SURF }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:860 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${BORD}`, background:BG }}>
              {[
                { label:'Action',  key:null,        w:90  },
                { label:'Brand',   key:null,        w:null },
                { label:'Spend',   key:'spend',     w:105 },
                { label:'Revenue', key:'revenue',   w:115 },
                { label:'ROAS',    key:'roas',      w:80  },
                { label:'CPA',     key:'cpa',       w:95  },
                { label:'CTR',     key:'ctr',       w:72  },
                { label:'Conv.',   key:'conv',      w:72  },
                { label:'Days',    key:'days',      w:60  },
                { label:'Signals', key:null,        w:175 },
              ].map(({ label, key, w }) => (
                <th key={label} onClick={()=>key&&handleSort(key)}
                  style={{ padding:'9px 16px', textAlign:'left', fontSize:9, fontWeight:500, textTransform:'uppercase',
                    letterSpacing:'.12em', color:TXT3, cursor:key?'pointer':'default',
                    userSelect:'none', whiteSpace:'nowrap', width:w||undefined }}>
                  {label}<SC k={key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({length:14}).map((_,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid ${BORD}` }}>
                  {Array.from({length:10}).map((_,j)=>(
                    <td key={j} style={{ padding:'13px 16px' }}><Sk w={j===1?110:55} h={11} /></td>
                  ))}
                </tr>
              ))
            ) : displayed.map((ad, i) => {
              const cfg = A[ad.action] || A.Monitor;
              const top = ad.signals[0];
              const nK  = ad.signals.filter(s=>s.cat==='kill').length;
              const nS  = ad.signals.filter(s=>s.cat==='scale').length;
              const nU  = ad.signals.filter(s=>s.cat==='upgrade').length;
              const shown = nK + nS + nU + (top && !['kill','scale','upgrade'].includes(top.cat) ? 1 : 0);
              return (
                <tr key={ad.ad_id||i} onClick={()=>setSel(ad)}
                  className={`row ${cfg.rc} au`}
                  style={{ borderBottom:`1px solid ${BORD}`, animationDelay:`${Math.min(i*14,260)}ms` }}>

                  <td style={{ padding:'13px 16px' }}>
                    <span style={{ fontSize:11, fontWeight:500, color:cfg.color, letterSpacing:'.03em' }}>
                      {ad.action}
                    </span>
                  </td>

                  <td style={{ padding:'13px 16px' }}>
                    <div className="fd" style={{ fontSize:16, fontWeight:400, fontStyle:'italic', color:TXT, lineHeight:1.2 }}>
                      {ad.brand || ad.ad_id}
                    </div>
                    <div style={{ fontSize:10, color:TXT3, marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ display:'inline-block', width:4, height:4, borderRadius:'50%', background:platColor(ad.platform) }} />
                      {ad.platform} · {ad.category} · {ad.ad_type}
                    </div>
                  </td>

                  <td style={{ padding:'13px 16px', fontSize:12, color:TXT2, fontVariantNumeric:'tabular-nums' }}>
                    {fmt(ad.spend)}
                  </td>

                  <td style={{ padding:'13px 16px', fontSize:12, color:TXT2, fontVariantNumeric:'tabular-nums', opacity:.85 }}>
                    {fmt(ad.revenue)}
                  </td>

                  <td style={{ padding:'13px 16px' }}>
                    <span className="fd" style={{
                      fontSize:17, fontWeight:400, lineHeight:1, fontVariantNumeric:'tabular-nums',
                      color: ad.roas>=2?'#166534' : ad.roas>0&&ad.roas<1?'#B91C1C' : TXT
                    }}>
                      {ad.roas.toFixed(2)}×
                    </span>
                  </td>

                  <td style={{ padding:'13px 16px', fontSize:12, fontVariantNumeric:'tabular-nums',
                    color: ad.cpa <= tCpa ? '#166534' : ad.cpa > tCpa*1.8 ? '#B91C1C' : '#B45309' }}>
                    {fmt(ad.cpa)}
                  </td>

                  <td style={{ padding:'13px 16px', fontSize:12, color:TXT3, fontVariantNumeric:'tabular-nums' }}>
                    {fmtPct(ad.ctr)}
                  </td>

                  <td style={{ padding:'13px 16px', fontSize:12, color:TXT3, fontVariantNumeric:'tabular-nums' }}>
                    {ad.conv.toLocaleString()}
                  </td>

                  <td style={{ padding:'13px 16px', fontSize:11, color:TXT3 }}>
                    {ad.days}d
                  </td>

                  <td style={{ padding:'13px 16px' }}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {nK>0 && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(185,28,28,.1)', color:'#B91C1C', fontWeight:500 }}>{nK} kill</span>}
                      {nS>0 && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(22,101,52,.1)', color:'#166534', fontWeight:500 }}>{nS} scale</span>}
                      {nU>0 && <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'rgba(146,64,14,.1)', color:'#92400E', fontWeight:500 }}>{nU} upgrade</span>}
                      {top && !['kill','scale','upgrade'].includes(top.cat) && (
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:CAT_S[top.cat]?.bg, color:CAT_S[top.cat]?.color }}>
                          {top.label}
                        </span>
                      )}
                      {ad.signals.length > shown && (
                        <span style={{ fontSize:10, color:TXT3, padding:'2px 3px' }}>+{ad.signals.length-shown}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && displayed.length === 0 && (
          <div style={{ padding:'72px 40px', textAlign:'center', color:TXT3, fontSize:14 }}>
            No ads match the current filter.
          </div>
        )}
      </div>

      {/* ── DOSSIER ── */}
      {sel && (() => {
        const cfg = A[sel.action] || A.Monitor;
        return (
          <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', justifyContent:'flex-end' }}>
            <div onClick={()=>setSel(null)} style={{ position:'absolute', inset:0, background:'rgba(20,15,8,.4)', backdropFilter:'blur(6px)' }} />
            <div className="as fb" style={{ position:'relative', width:'100%', maxWidth:460, background:SURF, borderLeft:`1px solid ${BORD}`, height:'100%', overflowY:'auto', display:'flex', flexDirection:'column' }}>

              {/* Header */}
              <div style={{ padding:'22px 26px 18px', borderBottom:`1px solid ${BORD}`, position:'sticky', top:0, background:SURF, zIndex:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.14em', color:TXT3, display:'block', marginBottom:7 }}>
                      Intelligence Brief
                    </span>
                    <h2 className="fd" style={{ fontSize:28, fontWeight:400, fontStyle:'italic', color:TXT, lineHeight:1.2, letterSpacing:'-.01em' }}>
                      {sel.brand || sel.ad_id}
                    </h2>
                    <p style={{ fontSize:11, color:TXT3, marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:platColor(sel.platform) }} />
                      {sel.platform} · {sel.ad_type} · {sel.category}
                    </p>
                  </div>
                  <button onClick={()=>setSel(null)}
                    style={{ background:BG, border:`1px solid ${BORD}`, borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:TXT2, flexShrink:0, marginTop:2 }}>
                    <X size={14} />
                  </button>
                </div>
                {/* Verdict bar */}
                <div style={{ marginTop:13, padding:'10px 14px', borderRadius:8, background:cfg.dim, borderLeft:`3px solid ${cfg.color}` }}>
                  <span style={{ fontSize:10, fontWeight:600, color:cfg.color, textTransform:'uppercase', letterSpacing:'.07em' }}>{sel.action}</span>
                  <p style={{ fontSize:12, color:TXT2, marginTop:3, lineHeight:1.55 }}>
                    {sel.signals[0]?.desc || 'No dominant signal detected. Performance is within normal range.'}
                  </p>
                </div>
              </div>

              <div style={{ padding:'22px 26px', flex:1 }}>
                {/* Key numbers */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:22 }}>
                  {[
                    { l:'Spend',    v:fmt(sel.spend) },
                    { l:'Revenue',  v:fmt(sel.revenue) },
                    { l:'ROAS',     v:`${sel.roas.toFixed(2)}×`,  c:sel.roas>=2?'#166534':sel.roas>0&&sel.roas<1?'#B91C1C':TXT },
                    { l:'CPA',      v:fmt(sel.cpa),               c:sel.cpa<=tCpa?'#166534':sel.cpa>tCpa*1.8?'#B91C1C':'#B45309' },
                    { l:'CTR',      v:fmtPct(sel.ctr) },
                    { l:'Conv.',    v:sel.conv.toLocaleString() },
                    { l:'Creative', v:`${sel.cs.toFixed(1)}/10`,  c:sel.cs>=7?'#166534':sel.cs<4?'#B91C1C':TXT },
                    { l:'LP score', v:`${sel.lps.toFixed(1)}/10`, c:sel.lps>=7?'#166534':sel.lps<4?'#B91C1C':TXT },
                    { l:'Freq.',    v:`${sel.freq.toFixed(1)}×`,  c:sel.freq>7?'#B91C1C':TXT },
                  ].map(({ l, v, c=TXT2 }) => (
                    <div key={l} style={{ padding:'9px 11px', border:`1px solid ${BORD}`, borderRadius:7, background:BG }}>
                      <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.1em', color:TXT3, fontWeight:500, marginBottom:4 }}>{l}</p>
                      <p className="fd" style={{ fontSize:18, fontWeight:300, lineHeight:1, color:c, fontVariantNumeric:'tabular-nums' }}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div style={{ marginBottom:22 }}>
                  {[
                    ['Audience',     sel.target_audience],
                    ['Theme',        sel.creative_theme],
                    ['Status',       sel.status],
                    ['Ad type',      sel.ad_type],
                    ['Days live',    `${sel.days}d (since ${sel.start_date})`],
                    ['CPC',          fmt(sel.cpc)],
                    ['Impressions',  (+sel.impressions||0).toLocaleString()],
                    ['Clicks',       (+sel.clicks||0).toLocaleString()],
                    ['Video compl.', sel.vcr!=null?`${sel.vcr}%`:'N/A'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'7px 0', borderBottom:`1px solid ${BORD}` }}>
                      <span style={{ fontSize:11, color:TXT3 }}>{label}</span>
                      <span style={{ fontSize:12, color:TXT2 }}>{value||'—'}</span>
                    </div>
                  ))}
                </div>

                {/* Signals */}
                <div>
                  <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.12em', color:TXT3, fontWeight:500, marginBottom:10 }}>
                    {sel.signals.length} signal{sel.signals.length!==1?'s':''} detected
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {sel.signals.length === 0 ? (
                      <p className="fd" style={{ fontSize:14, color:TXT3, fontStyle:'italic' }}>
                        No active signals — performance within normal range.
                      </p>
                    ) : sel.signals.map(sig => {
                      const sc = CAT_S[sig.cat] || CAT_S.info;
                      return (
                        <div key={sig.id} style={{ padding:'10px 13px', borderRadius:7, background:sc.bg, borderLeft:`2px solid ${sc.color}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                            <span style={{ fontSize:10, fontWeight:600, color:sc.color, letterSpacing:'.04em' }}>{sig.label}</span>
                            <span style={{ fontSize:9, color:TXT3, textTransform:'uppercase', letterSpacing:'.07em' }}>{sig.cat}</span>
                          </div>
                          <p style={{ fontSize:12, color:TXT2, lineHeight:1.55 }}>{sig.desc}</p>
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