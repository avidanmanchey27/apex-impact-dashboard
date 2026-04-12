import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MessageCircle, Camera, Tv, Globe, Users, Image as ImageIcon, Activity, X, Crosshair, Zap, Filter, Target, MousePointer2, TrendingUp, Sparkles, Info } from 'lucide-react';

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

// --- STRATEGIC ENGINE (BUSINESS LOGIC) ---
const getStrategicVerdict = (ad, targetCpa) => {
  if (ad.spend > (3 * targetCpa) && ad.conversions === 0) {
    return { title: "MONEY LEAK", analysis: "This ad is taking your money but giving nothing back. Shut it down now to save your budget.", colors: "bg-red-700 text-white shadow-xl" };
  }
  if (ad.creativeScore < 3 && ad.lpScore < 5) {
    return { title: "DOUBLE FAILURE", analysis: "Both the ad and the website are failing. People don't like the ad, and they don't trust the site.", colors: "bg-slate-950 text-white shadow-xl" };
  }
  if (ad.creativeScore < 4) {
    return { title: "BAD FIRST IMPRESSION", analysis: "The ad 'quality' is too low. The platform is charging you extra because it doesn't like your ad content.", colors: "bg-orange-600 text-white shadow-xl" };
  }
  if (ad.roas > 3 && ad.cpa <= targetCpa) {
    return { title: "GOLDEN AD", analysis: "This is making you a lot of money very cheaply. You should increase the budget here immediately.", colors: "bg-emerald-900 text-white shadow-xl" };
  }
  return { title: "WATCHING", analysis: "It's too early to tell. We are letting it run for 2 more days to see if it starts making sales.", colors: "bg-indigo-700 text-white shadow-xl" };
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
      } else if (parseFloat(ad.creative_score) < 4) {
        action = 'Flag';
        themeClass = 'bg-orange-600 text-white border-orange-700';
        rowClass = 'hover:bg-orange-50/50 border-l-orange-600';
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
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-200 pb-10">
        <div>
          <h1 className="font-['Bodoni_Moda'] text-6xl md:text-8xl font-black tracking-tighter text-slate-900 mb-2">APEX IMPACT</h1>
          <p className="text-xl font-medium text-slate-600 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600"/> Money-In vs Money-Out Control Center
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 min-w-[280px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Money Wasted So Far</p>
          <p className="text-6xl font-black text-red-600 tracking-tighter">${metrics.wasted}</p>
        </div>
      </header>

      {/* PLAIN ENGLISH EXPLANATION */}
      <div className="mb-10 bg-blue-50 border border-blue-100 p-8 rounded-[2rem] flex items-start gap-5 shadow-sm">
        <div className="bg-blue-600 p-3 rounded-2xl text-white"><Info size={24} /></div>
        <div>
          <h4 className="font-black text-blue-900 uppercase text-xs tracking-[0.2em] mb-2">How to read this dashboard</h4>
          <p className="text-blue-800 text-sm leading-relaxed max-w-5xl font-medium">
            This system watches your ads like a hawk. 
            <strong className="mx-1 underline text-red-700">Kill:</strong> Ads that are burning cash for too long without making a single sale. 
            <strong className="mx-1 underline text-emerald-800">Scale:</strong> Ads that are bringing in customers for very cheap—give them more budget! 
            <strong className="mx-1 underline text-orange-700">Flag:</strong> Ads that the social media platforms (Meta/Google) don't like—usually because they look messy or uninteresting.
          </p>
        </div>
      </div>

      {/* FILTER & PAGINATION BAR */}
      <div className="mb-8 flex flex-wrap justify-between items-center gap-6">
        <div className="flex flex-wrap gap-3 items-center">
            <button onClick={() => setActiveFilter({ type: 'all', value: null })} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm ${activeFilter.type === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Show All</button>
            <div className="h-6 w-[1px] bg-slate-300 mx-1" />
            {['Kill', 'Scale', 'Flag', 'Monitor'].map(d => (
            <button key={d} onClick={() => setActiveFilter({ type: 'directive', value: d })} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm ${activeFilter.value === d ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{d.toUpperCase()}</button>
            ))}
            <div className="h-6 w-[1px] bg-slate-300 mx-1" />
            {filterOptions.platforms?.map(p => (
            <button key={p} onClick={() => setActiveFilter({ type: 'platform', value: p })} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm ${activeFilter.value === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>{p.toUpperCase()}</button>
            ))}
        </div>

        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-lg border border-slate-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 hover:text-emerald-600 transition-colors"><ChevronLeft size={24}/></button>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} className="p-1 hover:text-emerald-600 transition-colors"><ChevronRight size={24}/></button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 uppercase text-[11px] font-black tracking-[0.2em]">
              <th className="p-8">Status</th>
              <th className="p-8">Ad Name</th>
              <th className="p-8 text-right">Money Efficiency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? <tr><td colSpan="3" className="p-40 text-center font-bold text-slate-300 text-2xl animate-pulse">Checking The Data...</td></tr> : 
              processedAds.map((ad, i) => (
              <tr key={i} onClick={() => setSelectedAd(ad)} className={`cursor-pointer transition-all border-l-[10px] border-l-transparent group ${ad.rowClass}`}>
                <td className="p-8">
                  <span className={`px-5 py-2 rounded-full text-[11px] font-black uppercase border-2 shadow-sm ${ad.themeClass}`}>{ad.action}</span>
                </td>
                <td className="p-8">
                  <div className="font-['Bodoni_Moda'] font-black text-4xl text-slate-900 mb-1 group-hover:text-slate-700 tracking-tight">{ad.brandName}</div>
                  <div className="text-[12px] font-bold text-slate-500 uppercase flex items-center gap-2">
                    {ad.category} <span className="w-2 h-2 rounded-full bg-slate-200" /> {ad.identity.name}
                  </div>
                </td>
                <td className="p-8 text-right">
                  <span className="font-black text-6xl tracking-tighter block text-slate-900">{ad.roas.toFixed(2)}x</span>
                  <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">${ad.cpa.toFixed(2)} Per Customer</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INTELLIGENCE PANEL */}
      {selectedAd && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto p-12 md:p-16 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500 border-l border-slate-100">
            
            <button onClick={() => setSelectedAd(null)} className="self-end mb-8 p-4 bg-slate-100 rounded-full text-slate-600 hover:text-slate-900 shadow-sm transition-all hover:scale-110">
              <X size={32} />
            </button>
            
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.5em] mb-4">Detailed View</p>
            <h2 className="font-['Bodoni_Moda'] font-black text-6xl md:text-7xl leading-tight tracking-tighter text-slate-900 mb-12">
              {selectedAd.brandName}
            </h2>

            <div className={`p-10 rounded-[2.5rem] shadow-2xl mb-12 flex flex-col gap-6 ${selectedAd.verdict.colors}`}>
              <div className="flex items-center gap-4">
                <Zap size={32} fill="currentColor"/>
                <h3 className="text-3xl font-black uppercase tracking-wider">{selectedAd.verdict.title}</h3>
              </div>
              <p className="text-xl font-medium opacity-95 leading-relaxed">{selectedAd.verdict.analysis}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-16">
              {[
                { label: 'Creative Look', value: `${selectedAd.creativeScore.toFixed(1)}/10`, color: selectedAd.creativeScore < 4 ? 'text-red-600' : 'text-emerald-700' },
                { label: 'Website Score', value: `${selectedAd.lpScore.toFixed(1)}/10`, color: selectedAd.lpScore < 5 ? 'text-red-600' : 'text-emerald-700' },
                { label: 'Total Views', value: selectedAd.impressions.toLocaleString(), color: 'text-slate-900' },
                { label: 'People Interested', value: `${selectedAd.ctr.toFixed(2)}%`, color: 'text-slate-900' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 transition-transform hover:scale-[1.03] shadow-sm">
                  <p className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-4">{stat.label}</p>
                  <p className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="pt-12 border-t-2 border-slate-900 space-y-12 mb-10">
               <h4 className="text-sm font-black uppercase tracking-[0.5em] text-slate-900 pb-4 border-b border-slate-200 flex items-center gap-2">
                 <Sparkles size={20} className="text-indigo-600"/> Extra Data Points
               </h4>
               <div className="grid grid-cols-2 gap-y-12">
                 <div><span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Target Audience</span><span className="text-2xl font-black text-slate-900 uppercase">{selectedAd.target_audience || "Everyone"}</span></div>
                 <div><span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Ad Style</span><span className="text-2xl font-black text-indigo-700 italic">{selectedAd.creative_theme}</span></div>
                 <div><span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Video Watched</span><span className="text-2xl font-black text-slate-900">{selectedAd.vcr > 0 ? `${selectedAd.vcr}%` : 'N/A'}</span></div>
                 <div><span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Cost Per Click</span><span className="text-2xl font-black text-slate-900">${selectedAd.cpc.toFixed(2)}</span></div>
                 <div><span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Ad Repeat Count</span><span className="text-2xl font-black text-slate-900">{selectedAd.frequency.toFixed(2)}x</span></div>
                 <div><span className="text-[12px] font-black text-slate-900 uppercase block mb-3 tracking-[0.2em]">Where It Ran</span><span className="text-2xl font-black text-slate-900 uppercase">{selectedAd.identity.name} • {selectedAd.ad_type}</span></div>
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