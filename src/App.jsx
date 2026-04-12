import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown, Info, Zap, AlertTriangle, TrendingUp, BarChart3, Globe } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300_000, retry: 1 } },
});

const API = 'https://mosaicfellowship.in/api/data/content/ads';
const fetchPage = async (p) => {
  const r = await fetch(`${API}?page=${p}&limit=100`);
  if (!r.ok) throw new Error(`Page ${p}: ${r.status}`);
  return r.json();
};

// ─── TYPOGRAPHY + LUXURY DESIGN ─────────────────────────────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,400&family=Inter:wght@300;400;600;800&display=swap');

    body { background: #0A0A0B; color: #E4E4E7; margin: 0; font-family: 'Inter', sans-serif; }
    .f-display { font-family: 'Cormorant Garamond', serif; }
    
    .glass-card { 
      background: rgba(255, 255, 255, 0.03); 
      backdrop-filter: blur(12px); 
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
    }

    .table-row {
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
    }
    .table-row:hover { background: rgba(255, 255, 255, 0.02); transform: scale(1.002); }
    
    .status-kill { border-left-color: #EF4444; }
    .status-scale { border-left-color: #10B981; }
    .status-flag { border-left-color: #F59E0B; }
    .status-monitor { border-left-color: #6366F1; }

    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .anim-slide { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  `}</style>
);

// ─── THE GENIUS ENGINE ───────────────────────────────────────────────────────
const analyzeAd = (raw, targetCpa) => {
  const spend = +raw.spend || 0;
  const conv = +raw.conversions || 0;
  const cs = +raw.creative_score || 0;
  const roas = +raw.roas || 0;
  const cpa = +raw.cpa || (conv > 0 ? spend / conv : 0);
  
  // Logic Gates
  if (spend > 3 * targetCpa && conv === 0) return 'Kill';
  if (cs < 4) return 'Flag'; // Creative Rejection Logic
  if (roas > 3 && cpa <= targetCpa) return 'Scale';
  return 'Monitor';
};

// ─── DASHBOARD COMPONENT ─────────────────────────────────────────────────────
const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [targetCpa, setTargetCpa] = useState(50);
  const [selectedAd, setSelectedAd] = useState(null);
  const [filterAction, setFilterAction] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');

  const { data: pageData, isLoading } = useQuery({ 
    queryKey: ['ads', page], 
    queryFn: () => fetchPage(page) 
  });

  const processedAds = useMemo(() => {
    if (!pageData?.data) return [];
    return pageData.data.map(ad => ({
      ...ad,
      calculatedAction: analyzeAd(ad, targetCpa),
      spend: +ad.spend || 0,
      roas: +ad.roas || 0,
      cpa: +ad.cpa || (+ad.conversions > 0 ? +ad.spend / +ad.conversions : 0)
    }));
  }, [pageData, targetCpa]);

  const filteredAds = useMemo(() => {
    return processedAds.filter(ad => {
      const matchAction = filterAction === 'all' || ad.calculatedAction === filterAction;
      const matchPlatform = filterPlatform === 'all' || ad.platform === filterPlatform;
      return matchAction && matchPlatform;
    });
  }, [processedAds, filterAction, filterPlatform]);

  const platforms = useMemo(() => [...new Set(processedAds.map(a => a.platform))], [processedAds]);

  return (
    <div className="p-6 md:p-12 min-h-screen">
      <Fonts />

      {/* HEADER SECTION */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="f-display text-6xl md:text-8xl font-bold tracking-tighter text-white mb-2">APEX IMPACT</h1>
          <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" /> Strategic Growth Control Center
          </p>
        </div>
        <div className="glass-card p-6 min-w-[240px]">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target Acquisition Cost</p>
          <div className="flex items-center gap-3">
            <Target className="text-emerald-500" size={20} />
            <input 
              type="number" 
              value={targetCpa} 
              onChange={(e) => setTargetCpa(e.target.value)}
              className="bg-transparent border-b border-zinc-800 text-3xl font-bold text-white outline-none w-24"
            />
          </div>
        </div>
      </header>

      {/* THE STRATEGIC NOTE (Plain English for Everyone) */}
      <section className="mb-10 bg-indigo-950/30 border border-indigo-500/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="bg-indigo-500 p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <Info size={28} />
        </div>
        <div>
          <h4 className="text-indigo-300 font-bold uppercase text-xs tracking-widest mb-2">How this system works</h4>
          <p className="text-indigo-100/80 text-sm leading-relaxed max-w-4xl">
            This dashboard acts as an automated auditor. It scans every ad to see if it's profitable. 
            <span className="text-white font-bold ml-1 italic underline decoration-red-500">Kill</span> means the ad is wasting money. 
            <span className="text-white font-bold ml-1 italic underline decoration-emerald-500">Scale</span> means it's a winner—spend more. 
            <span className="text-white font-bold ml-1 italic underline decoration-orange-500">Flag</span> means the ad quality is low and the platform is penalizing you.
          </p>
        </div>
      </section>

      {/* FILTER MATRIX */}
      <div className="mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
          {['all', 'Kill', 'Scale', 'Flag', 'Monitor'].map(act => (
            <button 
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${filterAction === act ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              {act.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
          <button onClick={() => setFilterPlatform('all')} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${filterPlatform === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>ALL PLATFORMS</button>
          {platforms.map(p => (
            <button 
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${filterPlatform === p ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p-1))} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500"><ChevronLeft size={20}/></button>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Page {page}</span>
          <button onClick={() => setPage(p => p+1)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* THE TABLE */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/20">
              <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Branding</th>
              <th className="p-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-right">Performance</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="3" className="p-20 text-center text-zinc-600 font-display italic text-2xl animate-pulse">Syncing Intelligence...</td></tr>
            ) : filteredAds.map((ad, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedAd(ad)}
                className={`table-row cursor-pointer border-b border-zinc-900/50 status-${ad.calculatedAction.toLowerCase()}`}
              >
                <td className="p-6">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                    ${ad.calculatedAction === 'Kill' ? 'bg-red-500/10 text-red-500' : 
                      ad.calculatedAction === 'Scale' ? 'bg-emerald-500/10 text-emerald-500' : 
                      ad.calculatedAction === 'Flag' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                    {ad.calculatedAction}
                  </span>
                </td>
                <td className="p-6">
                  <div className="f-display text-2xl text-white italic">{ad.brand}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase mt-1">{ad.platform} • {ad.category}</div>
                </td>
                <td className="p-6 text-right">
                  <div className="text-3xl font-black text-white tracking-tighter">{ad.roas.toFixed(2)}x</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">${ad.cpa.toFixed(2)} CPA</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* THE INTELLIGENCE DOSSIER (MODAL) */}
      {selectedAd && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-xl bg-[#0F0F10] h-full shadow-2xl border-l border-zinc-800 p-12 overflow-y-auto anim-slide">
            
            <button onClick={() => setSelectedAd(null)} className="absolute top-8 right-8 p-3 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
              <X size={24} />
            </button>

            <div className="mb-12">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 block">Asset Intelligence Unit</span>
              <h2 className="f-display text-6xl text-white italic leading-none mb-4">{selectedAd.brand}</h2>
              <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">{selectedAd.platform} • {selectedAd.ad_type} • {selectedAd.category}</p>
            </div>

            {/* STRATEGIC VERDICT CARD */}
            <div className={`p-8 rounded-3xl mb-12 flex flex-col gap-4 shadow-2xl
              ${selectedAd.calculatedAction === 'Kill' ? 'bg-red-600 text-white' : 
                selectedAd.calculatedAction === 'Scale' ? 'bg-emerald-600 text-white' : 
                selectedAd.calculatedAction === 'Flag' ? 'bg-orange-600 text-white' : 'bg-indigo-600 text-white'}`}>
              <div className="flex items-center gap-3">
                <Zap size={24} fill="currentColor" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">Strategic Verdict: {selectedAd.calculatedAction}</h3>
              </div>
              <p className="text-lg font-medium leading-relaxed opacity-90">
                {selectedAd.calculatedAction === 'Kill' ? 'Critical money leak detected. Shutdown advised.' : 
                 selectedAd.calculatedAction === 'Scale' ? 'Asset is over-performing. Increase budget by 20%.' : 
                 selectedAd.calculatedAction === 'Flag' ? 'Creative quality is too low. The algorithm is penalizing you.' : 'Monitoring for more data.'}
              </p>
            </div>

            {/* PERFORMANCE GRID */}
            <div className="grid grid-cols-2 gap-6 mb-12">
              <StatBox label="Creative Score" value={`${(+selectedAd.creative_score).toFixed(1)}/10`} color={+selectedAd.creative_score < 4 ? 'text-red-500' : 'text-emerald-500'} />
              <StatBox label="Landing Page" value={`${(+selectedAd.landing_page_score).toFixed(1)}/10`} color={+selectedAd.landing_page_score < 5 ? 'text-red-500' : 'text-emerald-500'} />
              <StatBox label="Impressions" value={(+selectedAd.impressions).toLocaleString()} />
              <StatBox label="Engagement Rate" value={`${(+selectedAd.ctr).toFixed(2)}%`} />
            </div>

            {/* DEEP ASSET AUDIT */}
            <div className="border-t border-zinc-800 pt-10 space-y-8">
              <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] flex items-center gap-2"><Sparkles size={12}/> Asset Context Audit</h4>
              <div className="grid grid-cols-2 gap-y-8">
                <AuditItem label="Target Audience" value={selectedAd.target_audience} />
                <AuditItem label="Creative Theme" value={selectedAd.creative_theme} />
                <AuditItem label="Video Completion" value={selectedAd.video_completion_rate ? `${selectedAd.video_completion_rate}%` : 'N/A'} />
                <AuditItem label="Freq / CPC" value={`${(+selectedAd.frequency).toFixed(2)}x / $${(+selectedAd.cpc).toFixed(2)}`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, color = "text-white" }) => (
  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">{label}</p>
    <p className={`text-4xl font-black tracking-tighter ${color}`}>{value}</p>
  </div>
);

const AuditItem = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-xl font-bold text-white uppercase tracking-tight">{value || 'N/A'}</p>
  </div>
);

const ChevronLeft = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRight = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}