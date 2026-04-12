import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, BookOpen, MessageCircle, Camera, Tv, Globe, Users, Image as ImageIcon, Activity, X, Crosshair, Zap, Filter, Target, MousePointer2 } from 'lucide-react';

const queryClient = new QueryClient();

// --- PLATFORM IDENTITY ENGINE ---
const getPlatformIdentity = (platform = "") => {
  const p = platform.toLowerCase();
  if (p.includes('meta') || p.includes('facebook')) return { icon: <MessageCircle size={16} />, name: "Meta" };
  if (p.includes('instagram')) return { icon: <Camera size={16} />, name: "Instagram" };
  if (p.includes('youtube')) return { icon: <Tv size={16} />, name: "YouTube" };
  if (p.includes('google')) return { icon: <Globe size={16} />, name: "Google" };
  return { icon: <Globe size={16} />, name: platform || "Network" };
};

// --- GENIUS VERDICT ENGINE ---
const getStrategicVerdict = (ad, targetCpa) => {
  if (ad.spend > (3 * targetCpa) && ad.conversions === 0) {
    return { title: "CAPITAL BLEED", analysis: "Critical Failure. This ad is a budget vacuum. Kill immediately.", colors: "bg-[#DC2626] text-white border-[#991B1B]" };
  }
  if (ad.creativeScore < 3 && ad.lpScore < 5) {
    return { title: "SYSTEMIC FAILURE", analysis: "Total funnel rejection. Both creative and web assets are toxic to ROAS. Rebuild from scratch.", colors: "bg-[#7F1D1D] text-white border-[#450A0A]" };
  }
  if (ad.ctr > 1.5 && ad.lpScore < 6) {
    return { title: "THE CLICKBAIT TRAP", analysis: "Hook works, site doesn't. You are paying for curiosity that isn't being converted. Fix Landing Page friction.", colors: "bg-[#F59E0B] text-[#1A1A1A] border-[#D97706]" };
  }
  if (ad.roas > 3 && ad.cpa <= targetCpa) {
    return { title: "PROVEN WINNER", analysis: "Maximum efficiency. Capital multiplier is active. Aggressive scaling recommended.", colors: "bg-[#22C55E] text-white border-[#16A34A]" };
  }
  return { title: "MONITOR", analysis: "Insufficient data to pivot. Observing performance indicators for 48-hour trends.", colors: "bg-[#1A1A1A] text-white border-[#4A4A4A]" };
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
      if (ad.platform) platforms.add(ad.platform);
      if (ad.category) categories.add(ad.category);

      const formatted = { 
        ...ad, spend, revenue, roas, cpa, ctr, action, themeClass, rowClass,
        brandName: ad.brand || "Unknown Brand",
        identity: getPlatformIdentity(ad.platform),
        impressions: parseInt(ad.impressions) || 0,
        clicks: parseInt(ad.clicks) || 0,
        creativeScore: parseFloat(ad.creative_score) || 0,
        lpScore: parseFloat(ad.landing_page_score) || 0,
        cpc: parseFloat(ad.cpc) || 0,
        frequency: parseFloat(ad.frequency) || 0,
        vcr: parseFloat(ad.video_completion_rate) || 0,
        conversions
      };
      formatted.verdict = getStrategicVerdict(formatted, targetCpa);
      return formatted;
    });

    // STRATEGIC FILTERING
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
      
      {/* HIGH-IMPACT HEADER */}
      <header className="mb-10 border-b-8 border-[#1A1A1A] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <h1 className="font-['Bodoni_Moda'] text-7xl md:text-9xl font-black leading-none mb-4 tracking-tighter text-[#1A1A1A] drop-shadow-sm">
            APEX IMPACT
          </h1>
          <p className="text-2xl font-['Bodoni_Moda'] italic text-[#4A4A4A] tracking-tight">
            Strategic Capital & Growth Control
          </p>
        </div>
        <div className="border-4 border-[#1A1A1A] p-8 bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-transform hover:translate-x-1 hover:translate-y-1">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#737373] mb-2">Wasted Potential (Total)</p>
          <p className="text-6xl font-black text-[#DC2626] tracking-tighter">${metrics.wasted}</p>
        </div>
      </header>

      {/* COMMAND CENTER (FILTERS) */}
      <div className="mb-12 flex flex-wrap gap-4 items-center bg-[#1A1A1A] p-6 shadow-2xl relative z-20">
        <div className="flex items-center gap-3 text-[#FACC15] mr-6 border-r border-[#4A4A4A] pr-6">
          <Filter size={24} strokeWidth={3} />
          <span className="text-sm font-black uppercase tracking-widest">Command Matrix</span>
        </div>
        
        <button 
          onClick={() => setActiveFilter({ type: 'all', value: null })}
          className={`px-6 py-2 text-[12px] font-black border-2 transition-all ${activeFilter.type === 'all' ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-white text-black border-white hover:bg-[#FACC15]'}`}
        >RESET ALL</button>

        <div className="h-8 w-[1px] bg-[#4A4A4A] mx-4" />

        {filterOptions.platforms?.map(p => (
          <button 
            key={p}
            onClick={() => setActiveFilter({ type: 'platform', value: p })}
            className={`px-6 py-2 text-[12px] font-black border-2 transition-all ${activeFilter.value === p ? 'bg-blue-600 text-white border-blue-600 shadow-[4px_4px_0px_0px_rgba(37,99,235,0.3)]' : 'text-white border-[#4A4A4A] hover:bg-[#333]'}`}
          >{p.toUpperCase()}</button>
        ))}

        <div className="h-8 w-[1px] bg-[#4A4A4A] mx-4" />

        {['Kill', 'Scale'].map(d => (
          <button 
            key={d}
            onClick={() => setActiveFilter({ type: 'directive', value: d })}
            className={`px-6 py-2 text-[12px] font-black border-2 transition-all ${activeFilter.value === d ? 'bg-white text-black border-white' : d === 'Kill' ? 'text-red-500 border-red-500 hover:bg-red-900 hover:text-white' : 'text-green-500 border-green-500 hover:bg-green-900 hover:text-white'}`}
          >{d.toUpperCase()}</button>
        ))}
      </div>

      {/* BATTLEGROUND MATRIX (SCANNABLE) */}
      <div className="overflow-x-auto shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] border-4 border-[#1A1A1A] bg-white mb-20 relative z-10">
        <table className="w-full text-left cursor-pointer">
          <thead>
            <tr className="bg-[#1A1A1A] text-white uppercase tracking-widest text-[12px] font-black">
              <th className="p-8">Action Directive</th>
              <th className="p-8">Asset Branding</th>
              <th className="p-8 text-right">Performance Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-[#F5F5F5]">
            {isLoading ? <tr><td colSpan="3" className="p-40 text-center font-black text-4xl animate-pulse uppercase">Syncing Intelligence Dossiers...</td></tr> : 
              processedAds.map((ad, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedAd(ad)} 
                className={`transition-all hover:bg-opacity-90 active:scale-[0.99] ${ad.rowClass}`}
              >
                <td className="p-8"><div className={`inline-block px-6 py-2 text-sm font-black uppercase border-4 shadow-sm ${ad.themeClass}`}>{ad.action}</div></td>
                <td className="p-8">
                  <div className="font-['Bodoni_Moda'] font-black text-4xl leading-none mb-3 tracking-tighter">{ad.brandName}</div>
                  <div className="text-xs font-black uppercase text-[#4A4A4A] flex gap-3 items-center">
                    <span className="bg-[#1A1A1A] text-white px-2 py-1">{ad.identity.name}</span>
                    <span>{ad.category}</span>
                  </div>
                </td>
                <td className="p-8 text-right">
                  <span className="font-black text-6xl tracking-tighter block leading-none mb-2">{ad.roas.toFixed(2)}x</span>
                  <span className="text-sm font-black text-[#737373] tracking-[0.2em] uppercase">${ad.cpa.toFixed(2)} CPA</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* THE DEEP DOSSIER (EVERY SINGLE DETAIL BINDING) */}
      {selectedAd && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-2xl bg-[#FDFBF7] h-full overflow-y-auto border-l-[16px] border-[#1A1A1A] p-12 md:p-16 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            
            <button onClick={() => setSelectedAd(null)} className="absolute top-12 right-12 p-4 bg-white border-4 border-[#1A1A1A] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] hover:bg-black hover:text-white transition-all"><X size={32} /></button>
            
            <div className="mb-12">
              <p className="text-[12px] font-black text-[#737373] uppercase tracking-[0.4em] mb-4">Internal Asset Audit</p>
              <h2 className="font-['Bodoni_Moda'] font-black text-7xl leading-[0.85] tracking-tighter mb-8">{selectedAd.brandName}</h2>
              <div className="flex flex-wrap gap-4">
                <div className={`px-6 py-2 text-sm font-black uppercase border-4 shadow-sm ${selectedAd.themeClass}`}>{selectedAd.action} DIRECTIVE</div>
                <div className="px-6 py-2 text-sm font-black uppercase bg-[#1A1A1A] text-white border-4 border-[#1A1A1A]">{selectedAd.category}</div>
              </div>
            </div>

            {/* VERDICT CARD */}
            <div className={`p-10 border-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-16 ${selectedAd.verdict.colors}`}>
              <h3 className="font-['Bodoni_Moda'] text-3xl font-black mb-6 flex items-center gap-4 uppercase tracking-[0.1em]"><Zap size={28} fill="currentColor"/> {selectedAd.verdict.title}</h3>
              <p className="font-bold text-lg leading-relaxed">{selectedAd.verdict.analysis}</p>
            </div>

            {/* FULL DATA GRID */}
            <h3 className="font-['Bodoni_Moda'] text-4xl font-black mb-8 border-b-8 border-[#1A1A1A] pb-4 uppercase tracking-widest">Intelligence Matrix</h3>
            <div className="grid grid-cols-2 gap-8 mb-16">
              <div className="bg-white p-8 border-4 border-[#E5E5E5] shadow-[8px_8px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[12px] font-black text-[#737373] uppercase mb-3 flex items-center gap-2">Creative Quality</p>
                <p className={`text-6xl font-black tracking-tighter ${selectedAd.creativeScore < 3 ? 'text-red-600' : 'text-black'}`}>{selectedAd.creativeScore.toFixed(1)}/10</p>
              </div>
              <div className="bg-white p-8 border-4 border-[#E5E5E5] shadow-[8px_8px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[12px] font-black text-[#737373] uppercase mb-3 flex items-center gap-2">Landing Page Opt</p>
                <p className={`text-6xl font-black tracking-tighter ${selectedAd.lpScore < 5 ? 'text-red-600' : 'text-black'}`}>{selectedAd.lpScore.toFixed(1)}/10</p>
              </div>
              <div className="bg-white p-8 border-4 border-[#E5E5E5] shadow-[8px_8px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[12px] font-black text-[#737373] uppercase mb-3">Volume (Impressions)</p>
                <p className="text-5xl font-black tracking-tighter">{selectedAd.impressions.toLocaleString()}</p>
              </div>
              <div className="bg-white p-8 border-4 border-[#E5E5E5] shadow-[8px_8px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[12px] font-black text-[#737373] uppercase mb-3">Intent (CTR %)</p>
                <p className="text-5xl font-black tracking-tighter">{selectedAd.ctr.toFixed(2)}%</p>
              </div>
            </div>

            {/* THE JSON DEEP DIVE */}
            <div className="space-y-10 border-t-8 border-[#1A1A1A] pt-12 mb-20">
               <h4 className="text-lg font-black uppercase tracking-[0.5em] text-[#737373]">Algorithmic Audit</h4>
               <div className="grid grid-cols-2 gap-y-10 gap-x-8">
                 <div className="border-b-4 border-[#F5F5F5] pb-4"><span className="text-[12px] font-black text-[#737373] uppercase block mb-2">Audience Cluster</span><span className="font-black text-2xl uppercase">{selectedAd.targetAudience}</span></div>
                 <div className="border-b-4 border-[#F5F5F5] pb-4"><span className="text-[12px] font-black text-[#737373] uppercase block mb-2">Retention (VCR)</span><span className="font-black text-2xl">{selectedAd.vcr > 0 ? `${selectedAd.vcr}%` : 'N/A'}</span></div>
                 <div className="border-b-4 border-[#F5F5F5] pb-4"><span className="text-[12px] font-black text-[#737373] uppercase block mb-2">Platform Context</span><span className="font-black text-2xl uppercase">{selectedAd.identity.name} {selectedAd.adType}</span></div>
                 <div className="border-b-4 border-[#F5F5F5] pb-4"><span className="text-[12px] font-black text-[#737373] uppercase block mb-2">Ad Frequency</span><span className="font-black text-2xl">{selectedAd.frequency.toFixed(2)}x</span></div>
                 <div className="border-b-4 border-[#F5F5F5] pb-4"><span className="text-[12px] font-black text-[#737373] uppercase block mb-2">Click Efficiency (CPC)</span><span className="font-black text-2xl">${selectedAd.cpc.toFixed(2)}</span></div>
                 <div className="border-b-4 border-[#F5F5F5] pb-4"><span className="text-[12px] font-black text-[#737373] uppercase block mb-2">Life Cycle Status</span><span className="font-black text-2xl uppercase flex items-center gap-3"><Activity size={20} className={selectedAd.campaignStatus.toLowerCase() === 'active' ? 'text-green-600' : 'text-red-600'}/> {selectedAd.campaignStatus}</span></div>
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