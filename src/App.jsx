import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown, Sparkles, Zap, TrendingUp, Info } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300_000, retry: 1 } },
});

const API = 'https://mosaicfellowship.in/api/data/content/ads';
const fetchPage = async (p) => {
  const r = await fetch(`${API}?page=${p}&limit=100`);
  if (!r.ok) throw new Error(`Page ${p}: ${r.status}`);
  return r.json();
};

// ─── TYPOGRAPHY + ANIMATION (EDITORIAL LUXURY OVERHAUL) ───────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Geist:wght@300;400;600&family=Bodoni+Moda:ital,wght@0,900;1,900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body { background: #050505; color: #E4E4E7; }

    .f-display { font-family: 'Bodoni Moda', 'Cormorant Garamond', serif; }
    .f-body    { font-family: 'Geist', sans-serif; }

    @keyframes fadeUp   { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideIn  { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes shimmer  { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }

    .anim-up    { animation: fadeUp  .6s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .anim-slide { animation: slideIn .5s  cubic-bezier(0.16, 1, 0.3, 1) both; }

    .row-base {
      border-left: 4px solid transparent;
      transition: all .25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }
    .row-base:hover         { background: rgba(255,255,255,.03); transform: scale(1.002); }
    .row-kill:hover         { border-left-color: #EF4444; background: rgba(239,68,68,.05); }
    .row-scale:hover        { border-left-color: #10B981; background: rgba(16,185,129,.05); }
    .row-upgrade:hover      { border-left-color: #6366F1; background: rgba(99,102,241,.08); }
    .row-optimize:hover     { border-left-color: #F59E0B; background: rgba(245,158,11,.05); }
    .row-watch:hover        { border-left-color: #A855F7; }
    .row-pause:hover        { border-left-color: #71717A; }
    .row-monitor:hover      { border-left-color: #27272A; }

    .glass-card { 
      background: rgba(255, 255, 255, 0.02); 
      backdrop-filter: blur(20px); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      border-radius: 32px;
    }

    .pill { border-radius: 100px; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1); }

    ::-webkit-scrollbar       { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 10px; }
  `}</style>
);

// ─── SIGNAL ENGINE (INTELLIGENT REVENUE PIVOT) ────────────────────────────────
const analyzeAd = (raw, targetCpa) => {
  const spend   = +raw.spend || 0;
  const conv    = +raw.conversions || 0;
  const revenue = +raw.revenue || 0;
  const roas    = +raw.roas || 0;
  const cs      = +raw.creative_score || 0;
  const lps     = +raw.landing_page_score || 0;
  const cpa     = +raw.cpa || (conv > 0 ? spend / conv : 0);
  const S = [];

  // UPGRADE SYSTEM: High Revenue but Low Creative (The "Diamond in the Rough")
  if (cs < 5 && revenue > (spend * 1.5) && conv > 0)
    S.push({ id:'creative_upgrade', label:'Creative Upgrade', cat:'upgrade', weight:110, desc:`This asset is earning ₹${revenue.toLocaleString()} despite low creative quality. Do not terminate—upgrade the creative to double the ROAS.` });

  // KILL SYSTEM: Only for true capital bleeders
  if (spend > 3 * targetCpa && conv === 0)
    S.push({ id:'capital_bleed', label:'Capital Bleed', cat:'kill', weight:100, desc:`₹${spend.toLocaleString()} spent with zero intent signals. Budget leak confirmed.` });
  
  // SCALE SYSTEM
  if (roas > 3 && cpa <= targetCpa && conv > 0)
    S.push({ id:'proven', label:'Proven Winner', cat:'scale', weight:105, desc:`Maximum capital efficiency at ${roas.toFixed(1)}× returns. Aggressive scaling enabled.` });

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
  Kill:     { color:'#EF4444', dim:'rgba(239,68,68,.12)',  rowClass:'row-kill' },
  Scale:    { color:'#10B981', dim:'rgba(16,185,129,.12)', rowClass:'row-scale' },
  Upgrade:  { color:'#6366F1', dim:'rgba(99,102,241,.18)', rowClass:'row-upgrade' },
  Optimize: { color:'#F59E0B', dim:'rgba(245,158,11,.12)', rowClass:'row-optimize' },
  Monitor:  { color:'#71717A', dim:'rgba(113,113,122,.1)', rowClass:'row-monitor' },
};

const fmt = (n, pre='₹') => n ? `${pre}${Math.round(n).toLocaleString()}` : '—';

const Dashboard = () => {
  const [targetCpa, setTargetCpa] = useState(50);
  const [selectedAd, setSelectedAd] = useState(null);
  const [filterAction, setFilterAction] = useState('all');

  const page1 = useQuery({ queryKey:['ads',1], queryFn:()=>fetchPage(1) });
  const allRaw = useMemo(() => page1.data?.data || [], [page1.data]);

  const { ads, metrics } = useMemo(() => {
    const processed = allRaw.map(raw => ({ ...raw, ...analyzeAd(raw, targetCpa) }));
    return { 
      ads: processed, 
      metrics: { 
        wasted: processed.filter(a=>a.action==='Kill').reduce((s,a)=>s+(+a.spend||0),0),
        upgrades: processed.filter(a=>a.action==='Upgrade').length 
      } 
    };
  }, [allRaw, targetCpa]);

  const displayed = filterAction === 'all' ? ads : ads.filter(a => a.action === filterAction);

  return (
    <div className="f-body p-10 md:p-20 min-h-screen">
      <Fonts />

      {/* HEADER UNIT */}
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div>
          <h1 className="f-display text-7xl md:text-9xl font-black tracking-tighter text-white mb-4 italic">Apex Impact</h1>
          <p className="text-zinc-500 font-medium tracking-[0.3em] uppercase text-xs flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> Capital Allocation & Yield Control
          </p>
        </div>
        <div className="glass-card p-10 min-w-[320px] transition-transform hover:translate-y-[-4px]">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Wasted Potential</p>
          <div className="f-display text-6xl text-red-500 leading-none">{fmt(metrics.wasted)}</div>
        </div>
      </header>

      {/* STRATEGIC NOTE (NON-MARKETER FRIENDLY) */}
      <div className="mb-12 bg-indigo-950/20 border border-indigo-500/20 p-8 rounded-[2.5rem] flex items-start gap-6 shadow-2xl">
        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-600/20"><Info size={28} /></div>
        <div>
          <h4 className="font-black text-indigo-400 uppercase text-xs tracking-widest mb-2">Operational Protocol</h4>
          <p className="text-indigo-100/80 text-sm leading-relaxed max-w-5xl">
            Profitability auditing live. <strong className="text-white underline decoration-red-500">Kill</strong> indicates pure capital loss. <strong className="text-white underline decoration-emerald-500">Scale</strong> indicates top-tier winners. <strong className="text-white underline decoration-indigo-400 font-black">Upgrade</strong> marks ads that are making money despite poor creative—replace these visuals immediately to maximize ROI.
          </p>
        </div>
      </div>

      {/* NAVIGATION MATRIX */}
      <div className="mb-10 flex flex-wrap gap-4 items-center">
        {['all', 'Kill', 'Scale', 'Upgrade', 'Optimize'].map(f => (
          <button key={f} onClick={() => setFilterAction(f)} className="pill" 
            style={{ padding:'10px 24px', background: filterAction===f?'#fff':'rgba(255,255,255,0.03)', color: filterAction===f?'#000':'#71717a', fontSize:'11px', fontWeight:800 }}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* BATTLEGROUND TABLE */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="p-8 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Directive</th>
              <th className="p-8 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Campaign Unit</th>
              <th className="p-8 text-right text-[10px] font-black uppercase text-zinc-500 tracking-widest">ROAS</th>
              <th className="p-8 text-right text-[10px] font-black uppercase text-zinc-500 tracking-widest">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((ad, i) => (
              <tr key={i} onClick={() => setSelectedAd(ad)} className={`row-base ${A[ad.action]?.rowClass} anim-up`} style={{ animationDelay: `${i*0.04}s` }}>
                <td className="p-8">
                  <span className="px-5 py-2 rounded-full text-[10px] font-black tracking-tighter uppercase" style={{ background:A[ad.action]?.dim, color:A[ad.action]?.color }}>{ad.action}</span>
                </td>
                <td className="p-8">
                  <div className="f-display text-4xl text-white italic tracking-tight">{ad.brand}</div>
                  <div className="text-[11px] font-bold text-zinc-500 uppercase mt-2 tracking-widest">{ad.platform} • {ad.category}</div>
                </td>
                <td className="p-8 text-right">
                  <div className="f-display text-5xl text-white">{(+ad.roas || 0).toFixed(2)}×</div>
                </td>
                <td className="p-8 text-right">
                   <div className="text-2xl font-black">{fmt(+ad.spend)}</div>
                   <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Net Outlay</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INTELLIGENCE DOSSIER (THE FOLDER VIEW) */}
      {selectedAd && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div onClick={()=>setSelectedAd(null)} className="absolute inset-0 bg-black/80 backdrop-blur-2xl" />
          <div className="anim-slide glass-card" style={{ position:'relative', width:'45%', height:'100%', padding:'80px', overflowY:'auto', borderRadius:0, borderLeft:'2px solid rgba(255,255,255,0.1)' }}>
            <button onClick={()=>setSelectedAd(null)} className="absolute top-12 right-12 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white"><X size={32}/></button>
            <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-[0.4em] block mb-6">Internal Intelligence Dossier</span>
            <h2 className="f-display text-8xl text-white italic leading-[0.85] mb-12 tracking-tighter">{selectedAd.brand}</h2>
            
            <div className={`p-10 rounded-[2.5rem] shadow-2xl mb-12 flex flex-col gap-6`} style={{ background:A[selectedAd.action]?.dim, borderLeft:`6px solid ${A[selectedAd.action]?.color}` }}>
              <div className="flex items-center gap-4">
                <Zap size={32} color={A[selectedAd.action]?.color} fill={A[selectedAd.action]?.color} />
                <h3 className="text-3xl font-black uppercase tracking-tighter" style={{ color:A[selectedAd.action]?.color }}>{selectedAd.action} Verdict</h3>
              </div>
              <p className="text-xl font-medium leading-relaxed opacity-90 text-white">{selectedAd.signals[0]?.desc}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-16">
              {[
                { l:'Creative Asset Quality', v:`${(+selectedAd.creative_score).toFixed(1)}/10`, c:(+selectedAd.creative_score < 4 ? '#ef4444' : '#10b981') },
                { l:'Conversion Web Page', v:`${(+selectedAd.landing_page_score).toFixed(1)}/10`, c:'#10b981' },
                { l:'Market Reach (Impr)', v:(+selectedAd.impressions).toLocaleString(), c:'#fff' },
                { l:'Audience Interest (CTR)', v:`${(+selectedAd.ctr).toFixed(2)}%`, c:'#fff' }
              ].map((s, i) => (
                <div key={i} className="glass-card" style={{ padding:'32px', borderRadius:'2.5rem' }}>
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-4">{s.l}</p>
                  <p className="f-display text-5xl tracking-tighter" style={{ color:s.c }}>{s.v}</p>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-zinc-900 pt-12 space-y-10">
               <h4 className="text-sm font-black uppercase tracking-[0.4em] text-white border-b border-zinc-900 pb-4 flex items-center gap-2"><Sparkles size={18}/> Full Asset Context Audit</h4>
               <div className="grid grid-cols-2 gap-y-12">
                 <div><span className="text-[12px] font-black text-zinc-600 uppercase block mb-3">Target Audience</span><span className="text-2xl font-black text-white">{selectedAd.target_audience}</span></div>
                 <div><span className="text-[12px] font-black text-zinc-600 uppercase block mb-3">Creative Theme</span><span className="text-2xl font-black text-indigo-400 italic underline">{selectedAd.creative_theme}</span></div>
                 <div><span className="text-[12px] font-black text-zinc-600 uppercase block mb-3">Video View Rate</span><span className="text-2xl font-black text-white">{selectedAd.video_completion_rate ? `${selectedAd.video_completion_rate}%` : 'N/A'}</span></div>
                 <div><span className="text-[12px] font-black text-zinc-600 uppercase block mb-3">Acquisition Context</span><span className="text-2xl font-black text-white uppercase">{selectedAd.platform} • {selectedAd.ad_type}</span></div>
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