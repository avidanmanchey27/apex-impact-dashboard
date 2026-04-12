import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MessageCircle, Camera, Tv, Globe, Users, Image as ImageIcon, Activity, X, Crosshair, Zap, Filter, Target, MousePointer2 } from 'lucide-react';

const queryClient = new QueryClient();

const getPlatformIdentity = (platform = "") => {
  const p = platform.toLowerCase();
  if (p.includes('meta') || p.includes('facebook')) return { icon: <MessageCircle size={16} />, name: "Meta" };
  if (p.includes('instagram')) return { icon: <Camera size={16} />, name: "Instagram" };
  if (p.includes('youtube')) return { icon: <Tv size={16} />, name: "YouTube" };
  if (p.includes('google')) return { icon: <Globe size={16} />, name: "Google" };
  return { icon: <Globe size={16} />, name: platform || "Network" };
};

const getStrategicVerdict = (ad, targetCpa) => {
  if (ad.spend > (3 * targetCpa) && ad.conversions === 0) {
    return { title: "CAPITAL BLEED", analysis: "Shut down immediately. This asset is consuming budget without generating intent signals.", colors: "bg-[#DC2626] text-white border-[#991B1B]" };
  }
  if (ad.creativeScore < 3 && ad.lpScore < 5) {
    return { title: "SYSTEMIC FAILURE", analysis: "Total funnel rejection. Both the visual hook and the destination page are failing quality checks.", colors: "bg-[#7F1D1D] text-white border-[#450A0A]" };
  }
  if (ad.ctr > 1.5 && ad.lpScore < 6) {
    return { title: "CLICKBAIT TRAP", analysis: "The ad stops the scroll, but the website loses the sale. Fix landing page friction or offer mismatch.", colors: "bg-[#F59E0B] text-black border-[#D97706]" };
  }
  if (ad.roas > 3 && ad.cpa <= targetCpa) {
    return { title: "PROVEN WINNER", analysis: "High-efficiency multiplier. Capital is working perfectly. Scale budget aggressively.", colors: "bg-[#22C55E] text-white border-[#16A34A]" };
  }
  return { title: "MONITOR", analysis: "Baseline performance. No structural failure detected. Gathering more data for 48 hours.", colors: "bg-[#1A1A1A] text-white border-[#4A4A4A]" };
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
    const categories = new Set();

    let ads = data.data.map(ad => {
      const spend = parseFloat(ad.spend) || 0;
      const conversions = parseInt(ad.conversions) || 0;
      const ctr = parseFloat(ad.ctr) || 0; 
      const cpa = parseFloat(ad.cpa) || (conversions > 0 ? spend / conversions : 0);
      const roas = parseFloat(ad.roas) || 0;

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

      totalSpend += spend;
      if (ad.platform) platforms.add(ad.platform);
      if (ad.category) categories.add(ad.category);

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
        cpc: parseFloat(ad.cpc) || 0
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] p-4 md:p-8 font-['DM_Mono']">
      
      <header className="mb-10 border-b-8 border-[#1A1A1A] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <h1 className="font-['Bodoni_Moda'] text-6xl md:text-8xl font-black leading-none mb-4 tracking-tighter text-[#1A1A1A]">APEX IMPACT</h1>
          <p className="text-xl font-['Bodoni_Moda'] italic text-[#4A4A4A]">Strategic Capital Control Center</p>
        </div>
        <div className="border-4 border-[#1A1A1A] p-8 bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#737373] mb-2">Wasted Potential</p>
          <p className="text-6xl font-black text-[#DC2626] tracking-tighter">${metrics.wasted}</p>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-3 items-center bg-[#1A1A1A] p-6 shadow-2xl relative z-20">
        <button onClick={() => setActiveFilter({ type: 'all', value: null })} className={`px-4 py-2 text-[10px] font-black border-2 ${activeFilter.type === 'all' ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-white text-black border-white'}`}>RESET</button>
        {['Kill', 'Scale', 'Monitor'].map(d => (
          <button key={d} onClick={() => setActiveFilter({ type: 'directive', value: d })} className={`px-4 py-2 text-[10px] font-black border-2 ${activeFilter.value === d ? 'bg-white text-black' : 'text-white border-gray-600'}`}>{d.toUpperCase()}</button>
        ))}
        {filterOptions.platforms?.map(p => (
          <button key={p} onClick={() => setActiveFilter({ type: 'platform', value: p })} className={`px-4 py-2 text-[10px] font-black border-2 ${activeFilter.value === p ? 'bg-blue-600 text-white border-blue-600' : 'text-white border-gray-600'}`}>{p.toUpperCase()}</button>
        ))}
      </div>

      <div className="overflow-x-auto shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] border-4 border-[#1A1A1A] bg-white mb-20 relative z-10">
        <table className="w-full text-left cursor-pointer">
          <thead>
            <tr className="bg-[#1A1A1A] text-white uppercase tracking-widest text-[12px] font-black">
              <th className="p-6">Directive</th>
              <th className="p-6">Brand</th>
              <th className="p-6 text-right">Performance Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-[#F5F5F5]">
            {isLoading ? <tr><td colSpan="3" className="p-32 text-center font-black text-3xl uppercase">Syncing...</td></tr> : 
              processedAds.map((ad, i) => (
              <tr key={i} onClick={() => setSelectedAd(ad)} className={`transition-all hover:bg-opacity-90 ${ad.rowClass}`}>
                <td className="p-6"><div className={`inline-block px-4 py-1 text-xs font-black uppercase border-2 ${ad.themeClass}`}>{ad.action}</div></td>
                <td className="p-6">
                  <div className="font-['Bodoni_Moda'] font-black text-3xl leading-none mb-2 tracking-tighter">{ad.brandName}</div>
                  <div className="text-[10px] font-black uppercase text-[#4A4A4A]">{ad.category} • {ad.identity.name}</div>
                </td>
                <td className="p-6 text-right">
                  <span className="font-black text-5xl tracking-tighter block">{ad.roas.toFixed(2)}x</span>
                  <span className="text-xs font-black text-[#737373] tracking-[0.2em] uppercase">${ad.cpa.toFixed(2)} CPA</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAd && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={() => setSelectedAd(null)} />
          <div className="relative w-full max-w-2xl bg-[#FDFBF7] h-full overflow-y-auto border-l-[16px] border-[#1A1A1A] p-10 md:p-14 flex flex-col shadow-2xl">
            <button onClick={() => setSelectedAd(null)} className="absolute top-10 right-10 p-3 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-black hover:text-white transition-all"><X size={28} /></button>
            
            <p className="text-[11px] font-black text-[#737373] text-center uppercase tracking-[0.4em] mb-4">Intelligence Dossier</p>
            <h2 className="font-['Bodoni_Moda'] font-black text-6xl text-center leading-[0.85] tracking-tighter mb-8">{selectedAd.brandName}</h2>
            
            <div className={`p-8 border-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center mb-12 ${selectedAd.verdict.colors}`}>
              <h3 className="font-['Bodoni_Moda'] text-2xl font-black mb-4 flex items-center justify-center gap-3 uppercase tracking-widest"><Zap size={24} fill="currentColor"/> {selectedAd.verdict.title}</h3>
              <p className="font-bold text-sm leading-relaxed">{selectedAd.verdict.analysis}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-8 border-2 border-[#E5E5E5] text-center">
                <p className="text-[10px] font-black text-[#737373] uppercase mb-4">Creative Quality</p>
                <p className={`text-5xl font-black tracking-tighter ${selectedAd.creativeScore < 5 ? 'text-red-600' : 'text-black'}`}>{selectedAd.creativeScore.toFixed(1)}/10</p>
              </div>
              <div className="bg-white p-8 border-2 border-[#E5E5E5] text-center">
                <p className="text-[10px] font-black text-[#737373] uppercase mb-4">Landing Page Opt</p>
                <p className={`text-5xl font-black tracking-tighter ${selectedAd.lpScore < 5 ? 'text-red-600' : 'text-black'}`}>{selectedAd.lpScore.toFixed(1)}/10</p>
              </div>
              <div className="bg-white p-8 border-2 border-[#E5E5E5] text-center">
                <p className="text-[10px] font-black text-[#737373] uppercase mb-4">Impressions</p>
                <p className="text-4xl font-black tracking-tighter">{selectedAd.impressions.toLocaleString()}</p>
              </div>
              <div className="bg-white p-8 border-2 border-[#E5E5E5] text-center">
                <p className="text-[10px] font-black text-[#737373] uppercase mb-4">CTR (%)</p>
                <p className="text-4xl font-black tracking-tighter">{selectedAd.ctr.toFixed(2)}%</p>
              </div>
            </div>

            <div className="h-1 bg-[#1A1A1A] mb-12" />

            <div className="space-y-12 mb-10">
               <h4 className="text-[13px] font-black text-center uppercase tracking-[0.5em] text-[#1A1A1A]">Deep Asset Audit</h4>
               <div className="grid grid-cols-2 gap-y-12">
                 <div className="text-center">
                    <span className="text-[10px] font-black text-[#737373] uppercase block mb-3">Target Audience</span>
                    <span className="font-black text-lg text-[#1A1A1A]">{selectedAd.target_audience || "N/A"}</span>
                 </div>
                 <div className="text-center">
                    <span className="text-[10px] font-black text-[#737373] uppercase block mb-3">Video Completion</span>
                    <span className="font-black text-2xl text-[#1A1A1A]">{selectedAd.vcr > 0 ? `${selectedAd.vcr}%` : 'N/A'}</span>
                 </div>
                 <div className="text-center">
                    <span className="text-[10px] font-black text-[#737373] uppercase block mb-3">Freq / CPC</span>
                    <span className="font-black text-lg text-[#1A1A1A]">{selectedAd.frequency.toFixed(2)}x / ${selectedAd.cpc.toFixed(2)}</span>
                 </div>
                 <div className="text-center">
                    <span className="text-[10px] font-black text-[#737373] uppercase block mb-3">Directive Status</span>
                    <span className="font-black text-xl uppercase text-[#1A1A1A]">{selectedAd.action}</span>
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