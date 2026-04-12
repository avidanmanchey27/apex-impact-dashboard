import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown, Info, Zap, Sparkles, Activity, MousePointer2, TrendingUp, BarChart3, Globe, ShieldCheck, AlertCircle, Filter } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300_000, retry: 1 } },
});

const API = 'https://mosaicfellowship.in/api/data/content/ads';
const fetchPage = async (p) => {
  const r = await fetch(`${API}?page=${p}&limit=100`);
  if (!r.ok) throw new Error(`Page ${p}: ${r.status}`);
  return r.json();
};

// ─── TYPOGRAPHY + ANIMATION (LUXURY EDITORIAL) ────────────────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Geist:wght@300;400;600&family=Bodoni+Moda:ital,wght@0,900;1,900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body { background: #050505; color: #E4E4E7; overflow-x: hidden; }

    .f-display { font-family: 'Bodoni Moda', 'Cormorant Garamond', serif; }
    .f-body    { font-family: 'Geist', 'DM Sans', system-ui, sans-serif; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn  { from { transform:translateX(100%); } to { transform:translateX(0); } }
    @keyframes shimmer  { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes pulseGlow { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

    .anim-up    { animation: fadeUp  .8s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .anim-slide { animation: slideIn .6s  cubic-bezier(0.16, 1, 0.3, 1) both; }
    .glow-text  { animation: pulseGlow 2s infinite; }

    .row-base {
      border-left: 4px solid transparent;
      transition: all .3s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      position: relative;
    }
    .row-base:hover         { background: rgba(255,255,255,.03); transform: scale(1.002); z-index: 10; }
    .row-kill:hover         { border-left-color: #FF453A; background: rgba(255,69,58,.04); }
    .row-scale:hover        { border-left-color: #32D74B; background: rgba(50,215,75,.04); }
    .row-upgrade:hover      { border-left-color: #5E5CE6; background: rgba(94,92,230,.06); }
    .row-optimize:hover     { border-left-color: #FF9F0A; background: rgba(255,159,10,.03); }
    .row-watch:hover        { border-left-color: #BF5AF2; background: rgba(191,90,242,.03); }
    .row-monitor:hover      { border-left-color: #3A3A3C; }

    .glass-card { 
      background: rgba(255, 255, 255, 0.02); 
      backdrop-filter: blur(30px); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      border-radius: 40px;
    }

    .pill { border-radius: 100px; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.1); }
    .filter-pill:hover { border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.05); }

    ::-webkit-scrollbar       { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 5px; }
  `}</style>
);

// ─── THE SIGNAL ENGINE (INTELLIGENT REVENUE-FIRST LOGIC) ───────────────────────
const analyzeAd = (raw, targetCpa) => {
  const spend   = +raw.spend || 0;
  const conv    = +raw.conversions || 0;
  const revenue = +raw.revenue || 0;
  const roas    = +raw.roas || 0;
  const days    = +raw.days_running || 0;
  const ctr     = +raw.ctr || 0;
  const cpc     = +raw.cpc || 0;
  const cs      = +raw.creative_score || 0;
  const lps     = +raw.landing_page_score || 0;
  const cpa     = +raw.cpa || (conv > 0 ? spend / conv : 0);
  const vcr     = raw.video_completion_rate != null ? +raw.video_completion_rate : null;
  const S = [];

  // UPGRADE GATE: PROTECT REVENUE FROM KILL
  // If an ad is making money but creative is poor, it is an UPGRADE, not a KILL.
  if (cs < 5 && revenue > (spend * 1.5) && conv > 0) {
    S.push({ id:'upgrade', label:'Creative Upgrade', cat:'upgrade', weight:120, desc:`This ad is a commercial success (₹${revenue.toLocaleString()} earned) but the visuals are being rejected by the platform algorithm. Don't stop the campaign—refresh the creative visuals to lower costs and scale profit.` });
  }

  // KILL GATE: ONLY FOR TRUE CAPITAL BLEED
  if (spend > 3 * targetCpa && conv === 0) {
    S.push({ id:'capital_bleed', label:'Capital Bleed', cat:'kill', weight:100, desc:`₹${spend.toLocaleString()} spent with zero conversion signals. Capital is being consumed without intent. Immediate termination required.` });
  }
  if (roas > 0 && roas < 1 && days >= 14 && revenue < spend) {
    S.push({ id:'sustained_loss', label:'Sustained Loss', cat:'kill', weight:95, desc:`Campaign has failed to reach break-even for 14+ days. Net loss confirmed.` });
  }

  // SCALE GATE: HIGH YIELD
  if (roas > 4 && cpa <= targetCpa && conv > 0) {
    S.push({ id:'alpha_performer', label:'Proven Alpha', cat:'scale', weight:110, desc:`Peak capital efficiency at ${roas.toFixed(1)}× returns. Move to aggressive scaling mode.` });
  }
  if (vcr > 70 && roas > 2 && conv > 0) {
    S.push({ id:'retention_winner', label:'Retention King', cat:'scale', weight:85, desc:`Exceptional video retention (${vcr}%). Audience is highly engaged.` });
  }

  // OPTIMIZE GATE
  if (ctr > 3 && lps < 5 && conv > 0) {
    S.push({ id:'lp_leak', label:'Website Leak', cat:'optimize', weight:72, desc:`High interest (${ctr}% CTR) but the website is failing to close the sale. Optimize the landing page.` });
  }

  S.sort((a, b) => b.weight - a.weight);

  let action = 'Monitor';
  if (S.some(s => s.cat === 'upgrade'))    action = 'Upgrade';
  else if (S.some(s => s.cat === 'kill'))  action = 'Kill';
  else if (S.some(s => s.cat === 'scale')) action = 'Scale';
  else if (S.some(s => s.cat === 'optimize')) action = 'Optimize';

  return { action, signals: S };
};

// ─── VISUAL CONSTANTS ─────────────────────────────────────────────────────────
const A = {
  Kill:     { color:'#FF453A', dim:'rgba(255,69,58,.12)',  rowClass:'row-kill' },
  Scale:    { color:'#32D74B', dim:'rgba(50,215,75,.12)',  rowClass:'row-scale' },
  Upgrade:  { color:'#5E5CE6', dim:'rgba(94,92,230,.18)',  rowClass:'row-upgrade' },
  Optimize: { color:'#FF9F0A', dim:'rgba(255,159,10,.12)', rowClass:'row-optimize' },
  Watch:    { color:'#BF5AF2', dim:'rgba(191,90,242,.10)', rowClass:'row-watch' },
  Monitor:  { color:'#8E8E93', dim:'rgba(142,142,147,.1)',  rowClass:'row-monitor' },
};
const CAT = {
  kill:     { color:'#FF453A', bg:'rgba(255,69,58,.1)' },
  scale:    { color:'#32D74B', bg:'rgba(50,215,75,.1)' },
  upgrade:  { color:'#5E5CE6', bg:'rgba(94,92,230,.15)' },
  optimize: { color:'#FF9F0A', bg:'rgba(255,159,10,.1)' },
  info:     { color:'rgba(255,255,255,.4)', bg:'rgba(255,255,255,.05)' },
};
const PLAT = { meta:'#1877F2', facebook:'#1877F2', instagram:'#E1306C', youtube:'#FF0000', google:'#34A853' };
const platColor = (p='') => { const k=p.toLowerCase(); for(const n in PLAT) if(k.includes(n)) return PLAT[n]; return '#636366'; };

const fmt = (n, pre='₹') => n ? `${pre}${Math.round(n).toLocaleString()}` : '—';
const Sk = ({ w='100%', h=13 }) => <div className="shimmer-bg" style={{ width:w, height:h, borderRadius:4 }} />;

// ─── THE CORE DASHBOARD ───────────────────────────────────────────────────────
const Dashboard = () => {
  const [targetCpa, setTargetCpa] = useState(50);
  const [selectedAd, setSelectedAd] = useState(null);
  const [filterAction, setFilterAction] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState(-1);
  const [page, setPage] = useState(1);

  const { data: pageData, isLoading } = useQuery({ 
    queryKey: ['ads', page], 
    queryFn: () => fetchPage(page) 
  });

  const { ads, metrics, platforms } = useMemo(() => {
    if (!pageData?.data) return { ads: [], metrics: { wasted: 0 }, platforms: [] };
    const processed = pageData.data.map(raw => {
      const { action, signals } = analyzeAd(raw, targetCpa);
      return { 
        ...raw, 
        action, 
        signals,
        roas: +raw.roas || 0,
        spend: +raw.spend || 0,
        conv: +raw.conversions || 0,
        revenue: +raw.revenue || 0,
        cpa: +raw.cpa || (+raw.conversions > 0 ? +raw.spend / +raw.conversions : 0)
      };
    });
    const pSet = new Set(processed.map(a => a.platform).filter(Boolean));
    return { 
      ads: processed, 
      metrics: { 
        wasted: processed.filter(a => a.action === 'Kill').reduce((s, a) => s + a.spend, 0),
        totalSpend: processed.reduce((s, a) => s + a.spend, 0)
      },
      platforms: Array.from(pSet).sort()
    };
  }, [pageData, targetCpa]);

  const displayed = useMemo(() => {
    let list = ads.filter(a => (filterAction === 'all' || a.action === filterAction) && (filterPlatform === 'all' || a.platform === filterPlatform));
    return list.sort((a, b) => ((b[sortKey] ?? 0) - (a[sortKey] ?? 0)) * sortDir);
  }, [ads, filterAction, filterPlatform, sortKey, sortDir]);

  return (
    <div className="f-body p-6 md:p-20 min-h-screen">
      <Fonts />

      {/* HEADER UNIT */}
      <header className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-12 border-b border-white/5 pb-16">
        <div>
          <h1 className="f-display text-7xl md:text-[10rem] font-black tracking-tighter text-white mb-6 leading-[0.8] italic">Apex Impact</h1>
          <p className="text-zinc-500 font-medium tracking-[0.4em] uppercase text-sm flex items-center gap-3">
            <TrendingUp size={18} className="text-emerald-500" /> Capital Yield Control Center
          </p>
        </div>
        <div className="glass-card p-12 min-w-[360px] transition-all hover:translate-y-[-4px]">
          <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-4">Capital at Risk (Page)</p>
          <div className="f-display text-7xl text-red-500 leading-none">{fmt(metrics.wasted)}</div>
        </div>
      </header>

      {/* STRATEGIC NOTE (EXECUTIVE SUMMARY) */}
      <div className="mb-16 bg-blue-950/20 border border-blue-500/20 p-10 rounded-[3rem] flex items-start gap-8 shadow-2xl">
        <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl shadow-blue-600/30"><Info size={32} /></div>
        <div>
          <h4 className="font-black text-blue-400 uppercase text-xs tracking-widest mb-2">How to utilize this Dashboard</h4>
          <p className="text-blue-100/70 text-lg leading-relaxed max-w-6xl font-medium italic">
            This system identifies where your money is working. <strong className="text-white underline decoration-red-500">Kill</strong> indicates ads that burn cash without sales. <strong className="text-white underline decoration-emerald-500">Scale</strong> marks your top earners. <strong className="text-white underline decoration-indigo-400 font-black">Upgrade</strong> is a special protection tag—it means an ad is making money despite poor visuals. Do not stop these ads; simply refresh the creative to double your ROI.
          </p>
        </div>
      </div>

      {/* CONTROL MATRIX (PLATFORMS + ACTIONS) */}
      <div className="mb-12 flex flex-wrap justify-between items-center gap-10">
        <div className="flex flex-wrap gap-4 items-center">
            {['all', 'Kill', 'Scale', 'Upgrade', 'Optimize'].map(f => (
            <button key={f} onClick={() => setFilterAction(f)} className="pill filter-pill" 
              style={{ padding:'12px 30px', background: filterAction===f?'#fff':'rgba(255,255,255,0.04)', color: filterAction===f?'#000':'rgba(255,255,255,0.4)', fontSize:'12px', fontWeight:900 }}>
              {f.toUpperCase()}
            </button>
            ))}
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            <button onClick={() => setFilterPlatform('all')} className="pill filter-pill" 
              style={{ padding:'12px 30px', background: filterPlatform==='all'?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize:'12px', fontWeight:900 }}>ALL PLATFORMS</button>
            {platforms.map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)} className="pill filter-pill" 
              style={{ padding:'12px 30px', background: filterPlatform===p?platColor(p):'rgba(255,255,255,0.04)', color: filterPlatform===p?'#fff':'rgba(255,255,255,0.4)', fontSize:'12px', fontWeight:900 }}>
              {p.toUpperCase()}
            </button>
            ))}
        </div>

        <div className="flex items-center gap-6 bg-white/5 px-8 py-4 rounded-full border border-white/10 shadow-lg">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="text-zinc-500 hover:text-white transition-all font-bold tracking-widest text-xs uppercase">Back</button>
            <span className="text-xs font-black text-white px-4 border-x border-white/10 uppercase tracking-widest">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="text-zinc-500 hover:text-white transition-all font-bold tracking-widest text-xs uppercase">Next</button>
        </div>
      </div>

      {/* BATTLEGROUND DATA MATRIX */}
      <div className="glass-card overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="p-10 text-[11px] font-black uppercase text-zinc-600 tracking-[0.2em]">Status Directive</th>
              <th className="p-10 text-[11px] font-black uppercase text-zinc-600 tracking-[0.2em]">Campaign Asset</th>
              <th className="p-10 text-right text-[11px] font-black uppercase text-zinc-600 tracking-[0.2em]">Net ROAS</th>
              <th className="p-10 text-right text-[11px] font-black uppercase text-zinc-600 tracking-[0.2em]">Allocated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan="4" className="p-60 text-center text-zinc-600 font-display italic text-4xl animate-pulse tracking-tighter">Syncing Signal Lake...</td></tr> : 
              displayed.map((ad, i) => (
              <tr key={i} onClick={() => setSelectedAd(ad)} className={`row-base row-${ad.action.toLowerCase()} anim-up`} style={{ animationDelay: `${i*0.02}s` }}>
                <td className="p-10">
                  <span className={`px-6 py-2 rounded-full text-[11px] font-black tracking-widest uppercase border`} style={{ background:A[ad.action]?.dim, color:A[ad.action]?.color, borderColor: 'rgba(255,255,255,0.05)' }}>{ad.action}</span>
                </td>
                <td className="p-10">
                  <div className="f-display text-5xl text-white italic tracking-tight leading-none mb-2">{ad.brand}</div>
                  <div className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
                    {ad.platform} <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" /> {ad.category}
                  </div>
                </td>
                <td className="p-10 text-right">
                  <div className="f-display text-6xl text-white leading-none tracking-tighter">{(+ad.roas).toFixed(2)}×</div>
                </td>
                <td className="p-10 text-right">
                   <div className="text-3xl font-black text-white leading-none mb-1">{fmt(+ad.spend)}</div>
                   <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">₹{(+ad.cpa).toFixed(0)} CPA</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INTELLIGENCE DOSSIER (DEEP DATA BINDING) */}
      {selectedAd && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div onClick={()=>setSelectedAd(null)} className="absolute inset-0 bg-black/90 backdrop-blur-3xl transition-all" />
          <div className="anim-slide glass-card" style={{ position:'relative', width:'50%', height:'100%', padding:'100px', overflowY:'auto', borderRadius:0, borderLeft:'1px solid rgba(255,255,255,0.15)' }}>
            <button onClick={()=>setSelectedAd(null)} className="absolute top-12 right-12 p-5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all hover:rotate-90"><X size={40}/></button>
            <span className="text-[14px] font-black text-zinc-500 uppercase tracking-[0.5em] block mb-8 border-b border-zinc-800 pb-4">Internal Asset Intelligence</span>
            <h2 className="f-display text-9xl text-white italic leading-[0.8] mb-12 tracking-tighter">{selectedAd.brand}</h2>
            
            <div className={`p-12 rounded-[3.5rem] shadow-2xl mb-16 flex flex-col gap-8 transition-all hover:scale-[1.01]`} 
                 style={{ background:A[selectedAd.action]?.dim, borderLeft:`8px solid ${A[selectedAd.action]?.color}`, boxShadow:`0 30px 60px -12px ${A[selectedAd.action]?.dim}` }}>
              <div className="flex items-center gap-6">
                <Zap size={48} color={A[selectedAd.action]?.color} fill={A[selectedAd.action]?.color} />
                <h3 className="text-4xl font-black uppercase tracking-tighter italic" style={{ color:A[selectedAd.action]?.color }}>{selectedAd.action} VERDICT</h3>
              </div>
              <p className="text-2xl font-medium leading-relaxed text-white/90 italic font-['Inter']">{selectedAd.signals[0]?.desc || "Stable metrics detected. Campaign continues to gather market data."}</p>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-20">
              {[
                { l:'Creative Asset Rank', v:`${(+selectedAd.creative_score).toFixed(1)}/10`, c:(+selectedAd.creative_score < 5 ? '#EF4444' : '#32D74B') },
                { l:'Conversion Page Strength', v:`${(+selectedAd.landing_page_score).toFixed(1)}/10`, c:'#32D74B' },
                { l:'Market Impressions', v:(+selectedAd.impressions).toLocaleString(), c:'#fff' },
                { l:'Direct Intent (CTR)', v:`${(+selectedAd.ctr).toFixed(2)}%`, c:'#fff' },
                { l:'Net Conversions', v:(+selectedAd.conversions).toLocaleString(), c:'#fff' },
                { l:'Frequency Saturation', v:`${(+selectedAd.frequency).toFixed(2)}x`, c:(+selectedAd.frequency > 6 ? '#FF9F0A' : '#fff') }
              ].map((s, i) => (
                <div key={i} className="glass-card" style={{ padding:'40px', borderRadius:'3rem' }}>
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3">{s.l}</p>
                  <p className="f-display text-6xl tracking-tighter" style={{ color:s.c }}>{s.v}</p>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-zinc-900 pt-16 space-y-12 mb-20">
               <h4 className="text-md font-black uppercase tracking-[0.5em] text-white border-b border-zinc-900 pb-6 flex items-center gap-4">
                 <Sparkles size={24} className="text-indigo-400"/> Operational Data Matrix
               </h4>
               <div className="grid grid-cols-2 gap-y-16">
                 <div><span className="text-[13px] font-black text-zinc-600 uppercase block mb-4 tracking-widest">Target Audience</span><span className="text-3xl font-black text-white uppercase tracking-tighter">{selectedAd.target_audience}</span></div>
                 <div><span className="text-[13px] font-black text-zinc-600 uppercase block mb-4 tracking-widest">Creative Theme</span><span className="text-3xl font-black text-indigo-400 italic underline decoration-indigo-800 underline-offset-8">{selectedAd.creative_theme}</span></div>
                 <div><span className="text-[13px] font-black text-zinc-600 uppercase block mb-4 tracking-widest">Video Retention</span><span className="text-3xl font-black text-white">{selectedAd.video_completion_rate ? `${selectedAd.video_completion_rate}%` : 'N/A'}</span></div>
                 <div><span className="text-[13px] font-black text-zinc-600 uppercase block mb-4 tracking-widest">Unit Cost (CPC)</span><span className="text-3xl font-black text-white uppercase tracking-tighter">₹{(+selectedAd.cpc).toFixed(2)}</span></div>
                 <div><span className="text-[13px] font-black text-zinc-600 uppercase block mb-4 tracking-widest">Funnel Context</span><span className="text-3xl font-black text-white uppercase">{selectedAd.status} • {selectedAd.ad_type}</span></div>
                 <div><span className="text-[13px] font-black text-zinc-600 uppercase block mb-4 tracking-widest">Run Duration</span><span className="text-3xl font-black text-white">{selectedAd.days_running} Days Live</span></div>
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