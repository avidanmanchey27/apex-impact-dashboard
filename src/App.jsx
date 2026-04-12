import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, BookOpen, MessageCircle, Camera, Tv, Globe, Users, Image as ImageIcon, Activity, X, Crosshair, Zap, Filter } from 'lucide-react';

const queryClient = new QueryClient();

// --- Safe Platform Icons ---
const getPlatformIdentity = (platform = "") => {
  const p = platform.toLowerCase();
  if (p.includes('meta') || p.includes('facebook')) return { icon: <MessageCircle size={16} />, name: "Meta" };
  if (p.includes('instagram')) return { icon: <Camera size={16} />, name: "Instagram" };
  if (p.includes('youtube')) return { icon: <Tv size={16} />, name: "YouTube" };
  if (p.includes('google')) return { icon: <Globe size={16} />, name: "Google" };
  return { icon: <Globe size={16} />, name: platform || "Network" };
};

// --- STRATEGIC VERDICT ENGINE ---
const getStrategicVerdict = (ad, targetCpa) => {
  if (ad.spend > (3 * targetCpa) && ad.conversions === 0) {
    return { title: "CAPITAL BLEED", analysis: "Zero intent. High spend. This is a budget leak. Kill immediately.", colors: "bg-[#DC2626] text-white" };
  }
  if (ad.creativeScore < 3 && ad.lpScore < 5) {
    return { title: "SYSTEMIC FAILURE", analysis: "Creative and Webpage are both failing. Rebuild the entire funnel.", colors: "bg-[#7F1D1D] text-white" };
  }
  if (ad.ctr > 1.5 && ad.lpScore < 6) {
    return { title: "CLICKBAIT TRAP", analysis: "Good ad, bad site. You are losing customers at the finish line.", colors: "bg-[#F59E0B] text-black" };
  }
  if (ad.roas > 3 && ad.cpa <= targetCpa) {
    return { title: "PROVEN WINNER", analysis: "Maximum efficiency. Pour more fuel (budget) into this immediately.", colors: "bg-[#22C55E] text-white" };
  }
  return { title: "MONITOR", analysis: "Gathering data. No structural failure detected yet.", colors: "bg-[#1A1A1A] text-white" };
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

    let totalSpend = 0, totalRevenue = 0, totalConversions = 0, wastedSpend = 0;
    const platforms = new Set();
    const categories = new Set();

    let ads = data.data.map(ad => {
      const spend = parseFloat(ad.spend) || 0;
      const revenue = parseFloat(ad.revenue) || 0;
      const conversions = parseInt(ad.conversions) || 0;
      const ctr = parseFloat(ad.ctr) || 0; 
      const cpa = parseFloat(ad.cpa) || (conversions > 0 ? spend / conversions : 0);
      const roas = parseFloat(ad.roas) || (spend > 0 ? revenue / spend : 0);

      let action = 'Monitor';
      let themeClass = 'bg-[#FDE047] text-[#713F12] border-[#EAB308]'; 
      let rowClass = 'bg-[#FEFCE8] hover:bg-[#FEF9C3] border-l-8 border-l-[#FACC15]';

      if (spend > (3 * targetCpa) && conversions === 0) {
        action = 'Kill';
        themeClass = 'bg-[#DC2626] text-white border-[#991B1B]'; 
        rowClass = 'bg-[#FEF2F2] hover:bg-[#FEE2E2] border-l-8 border-l-[#DC2626]';
        wastedSpend += spend;
      } else if (cpa <= targetCpa && conversions > 0 && roas > 2.5) {
        action = 'Scale';
        themeClass = 'bg-[#22C55E] text-white border-[#16A34A]'; 
        rowClass = 'bg-[#F0FDF4] hover:bg-[#DCFCE7] border-l-8 border-l-[#22C55E]';
      }

      totalSpend += spend; totalRevenue += revenue; totalConversions += conversions;
      platforms.add(ad.platform);
      categories.add(ad.category);

      const formatted = { 
        ...ad, spend, revenue, roas, cpa, ctr, action, themeClass, rowClass,
        brandName: ad.brand || "Unknown Brand",
        identity: getPlatformIdentity(ad.platform),
        impressions: parseInt(ad.impressions) || 0,
        clicks: parseInt(ad.clicks) || 0,
        creativeScore: parseFloat(ad.creative_score) || 0,
        lpScore: parseFloat(ad.landing_page_score) || 0,
        conversions
      };
      formatted.verdict = getStrategicVerdict(formatted, targetCpa);
      return formatted;
    });

    // APPLY FILTERS
    if (activeFilter.type === 'directive') ads = ads.filter(a => a.action === activeFilter.value);
    if (activeFilter.type === 'platform') ads = ads.filter(a => a.platform === activeFilter.value);
    if (activeFilter.type === 'category') ads = ads.filter(a => a.category === activeFilter.value);

    return {
      processedAds: ads.sort((a, b) => (a.action === 'Kill' ? -1 : a.action === 'Scale' ? 0 : 1)),
      metrics: {
        roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00',
        cac: totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '0.00',
        wasted: wastedSpend.toLocaleString(),
      },
      filterOptions: { platforms: Array.from(platforms), categories: Array.from(categories) }
    };
  }, [data, activeFilter]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] p-4 md:p-8 font-['DM_Mono']">
      
      <header className="mb-10 border-b-4 border-[#1A1A1A] pb-6 flex justify-between items-end">
        <div>
          <h1 className="font-['Bodoni_Moda'] text-6xl md:text-8xl font-black leading-none mb-2 tracking-tighter">APEX IMPACT</h1>
          <p className="text-xl font-['Bodoni_Moda'] italic text-[#4A4A4A]">Command & Control Center</p>
        </div>
        <div className="text-right border-2 border-[#1A1A1A] p-4 bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#737373]">Live Wasted Spend</p>
          <p className="text-4xl font-black text-[#DC2626]">${metrics.wasted}</p>
        </div>
      </header>

      {/* STRATEGIC FILTERS BAR */}
      <div className="mb-8 flex flex-wrap gap-3 items-center bg-[#1A1A1A] p-4 shadow-xl">
        <div className="flex items-center gap-2 text-[#FACC15] mr-4 border-r border-[#4A4A4A] pr-4">
          <Filter size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Filter Ops</span>
        </div>
        
        <button 
          onClick={() => setActiveFilter({ type: 'all', value: null })}
          className={`px-3 py-1 text-[10px] font-bold border ${activeFilter.type === 'all' ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'text-white border-[#4A4A4A]'}`}
        >ALL ADS</button>

        {['Kill', 'Scale', 'Monitor'].map(d => (
          <button 
            key={d}
            onClick={() => setActiveFilter({ type: 'directive', value: d })}
            className={`px-3 py-1 text-[10px] font-bold border ${activeFilter.value === d ? 'bg-white text-black' : 'text-white border-[#4A4A4A]'}`}
          >{d.toUpperCase()}</button>
        ))}

        <div className="h-4 w-[1px] bg-[#4A4A4A] mx-2" />

        {filterOptions.platforms?.slice(0, 4).map(p => (
          <button 
            key={p}
            onClick={() => setActiveFilter({ type: 'platform', value: p })}
            className={`px-3 py-1 text-[10px] font-bold border ${activeFilter.value === p ? 'bg-blue-500 text-white' : 'text-white border-[#4A4A4A]'}`}
          >{p.toUpperCase()}</button>
        ))}
      </div>

      {/* MAIN TABLE */}
      <div className="overflow-x-auto shadow-2xl border-2 border-[#1A1A1A] bg-white mb-20 relative z-10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#1A1A1A] text-white uppercase tracking-widest text-xs font-bold">
              <th className="p-5 w-1/5">Directive</th>
              <th className="p-5 w-1/3">Campaign</th>
              <th className="p-5 text-right">Impact Score</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#E5E5E5]">
            {isLoading ? <tr><td colSpan="3" className="p-20 text-center font-black text-2xl">SYNCING DATA...</td></tr> : 
              processedAds.map((ad, i) => (
              <tr key={i} onClick={() => setSelectedAd(ad)} className={`cursor-pointer transition-all hover:scale-[1.002] ${ad.rowClass}`}>
                <td className="p-5">
                  <div className={`inline-block px-4 py-2 text-xs font-black uppercase tracking-widest border-2 ${ad.themeClass}`}>{ad.action}</div>
                </td>
                <td className="p-5">
                  <div className="font-['Bodoni_Moda'] font-black text-3xl leading-none mb-2">{ad.brandName}</div>
                  <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-[#4A4A4A]">
                    <span className="bg-white px-2 py-0.5 border border-[#E5E5E5]">{ad.category}</span>
                    <span className="flex items-center gap-1">{ad.identity.icon} {ad.identity.name}</span>
                  </div>
                </td>
                <td className="p-5 text-right">
                  <span className="text-[10px] text-[#737373] uppercase tracking-widest font-bold block mb-1">ROAS / CPA</span>
                  <span className={`font-black text-4xl tracking-tighter ${ad.roas > 3 ? 'text-[#16A34A]' : 'text-[#1A1A1A]'}`}>{ad.roas.toFixed(2)}x</span>
                  <span className="text-sm font-bold text-[#737373] ml-2">(${ad.cpa.toFixed(2)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DOSSIER MODAL */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-2xl bg-[#FDFBF7] h-full overflow-y-auto border-l-8 border-[#1A1A1A] p-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <button onClick={() => setSelectedAd(null)} className="absolute top-10 right-10 p-2 border-2 border-[#1A1A1A] hover:bg-black hover:text-white"><X size={24} /></button>
            
            <h2 className="font-['Bodoni_Moda'] font-black text-6xl leading-none mb-6">{selectedAd.brandName}</h2>
            
            <div className={`p-6 border-l-8 mb-10 shadow-lg ${selectedAd.verdict.colors}`}>
              <h3 className="font-['Bodoni_Moda'] text-2xl font-black mb-2 flex items-center gap-2"><Zap /> {selectedAd.verdict.title}</h3>
              <p className="font-bold text-sm leading-relaxed">{selectedAd.verdict.analysis}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white p-6 border-2 border-[#E5E5E5] shadow-[4px_4px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[10px] font-black uppercase text-[#737373] mb-1">Creative Score</p>
                <p className={`text-3xl font-black ${selectedAd.creativeScore < 4 ? 'text-red-600' : 'text-black'}`}>{selectedAd.creativeScore}/10</p>
              </div>
              <div className="bg-white p-6 border-2 border-[#E5E5E5] shadow-[4px_4px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[10px] font-black uppercase text-[#737373] mb-1">Landing Page</p>
                <p className={`text-3xl font-black ${selectedAd.lpScore < 5 ? 'text-red-600' : 'text-black'}`}>{selectedAd.lpScore}/10</p>
              </div>
            </div>

            <div className="space-y-4 border-t-2 border-[#1A1A1A] pt-6">
               <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#737373] uppercase">Target Audience</span><span className="font-black">{selectedAd.targetAudience}</span></div>
               <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#737373] uppercase">Ad Type</span><span className="font-black">{selectedAd.adType}</span></div>
               <div className="flex justify-between items-center"><span className="text-xs font-bold text-[#737373] uppercase">Click Rate (CTR)</span><span className="font-black">{selectedAd.ctr.toFixed(2)}%</span></div>
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