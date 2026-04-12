import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, BookOpen, MessageCircle, Camera, Tv, Globe, Users, Image as ImageIcon, Activity, X, Crosshair, Zap, Filter, Target, Percent, MousePointer2 } from 'lucide-react';

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

// --- STRATEGIC INTELLIGENCE ENGINE ---
const getStrategicVerdict = (ad, targetCpa) => {
  if (ad.spend > (3 * targetCpa) && ad.conversions === 0) {
    return { title: "CAPITAL BLEED", analysis: "Zero intent. High spend. This is a budget leak. Kill immediately.", colors: "bg-[#DC2626] text-white border-[#991B1B]" };
  }
  if (ad.creativeScore < 3 && ad.lpScore < 5) {
    return { title: "SYSTEMIC FAILURE", analysis: "Creative and Landing Page are failing quality checks. The entire funnel needs a rebuild.", colors: "bg-[#7F1D1D] text-white border-[#450A0A]" };
  }
  if (ad.ctr > 1.5 && ad.lpScore < 6) {
    return { title: "CLICKBAIT TRAP", analysis: "Good ad hook, bad site. You are losing customers at the finish line. Fix site friction.", colors: "bg-[#F59E0B] text-[#1A1A1A] border-[#D97706]" };
  }
  if (ad.creativeScore < 4 && ad.ctr < 1) {
    return { title: "HOOK REJECTION", analysis: "The algorithm and audience are rejecting this visual. CPA is high due to poor quality. Replace creative asset.", colors: "bg-[#EA580C] text-white border-[#C2410C]" };
  }
  if (ad.roas > 3 && ad.cpa <= targetCpa) {
    return { title: "PROVEN WINNER", analysis: "Maximum efficiency. Pour fuel into this now. Scale aggressively.", colors: "bg-[#22C55E] text-white border-[#16A34A]" };
  }
  return { title: "MONITOR", analysis: "Traffic is flowing but metrics are mixed. Monitor closely for 48 hours before acting.", colors: "bg-[#1A1A1A] text-white border-[#4A4A4A]" };
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
      // Metric Parsing & Verification
      const spend = parseFloat(ad.spend) || 0;
      const revenue = parseFloat(ad.revenue) || 0;
      const conversions = parseInt(ad.conversions) || 0;
      const ctr = parseFloat(ad.ctr) || 0; 
      const cpa = parseFloat(ad.cpa) || (conversions > 0 ? spend / conversions : 0);
      const roas = parseFloat(ad.roas) || (spend > 0 ? revenue / spend : 0);

      // System Logic (Scale/Kill/Monitor)
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

    // GENIUS TIED FILTERING LOGIC
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
      
      {/* GENIUS MASTHEAD & WASTED SPEND SNAPSHOT */}
      <header className="mb-10 border-b-4 border-[#1A1A1A] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-['Bodoni_Moda'] text-6xl md:text-8xl font-black leading-none mb-2 tracking-tighter">APEX IMPACT</h1>
          <p className="text-xl font-['Bodoni_Moda'] italic text-[#4A4A4A]">Strategic Capital Control Center</p>
        </div>
        <div className="border-2 border-[#1A1A1A] p-6 bg-white shadow-[6px_6px_0px_0px_rgba(26,26,26,1)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#737373] mb-1">Live Wasted Potential</p>
          <p className="text-5xl font-black text-[#DC2626] tracking-tighter">${metrics.wasted}</p>
        </div>
      </header>

      {/* STRATEGIC COMMAND CENTER (FILTERS) */}
      <div className="mb-8 flex flex-wrap gap-3 items-center bg-[#1A1A1A] p-5 shadow-2xl relative z-20">
        <div className="flex items-center gap-2 text-[#FACC15] mr-6 border-r border-[#4A4A4A] pr-6">
          <Filter size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Filter Matrix</span>
        </div>
        
        <button 
          onClick={() => setActiveFilter({ type: 'all', value: null })}
          className={`px-4 py-2 text-[10px] font-black border-2 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#EAE5D9] ${activeFilter.type === 'all' ? 'bg-[#FACC15] text-black border-[#FACC15]' : 'bg-white text-black border-white'}`}
        >ALL ADS</button>

        <div className="h-6 w-[1px] bg-[#4A4A4A] mx-2" />

        {/* Dynamic Category Filters */}
        {filterOptions.categories?.slice(0, 4).map(c => (
          <button 
            key={c}
            onClick={() => setActiveFilter({ type: 'category', value: c })}
            className={`px-4 py-2 text-[10px] font-black border-2 transition-all hover:bg-[#333] ${activeFilter.value === c ? 'bg-white text-black border-white' : 'text-white border-[#4A4A4A]'}`}
          >{c.toUpperCase()}</button>
        ))}

        <div className="h-6 w-[1px] bg-[#4A4A4A] mx-2" />

        {/* Strategic Directive Filters */}
        {['Kill', 'Scale'].map(d => (
          <button 
            key={d}
            onClick={() => setActiveFilter({ type: 'directive', value: d })}
            className={`px-4 py-2 text-[10px] font-black border-2 transition-all ${activeFilter.value === d ? 'bg-white text-black border-white' : d === 'Kill' ? 'text-white border-red-800 bg-red-800' : 'text-white border-green-800 bg-green-800'}`}
          >{d.toUpperCase()}</button>
        ))}
      </div>

      {/* THE BATTLEGROUND (MAIN SCANNABLE TABLE) */}
      <div className="overflow-x-auto shadow-2xl border-2 border-[#1A1A1A] bg-white mb-20 relative z-10 cursor-pointer">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#1A1A1A] text-white uppercase tracking-widest text-[11px] font-black">
              <th className="p-6 w-1/5">Directive</th>
              <th className="p-6 w-1/3">Campaign & Category</th>
              <th className="p-6 text-right">Performance Impact (ROAS / CPA)</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#E5E5E5]">
            {isLoading ? <tr><td colSpan="3" className="p-32 text-center font-black text-3xl">SYNCING INTELLIGENCE...</td></tr> : 
              processedAds.map((ad, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedAd(ad)} 
                className={`transition-all hover:scale-[1.002] active:scale-[0.998] ${ad.rowClass}`}
              >
                <td className="p-6 align-middle">
                  <div className={`inline-block px-5 py-2 text-[11px] font-black uppercase tracking-widest border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${ad.themeClass}`}>
                    {ad.action}
                  </div>
                </td>
                <td className="p-6 align-middle">
                  <div className="font-['Bodoni_Moda'] font-black text-3xl leading-none mb-3 tracking-tight">{ad.brandName}</div>
                  <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-[#4A4A4A]">
                    <span className="bg-white px-3 py-1 border-2 border-[#E5E5E5]">{ad.category}</span>
                    <span className="flex items-center gap-1.5 bg-[#1A1A1A] text-white px-3 py-1">{ad.identity.icon} {ad.identity.name}</span>
                  </div>
                </td>
                <td className="p-6 text-right align-middle">
                  <span className="text-[10px] text-[#737373] uppercase tracking-widest font-black block mb-1">Impact Multiplier</span>
                  <span className={`font-black text-5xl tracking-tighter ${ad.roas > 3 ? 'text-[#16A34A]' : 'text-[#1A1A1A]'}`}>{ad.roas.toFixed(2)}x</span>
                  <span className="text-sm font-black text-[#737373] ml-3">(${ad.cpa.toFixed(2)})</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FULL INTELLIGENCE DOSSIER (SLIDE-OVER MODAL - EVERY SINGLE DETAIL) */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dark Overlay Background */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedAd(null)} />
          
          {/* Side Panel Content */}
          <div className="relative w-full max-w-2xl bg-[#FDFBF7] h-full overflow-y-auto border-l-[12px] border-[#1A1A1A] p-10 md:p-14 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            <button 
              onClick={() => setSelectedAd(null)} 
              className="absolute top-10 right-10 p-3 bg-white border-2 border-[#1A1A1A] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
            >
              <X size={28} />
            </button>
            
            <div className="mb-10">
              <p className="text-xs font-black text-[#737373] uppercase tracking-[0.3em] mb-3">Intelligence Dossier</p>
              <h2 className="font-['Bodoni_Moda'] font-black text-6xl md:text-7xl leading-[0.9] tracking-tighter mb-6">
                {selectedAd.brandName}
              </h2>
              <div className="flex flex-wrap gap-3">
                <div className={`px-5 py-2 text-xs font-black uppercase tracking-widest border-2 ${selectedAd.themeClass}`}>
                  {selectedAd.action} DIRECTIVE
                </div>
                <div className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-[#1A1A1A] text-white border-2 border-[#1A1A1A]">
                  {selectedAd.category}
                </div>
              </div>
            </div>

            {/* STRATEGIC VERDICT BLOCK */}
            <div className={`p-8 border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 ${selectedAd.verdict.colors}`}>
              <h3 className="font-['Bodoni_Moda'] text-2xl font-black mb-4 flex items-center gap-3 uppercase tracking-widest">
                <Zap size={24} fill="currentColor"/> {selectedAd.verdict.title}
              </h3>
              <p className="font-bold text-base leading-relaxed font-['DM_Mono']">
                {selectedAd.verdict.analysis}
              </p>
            </div>

            <h3 className="font-['Bodoni_Moda'] text-3xl font-black mb-4 border-b-2 border-[#1A1A1A] pb-2 uppercase tracking-widest">Deployment Metrics</h3>
            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-8 border-2 border-[#E5E5E5] shadow-[6px_6px_0px_0px_rgba(229,229,229,1)] flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-[#737373] mb-2 flex items-center gap-2"><ImageIcon size={12}/> Creative Score</p>
                    <p className={`text-5xl font-black tracking-tighter ${selectedAd.creativeScore < 3 ? 'text-red-600' : 'text-black'}`}>{selectedAd.creativeScore.toFixed(1)}/10</p>
                </div>
              </div>
              <div className="bg-white p-8 border-2 border-[#E5E5E5] shadow-[6px_6px_0px_0px_rgba(229,229,229,1)] flex flex-col justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-[#737373] mb-2 flex items-center gap-2"><Target size={12}/> Landing Page</p>
                    <p className={`text-5xl font-black tracking-tighter ${selectedAd.lpScore < 5 ? 'text-red-600' : 'text-black'}`}>{selectedAd.lpScore.toFixed(1)}/10</p>
                </div>
              </div>
              <div className="bg-white p-8 border-2 border-[#E5E5E5] shadow-[6px_6px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[10px] font-black uppercase text-[#737373] mb-2 Flex items-center gap-2"><ImageIcon size={12}/> Impressions</p>
                <p className="text-4xl font-black tracking-tighter">{selectedAd.impressions.toLocaleString()}</p>
              </div>
              <div className="bg-white p-8 border-2 border-[#E5E5E5] shadow-[6px_6px_0px_0px_rgba(229,229,229,1)]">
                <p className="text-[10px] font-black uppercase text-[#737373] mb-2 flex items-center gap-2"><MousePointer2 size={12}/> Clicks (CTR)</p>
                <p className="text-4xl font-black tracking-tighter">{selectedAd.clicks.toLocaleString()} <span className="text-sm text-[#737373]">({selectedAd.ctr.toFixed(2)}%)</span></p>
              </div>
            </div>

            {/* RAW DATA GRID (JSON FIELDS BINDING) */}
            <div className="space-y-6 border-t-4 border-[#1A1A1A] pt-10">
               <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[#737373] mb-6">Granular Intelligence Context</h4>
               <div className="grid grid-cols-2 gap-y-6">
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Target Audience</span><span className="font-black text-lg uppercase flex items-center gap-2"><Users size={14}/> {selectedAd.targetAudience}</span></div>
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Video Completion</span><span className="font-black text-lg">{selectedAd.vcr > 0 ? `${selectedAd.vcr}%` : 'N/A'}</span></div>
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Ad Type</span><span className="font-black text-lg uppercase">{selectedAd.adType}</span></div>
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Creative Theme</span><span className="font-black text-lg uppercase">{selectedAd.creativeTheme}</span></div>
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Frequency</span><span className="font-black text-lg">{selectedAd.frequency.toFixed(2)}x</span></div>
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Cost Per Click (CPC)</span><span className="font-black text-lg">${selectedAd.cpc.toFixed(2)}</span></div>
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Status</span><span className="font-black text-lg uppercase flex items-center gap-2"><Activity size={14} className={selectedAd.campaignStatus.toLowerCase() === 'active' ? 'text-green-600' : 'text-red-600'}/> {selectedAd.campaignStatus}</span></div>
                 <div><span className="text-[10px] font-black text-[#737373] uppercase block mb-1">Total Conversions</span><span className="font-black text-lg">{selectedAd.conversions.toLocaleString()}</span></div>
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