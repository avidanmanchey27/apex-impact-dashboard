import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, BookOpen, MessageCircle, Camera, Tv, Globe, Users, Image as ImageIcon, Activity, X, Crosshair, BarChart2 } from 'lucide-react';

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

const EditorialChronicle = () => {
  const [page, setPage] = useState(1);
  const [selectedAd, setSelectedAd] = useState(null); // NEW: State to track which ad is open
  const targetCpa = 50; 

  const { data, isLoading } = useQuery({
    queryKey: ['adData', page],
    queryFn: async () => {
      const res = await fetch(`https://mosaicfellowship.in/api/data/content/ads?page=${page}&limit=100`);
      return res.json();
    },
    keepPreviousData: true
  });

  const { processedAds, metrics } = useMemo(() => {
    if (!data?.data) return { processedAds: [], metrics: {} };

    let totalSpend = 0, totalRevenue = 0, totalConversions = 0, wastedSpend = 0;

    const ads = data.data.map(ad => {
      const spend = parseFloat(ad.spend) || 0;
      const revenue = parseFloat(ad.revenue) || 0;
      const conversions = parseInt(ad.conversions) || 0;
      let ctr = parseFloat(ad.ctr) || 0;
      if (ctr < 1 && ctr > 0) ctr = ctr * 100; 
      const days = parseInt(ad.days_running || ad.days_active) || 0;
      
      const cpa = parseFloat(ad.cpa) || (conversions > 0 ? spend / conversions : 0);
      const roas = parseFloat(ad.roas) || (spend > 0 ? revenue / spend : 0);

      // Status Logic
      let action = 'Monitor';
      let themeClass = 'bg-[#FDE047] text-[#713F12] border-[#EAB308]'; 
      let rowClass = 'bg-[#FEFCE8] hover:bg-[#FEF9C3] border-l-8 border-l-[#FACC15]';
      let actionNote = 'Gathering data. Observing trends.';

      if (spend > (3 * targetCpa) && conversions === 0) {
        action = 'Kill';
        themeClass = 'bg-[#DC2626] text-white border-[#991B1B]'; 
        rowClass = 'bg-[#FEF2F2] hover:bg-[#FEE2E2] border-l-8 border-l-[#DC2626]';
        actionNote = 'Hemorrhaging capital. Zero return. Terminate immediately.';
        wastedSpend += spend;
      } else if (cpa <= targetCpa && days >= 5 && ctr > 2) {
        action = 'Scale';
        themeClass = 'bg-[#22C55E] text-white border-[#16A34A]'; 
        rowClass = 'bg-[#F0FDF4] hover:bg-[#DCFCE7] border-l-8 border-l-[#22C55E]';
        actionNote = 'High-yield asset. Acquiring cheaply. Maximize budget.';
      }

      totalSpend += spend; totalRevenue += revenue; totalConversions += conversions;

      return { 
        ...ad, spend, revenue, roas, cpa, ctr, days, action, themeClass, rowClass, actionNote,
        brandName: ad.brand || "Unknown Brand",
        category: ad.category || "Uncategorized",
        targetAudience: ad.target_audience || "Broad Audience",
        adType: ad.ad_type || "Unknown Format",
        creativeTheme: ad.creative_theme || "Standard",
        campaignStatus: ad.status || "Unknown",
        identity: getPlatformIdentity(ad.platform),
        impressions: parseInt(ad.impressions) || 0,
        clicks: parseInt(ad.clicks) || 0,
        cpc: parseFloat(ad.cpc) || 0,
        creativeScore: parseFloat(ad.creative_score) || 0,
        lpScore: parseFloat(ad.landing_page_score) || 0,
        frequency: parseFloat(ad.frequency) || 0,
        vcr: parseFloat(ad.video_completion_rate) || 0
      };
    });

    return {
      processedAds: ads.sort((a, b) => (a.action === 'Kill' ? -1 : a.action === 'Scale' ? 0 : 1)),
      metrics: {
        roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : '0.00',
        cac: totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : '0.00',
        wasted: wastedSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      }
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] p-4 md:p-8 font-['DM_Mono']">
      
      <header className="mb-10 border-b-4 border-[#1A1A1A] pb-6">
        <h1 className="font-['Bodoni_Moda'] text-6xl md:text-8xl font-black leading-tight md:leading-none mb-4 text-[#1A1A1A] tracking-tighter">
          APEX IMPACT
        </h1>
        <p className="text-xl font-['Bodoni_Moda'] italic text-[#4A4A4A]">
          Algorithmic Capital Allocation & Waste Eradication
        </p>
      </header>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 relative z-10">
        <div className="border-2 border-[#E5E5E5] bg-white p-8 shadow-sm flex flex-col justify-between">
          <div>
             <h3 className="font-['Bodoni_Moda'] text-2xl font-black mb-1 uppercase tracking-widest leading-tight">Client Multiplier</h3>
             <p className="text-xs font-bold text-[#737373] mb-6">RETURN ON AD SPEND</p>
          </div>
          <div className="font-['DM_Mono'] text-6xl md:text-7xl font-black text-[#1A1A1A] tracking-tighter">{metrics.roas}x</div>
        </div>

        <div className="border-2 border-[#E5E5E5] bg-white p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-['Bodoni_Moda'] text-2xl font-black mb-1 uppercase tracking-widest leading-tight">Investment Fuel</h3>
            <p className="text-xs font-bold text-[#737373] mb-6">CUSTOMER ACQUISITION COST</p>
          </div>
          <div className="font-['DM_Mono'] text-6xl md:text-7xl font-black text-[#1A1A1A] tracking-tighter">${metrics.cac}</div>
        </div>

        <div className="border-2 border-[#DC2626] bg-[#FEF2F2] p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-['Bodoni_Moda'] text-2xl font-black text-[#DC2626] mb-1 uppercase tracking-widest leading-tight">Wasted Potential</h3>
            <p className="text-xs font-bold text-[#DC2626] mb-6">CAPITAL HEMORRHAGE</p>
          </div>
          <div className="font-['DM_Mono'] text-6xl md:text-7xl font-black text-[#DC2626] tracking-tighter">${metrics.wasted}</div>
        </div>
      </div>

      <div className="mt-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#1A1A1A] pb-4 gap-4 relative z-10">
        <div>
          <h2 className="font-['Bodoni_Moda'] text-4xl md:text-5xl font-black uppercase tracking-widest text-[#1A1A1A] leading-tight block">
            The Battleground
          </h2>
          <p className="text-sm text-[#737373] font-bold mt-2 font-['DM_Mono'] uppercase tracking-widest">Click any row to view full intelligence dossier</p>
        </div>
        <div className="flex gap-2 bg-white p-1 border-2 border-[#1A1A1A]">
          <button onClick={() => setPage(p => Math.max(1, p-1))} className="p-2 bg-[#F5F5F5] hover:bg-[#EAE5D9] transition"><ChevronLeft size={16} /></button>
          <span className="p-2 font-bold text-lg px-4">PG. {page}</span>
          <button onClick={() => setPage(p => p+1)} className="p-2 bg-[#F5F5F5] hover:bg-[#EAE5D9] transition"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* CLEAN MAIN TABLE */}
      <div className="overflow-x-auto shadow-xl border-2 border-[#1A1A1A] bg-white mb-20 relative z-10 cursor-pointer">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#1A1A1A] text-white uppercase tracking-widest text-xs font-bold">
              <th className="p-5 w-1/4">Directive</th>
              <th className="p-5 w-1/3">Campaign & Asset</th>
              <th className="p-5 text-right">Financials (Spend / CPA / ROAS)</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#E5E5E5]">
            {isLoading ? <tr><td colSpan="3" className="p-12 text-center font-bold text-2xl py-20">Loading Intelligence...</td></tr> : 
              processedAds.map((ad, i) => (
              <tr 
                key={i} 
                onClick={() => setSelectedAd(ad)} // Trigger Side Panel on Click
                className={`transition-colors group hover:opacity-80 ${ad.rowClass}`}
              >
                <td className="p-5 align-middle">
                  <div className={`inline-block px-4 py-2 text-xs font-black uppercase tracking-widest border-2 shadow-sm ${ad.themeClass}`}>
                    {ad.action}
                  </div>
                </td>

                <td className="p-5 align-middle">
                  <div className="font-['Bodoni_Moda'] font-black text-3xl text-[#1A1A1A] leading-none mb-2 tracking-tight">{ad.brandName}</div>
                  <div className="flex items-center gap-3 text-xs text-[#4A4A4A] font-bold uppercase tracking-widest">
                    <span className="bg-[#F5F5F5] px-2 py-1 border border-[#E5E5E5]">{ad.category}</span>
                    <span className="flex items-center gap-1"><ImageIcon size={12}/> {ad.identity.name} {ad.adType}</span>
                  </div>
                </td>

                <td className="p-5 text-right align-middle">
                  <div className="flex justify-end items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-[#737373] uppercase tracking-widest font-bold block mb-1">Spend / CPA</span>
                      <span className="font-['DM_Mono'] font-black text-[#1A1A1A] text-xl">${ad.spend.toLocaleString()}</span>
                      <span className="font-['DM_Mono'] font-bold text-[#737373] text-sm ml-2">(${ad.cpa.toFixed(2)})</span>
                    </div>
                    <div className="pl-4 border-l-2 border-[#E5E5E5] text-right min-w-[100px]">
                      <span className="text-[10px] text-[#737373] uppercase tracking-widest font-bold block mb-1">ROAS</span>
                      <span className={`font-['DM_Mono'] font-black text-3xl tracking-tighter ${ad.roas > 3 ? 'text-[#16A34A]' : 'text-[#1A1A1A]'}`}>
                        {ad.roas.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* INTELLIGENCE DOSSIER (SLIDE-OVER PANEL) */}
      {selectedAd && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dark Overlay Background */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" 
            onClick={() => setSelectedAd(null)}
          ></div>
          
          {/* Side Panel Content */}
          <div className="relative w-full max-w-2xl bg-[#FDFBF7] h-full overflow-y-auto border-l-8 border-[#1A1A1A] shadow-2xl p-8 md:p-12 flex flex-col transform transition-transform duration-300">
            
            <button 
              onClick={() => setSelectedAd(null)}
              className="absolute top-8 right-8 p-2 bg-[#F5F5F5] border-2 border-[#1A1A1A] hover:bg-[#EAE5D9] transition"
            >
              <X size={24} />
            </button>

            <p className="text-xs font-bold text-[#737373] uppercase tracking-widest mb-2 flex items-center gap-2">
              <Crosshair size={14}/> Asset Intelligence Dossier
            </p>
            <h2 className="font-['Bodoni_Moda'] font-black text-5xl md:text-6xl text-[#1A1A1A] leading-none tracking-tight mb-4">
              {selectedAd.brandName}
            </h2>
            
            <div className="flex items-center gap-3 mb-8">
              <div className={`inline-block px-4 py-1 text-xs font-black uppercase tracking-widest border-2 shadow-sm ${selectedAd.themeClass}`}>
                {selectedAd.action} DIRECTIVE
              </div>
              <span className="bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 border-2 border-[#1A1A1A]">
                {selectedAd.category}
              </span>
            </div>

            <div className="bg-white border-2 border-[#E5E5E5] p-6 mb-8 shadow-sm">
              <p className="text-sm font-bold text-[#4A4A4A] leading-relaxed">
                <span className="text-[#1A1A1A] font-black mr-2">SYSTEM NOTE:</span> 
                {selectedAd.actionNote}
              </p>
            </div>

            <h3 className="font-['Bodoni_Moda'] text-3xl font-black mb-4 border-b-2 border-[#1A1A1A] pb-2 uppercase tracking-widest">Financial Reality</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#F5F5F5] p-6 border-2 border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#737373] uppercase tracking-widest mb-2">Total Spend</p>
                <p className="font-['DM_Mono'] text-4xl font-black text-[#1A1A1A]">${selectedAd.spend.toLocaleString()}</p>
              </div>
              <div className="bg-[#F5F5F5] p-6 border-2 border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#737373] uppercase tracking-widest mb-2">Multiplier (ROAS)</p>
                <p className={`font-['DM_Mono'] text-4xl font-black ${selectedAd.roas > 3 ? 'text-[#16A34A]' : 'text-[#1A1A1A]'}`}>{selectedAd.roas.toFixed(2)}x</p>
              </div>
              <div className="bg-[#F5F5F5] p-6 border-2 border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#737373] uppercase tracking-widest mb-2">Revenue Gen</p>
                <p className="font-['DM_Mono'] text-2xl font-black text-[#1A1A1A]">${selectedAd.revenue.toLocaleString()}</p>
              </div>
              <div className="bg-[#F5F5F5] p-6 border-2 border-[#E5E5E5]">
                <p className="text-xs font-bold text-[#737373] uppercase tracking-widest mb-2">Acquisition (CPA)</p>
                <p className="font-['DM_Mono'] text-2xl font-black text-[#1A1A1A]">${selectedAd.cpa.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="font-['Bodoni_Moda'] text-3xl font-black mb-4 border-b-2 border-[#1A1A1A] pb-2 uppercase tracking-widest">Engagement Volume</h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="border-b-2 border-[#E5E5E5] pb-2">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Impressions</p>
                <p className="font-['DM_Mono'] text-xl font-black">{selectedAd.impressions.toLocaleString()}</p>
              </div>
              <div className="border-b-2 border-[#E5E5E5] pb-2">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Clicks</p>
                <p className="font-['DM_Mono'] text-xl font-black">{selectedAd.clicks.toLocaleString()}</p>
              </div>
              <div className="border-b-2 border-[#E5E5E5] pb-2">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Click-Rate (CTR)</p>
                <p className="font-['DM_Mono'] text-xl font-black">{selectedAd.ctr.toFixed(2)}%</p>
              </div>
              <div className="border-b-2 border-[#E5E5E5] pb-2">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Cost Per Click</p>
                <p className="font-['DM_Mono'] text-xl font-black">${selectedAd.cpc.toFixed(2)}</p>
              </div>
              <div className="border-b-2 border-[#E5E5E5] pb-2">
                <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Frequency</p>
                <p className="font-['DM_Mono'] text-xl font-black">{selectedAd.frequency}x</p>
              </div>
            </div>

            <h3 className="font-['Bodoni_Moda'] text-3xl font-black mb-4 border-b-2 border-[#1A1A1A] pb-2 uppercase tracking-widest">Deployment Context</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
               <div>
                 <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">Platform & Format</p>
                 <p className="font-bold text-sm uppercase">{selectedAd.identity.name} • {selectedAd.adType}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">Target Audience</p>
                 <p className="font-bold text-sm uppercase flex items-center gap-1"><Users size={14}/> {selectedAd.targetAudience}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">Creative Theme</p>
                 <p className="font-bold text-sm uppercase">{selectedAd.creativeTheme}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">System Status</p>
                 <p className="font-bold text-sm uppercase flex items-center gap-1">
                   <Activity size={14} className={selectedAd.campaignStatus.toLowerCase() === 'active' ? 'text-[#22C55E]' : 'text-[#DC2626]'}/> 
                   {selectedAd.campaignStatus} ({selectedAd.days} Days)
                 </p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">Creative Score</p>
                 <p className="font-['DM_Mono'] text-lg font-black">{selectedAd.creativeScore} / 10</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">Landing Page Score</p>
                 <p className="font-['DM_Mono'] text-lg font-black">{selectedAd.lpScore} / 10</p>
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