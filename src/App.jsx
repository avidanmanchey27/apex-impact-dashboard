import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MessageCircle, Camera, Tv, Globe, Users, Image as ImageIcon, Activity, X, Crosshair, Zap, Filter, Target, MousePointer2, TrendingUp, Sparkles } from 'lucide-react';

const queryClient = new QueryClient();

// --- PLATFORM IDENTITY ---
const getPlatformIdentity = (platform = "") => {
  const p = platform.toLowerCase();
  if (p.includes('meta') || p.includes('facebook')) return { icon: <MessageCircle size={18} />, name: "Meta" };
  if (p.includes('instagram')) return { icon: <Camera size={18} />, name: "Instagram" };
  if (p.includes('youtube')) return { icon: <Tv size={18} />, name: "YouTube" };
  if (p.includes('google')) return { icon: <Globe size={18} />, name: "Google" };
  return { icon: <Globe size={18} />, name: platform || "Network" };
};

// --- GENIUS STRATEGIC ENGINE ---
const getStrategicVerdict = (ad, targetCpa) => {
  if (ad.spend > (3 * targetCpa) && ad.conversions === 0) {
    return { title: "CAPITAL BLEED", analysis: "Critical budget leak. Zero conversion intent. Terminate immediately to preserve capital.", colors: "bg-red-700 text-white shadow-2xl" };
  }
  if (ad.creativeScore < 3 && ad.lpScore < 5) {
    return { title: "SYSTEMIC FAILURE", analysis: "Total funnel rejection. Both creative and landing page assets are failing quality checks.", colors: "bg-slate-950 text-white shadow-2xl" };
  }
  if (ad.ctr > 1.5 && ad.lpScore < 6) {
    return { title: "CLICKBAIT TRAP", analysis: "Ad hook is working, but the site experience is killing the sale. Fix landing page friction.", colors: "bg-amber-600 text-white shadow-2xl" };
  }
  if (ad.roas > 3 && ad.cpa <= targetCpa) {
    return { title: "PROVEN WINNER", analysis: "High-yield multiplier. Performance is optimal. Aggressive budget scaling recommended.", colors: "bg-emerald-900 text-white shadow-2xl" };
  }
  return { title: "MONITOR", analysis: "Stable baseline. No structural failure detected. Gathering intelligence for 48h trend analysis.", colors: "bg-indigo-700 text-white shadow-2xl" };
};

const EditorialChronicle = () => {
  const [page, setPage] = useState(1);
  const [selectedAd, setSelectedAd] = useState(null); 
  const [activeFilter, setActiveFilter] = useState({ type: 'all', value: null });
  const targetCpa = 50; 

  const { data, isLoading } = useQuery({
    queryKey: ['adData', page],
    queryFn: async () => {
      const res = await fetch(`https://mosaicfellowship.in/api/data/content/ads?page=${page}&limit=100`);
      return res.json();
    },
    keepPreviousData: true
  });

  const { processedAds, metrics, filterOptions } = useMemo(() => {
    if (!data?.data) return { processedAds: [], metrics: {}, filterOptions: {} };

    let totalSpend = 0, wastedSpend = 0;
    const platforms = new Set();

    let ads = data.data.map(ad => {
      const spend = parseFloat(ad.spend) || 0;
      const conversions = parseInt(ad.conversions) || 0;
      const ctr = parseFloat(ad.ctr) || 0; 
      const cpa = parseFloat(ad.cpa) || (conversions > 0 ? spend / conversions : 0);
      const roas = parseFloat(ad.roas) || 0;

      let action = 'Monitor';
      let themeClass = 'bg-amber-600 text-white border-amber-700'; 
      let rowClass = 'hover:bg-amber-50/50 border-l-amber-600';

      if (spend > (3 * targetCpa) && conversions === 0) {
        action = 'Kill';
        themeClass = 'bg-red-700 text-white border-red-800'; 
        rowClass = 'hover:bg-red-50/50 border-l-red-700';
        wastedSpend += spend;
      } else if (cpa <= targetCpa && conversions > 0 && roas > 2.5) {
        action = 'Scale';
        themeClass = 'bg-emerald-900 text-white border-emerald-950'; 
        rowClass = 'hover:bg-emerald-50/50 border-l-emerald-900';
      }

      totalSpend += spend;
      if (ad.platform) platforms.add(ad.platform);

      const formatted = { 
        ...ad, spend, roas, cpa, ctr, action, themeClass, rowClass,
        brandName: ad.brand || "Unknown Brand",
        identity: getPlatformIdentity(ad.platform),
        creativeScore: parseFloat(ad.creative_score) || 0,
        lpScore: parseFloat(ad.landing_page_score) || 0,
        vcr: parseFloat(ad.video_completion_rate) || 0,
        conversions: parseInt(ad.conversions) || 0,
        impressions: parseInt(ad.impressions) || 0,
        clicks: parseInt(ad.clicks) || 0,
        frequency: parseFloat(ad.frequency) || 0,
        cpc: parseFloat(ad.cpc) || 0,
        creative_theme: ad.creative_theme || "Standard"
      };
      formatted.verdict = getStrategicVerdict(formatted, targetCpa);
      return formatted;
    });

    if (activeFilter.type === 'directive') ads = ads.filter(a => a.action === activeFilter.value);
    if (activeFilter.type === 'platform') ads = ads.filter(a => a.platform === activeFilter.value);

    return {
      processedAds: ads.sort((a, b) => (a.action === 'Kill' ? -1 : a.action === 'Scale' ? 0 : 1)),
      metrics: { wasted: wastedSpend.toLocaleString() },
      filterOptions: { platforms: Array.from(platforms) }
    };
  }, [data, activeFilter]);

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-slate-900 p-4 md:p-12 font-['Inter',sans-serif]">
      
      {/* HEADER */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-200 pb-10">
        <div>
          <h1 className="font-['Bodoni_Moda'] text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-2">APEX IMPACT</h1>
          <p className="text-xl font-medium text-slate-600 flex items-center gap-2 tracking-tight">
            <TrendingUp size={20} className="text-emerald-600"/> Strategic Growth Control Center
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 min-w-[280px] transition-all hover:translate-y-[-4px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Wasted Potential</p>
          <p className="text-6xl font-black text-red-600 tracking-tighter">${metrics.wasted}</p>
        </div>
      </header>

      {/* COMMAND CENTER FILTERS */}
      <div className="mb-10 flex flex-wrap gap-3 items-center">
        <button onClick={() => setActiveFilter({ type: 'all', value: null })} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${activeFilter.type === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'}`}>All Assets</button>
        <div className="h-6 w-[1px] bg-slate-300 mx-2" />
        {['Kill', 'Scale', 'Monitor'].map(d => (
          <button key={d} onClick={() => setActiveFilter({ type: 'directive', value: d })} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${activeFilter.value === d ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'}`}>{d.toUpperCase()}</button>
        ))}
        {filterOptions.platforms?.map(p => (
           <button key={p} onClick={() => setActiveFilter({ type: 'platform', value: p })} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${activeFilter.value === p ? 'bg-blue-700 text-white border-blue-800 shadow-xl scale-105' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'}`}>{p.toUpperCase()}</button>
        ))}
      </div>

      {/* SCANNABLE FRONT PAGE TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 uppercase text-[11px] font-black tracking-[0.15em]">
              <th className="p-8">Directive</th>
              <th className="p-8">Branding</th>
              <th className="p-8 text-right">Impact Factor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? <tr><td colSpan="3" className="p-40 text-center font-bold text-slate-300 italic text-2xl animate-pulse">Syncing Intelligence...</td></tr> : 
              processedAds.map((ad, i) => (
              <tr key={i} onClick={() => setSelectedAd(ad)} className={`cursor-pointer transition-all border-l-[8px] border-l-transparent group ${ad.rowClass}`}>
                <td className="p-8">
                  <span className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider border-2 shadow-sm ${ad.themeClass}`}>{ad.action}</span>
                </td>
                <td className="p-8">
                  <div className="font-['Bodoni_Moda'] font-black text-4xl text-slate-900 mb-1 group-hover:text-slate-700 transition-colors tracking-tight">{ad.brandName}</div>
                  <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    {ad.category} <span className="w-1.5 h-1.5 rounded-full bg-slate-200" /> {ad.identity.name}
                  </div>
                </td>
                <td className="p-8 text-right">
                  <span className="font-black text-6xl tracking-tighter block text-slate-900">{ad.roas.toFixed(2)}x</span>
                  <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">${ad.cpa.toFixed(2)} CPA</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INTELLIGENCE DOSSIER (DEEP DATA BINDING) */}
      {selectedAd && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-[-30px_0_80px_rgba(0,0,0,0.15)] p-12 md:p-16 flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-100">
            
            <button onClick={() => setSelectedAd(null)} className="self-end mb-8 p-3 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-all hover:scale-110 shadow-sm">
              <X size={28} />
            </button>
            
            <div className="mb-12">
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">Deep Intelligence Dossier</p>
              <h2 className="font-['Bodoni_Moda'] font-black text-6xl md:text-7xl leading-tight tracking-tighter text-slate-900">
                {selectedAd.brandName}
              </h2>
            </div>

            {/* ACTION VERDICT */}
            <div className={`p-10 rounded-[2.5rem] shadow-2xl mb-12 flex flex-col gap-6 ${selectedAd.verdict.colors}`}>
              <div className="flex items-center gap-4">
                <Zap size={32} fill="currentColor"/>
                <h3 className="text-3xl font-black uppercase tracking-wider">{selectedAd.verdict.title}</h3>
              </div>
              <p className="text-xl font-medium opacity-90 leading-relaxed font-['Inter']">{selectedAd.verdict.analysis}</p>
            </div>

            {/* PERFORMANCE HEATMAP */}
            <div className="grid grid-cols-2 gap-8 mb-16">
              {[
                { label: 'Creative Quality', value: `${selectedAd.creativeScore.toFixed(1)}/10`, color: selectedAd.creativeScore < 5 ? 'text-red-600' : 'text-emerald-600' },
                { label: 'Landing Page Opt', value: `${selectedAd.lpScore.toFixed(1)}/10`, color: selectedAd.lpScore < 5 ? 'text-red-600' : 'text-emerald-600' },
                { label: 'Volume (Impr)', value: selectedAd.impressions.toLocaleString(), color: 'text-slate-900' },
                { label: 'Engagement (CTR)', value: `${selectedAd.ctr.toFixed(2)}%`, color: 'text-slate-900' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 transition-transform hover:scale-[1.03] shadow-sm">
                  <p className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-4">{stat.label}</p>
                  <p className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* DEEP ASSET AUDIT (HIGH CONTRAST) */}
            <div className="pt-12 border-t-2 border-slate-900 space-y-12 mb-10">
               <h4 className="text-sm font-black uppercase tracking-[0.5em] text-slate-900 pb-4 border-b border-slate-200 flex items-center gap-2">
                 <Sparkles size={18} className="text-indigo-600"/> Final Asset Audit
               </h4>
               <div className="grid grid-cols-2 gap-y-12">
                 <div>
                    <span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Target Audience</span>
                    <span className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedAd.target_audience || "Universal"}</span>
                 </div>
                 <div>
                    <span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Creative Theme</span>
                    <span className="text-2xl font-black text-slate-900 uppercase tracking-tight italic text-indigo-700">{selectedAd.creative_theme}</span>
                 </div>
                 <div>
                    <span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Video Completion</span>
                    <span className="text-2xl font-black text-slate-900">{selectedAd.vcr > 0 ? `${selectedAd.vcr}%` : 'N/A'}</span>
                 </div>
                 <div>
                    <span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Efficiency (CPC)</span>
                    <span className="text-2xl font-black text-slate-900">${selectedAd.cpc.toFixed(2)}</span>
                 </div>
                 <div>
                    <span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Ad Frequency</span>
                    <span className="text-2xl font-black text-slate-900">{selectedAd.frequency.toFixed(2)}x</span>
                 </div>
                 <div>
                    <span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Platform Logic</span>
                    <span className="text-2xl font-black text-slate-900 uppercase flex items-center gap-2">{selectedAd.identity.name} <span className="text-slate-400">•</span> {selectedAd.ad_type}</span>
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
      <EditorialChronicle />
    </QueryClientProvider>
  );
}