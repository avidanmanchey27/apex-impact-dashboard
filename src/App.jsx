import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300_000, retry: 1 } },
});

const API = 'https://mosaicfellowship.in/api/data/content/ads';

const fetchPage = async (p) => {
  const r = await fetch(`${API}?page=${p}&limit=100`);
  if (!r.ok) throw new Error(`Page ${p}: ${r.status}`);
  return r.json();
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond&family=Geist&display=swap');
    body { background: #080806; }
  `}</style>
);

// ─── SIGNAL ENGINE (UNCHANGED) ─────────────────────────────────────────────────
const analyzeAd = (raw, targetCpa) => {
  const spend = +raw.spend || 0;
  const conv = +raw.conversions || 0;
  const revenue = +raw.revenue || 0;
  const roas = +raw.roas || 0;
  const days = +raw.days_running || 0;
  const ctr = +raw.ctr || 0;
  const cpc = +raw.cpc || 0;
  const impr = +raw.impressions || 0;
  const freq = +raw.frequency || 0;
  const cs = +raw.creative_score || 0;
  const lps = +raw.landing_page_score || 0;
  const cpa = +raw.cpa || (conv > 0 ? spend / conv : 0);

  const S = [];

  if (spend > 3 * targetCpa && conv === 0)
    S.push({ cat: 'kill', weight: 100, label: 'Capital Bleed' });

  if (roas > 0 && roas < 1 && days >= 14)
    S.push({ cat: 'kill', weight: 95, label: 'Sustained Loss' });

  if (cpa <= targetCpa && ctr > 2 && conv > 0)
    S.push({ cat: 'scale', weight: 100, label: 'Proven Performer' });

  if (ctr > 3 && lps < 5)
    S.push({ cat: 'optimize', weight: 70, label: 'LP Leak' });

  S.sort((a, b) => b.weight - a.weight);

  let action = 'Monitor';
  if (S.some(s => s.cat === 'kill')) action = 'Kill';
  else if (S.some(s => s.cat === 'scale')) action = 'Scale';
  else if (S.some(s => s.cat === 'optimize')) action = 'Optimize';

  return { action, signals: S };
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [targetCpa, setTargetCpa] = useState(50);
  const [editingCpa, setEditingCpa] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState(-1);

  const page1 = useQuery({
    queryKey: ['ads', 1],
    queryFn: () => fetchPage(1),
  });

  const totalPages = page1.data?.pagination?.total_pages || 1;

  const restQ = useQueries({
    queries: Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      queryKey: ['ads', i + 2],
      queryFn: () => fetchPage(i + 2),
      enabled: page1.isSuccess,
    })),
  });

  const allRaw = useMemo(() => {
    const rows = [];
    if (page1.data?.data) rows.push(...page1.data.data);
    restQ.forEach(q => q.data?.data && rows.push(...q.data.data));
    return rows;
  }, [page1.data, restQ]);

  const ads = useMemo(() => {
    return allRaw.map(raw => {
      const { action, signals } = analyzeAd(raw, targetCpa);
      return {
        ...raw,
        spend: +raw.spend || 0,
        revenue: +raw.revenue || 0,
        ctr: +raw.ctr || 0,
        platform: raw.platform?.toLowerCase() || '',
        action,
        signals,
      };
    });
  }, [allRaw, targetCpa]);

  // ✅ NEW: extract unique platforms
  const platforms = useMemo(() => {
    return Array.from(new Set(ads.map(a => a.platform).filter(Boolean)));
  }, [ads]);

  const displayed = useMemo(() => {
    let list = [...ads];

    if (filterPlatform !== 'all') {
      list = list.filter(a => a.platform === filterPlatform.toLowerCase());
    }

    list.sort((a, b) => {
      const valA = a[sortKey] ?? 0;
      const valB = b[sortKey] ?? 0;
      return (valA - valB) * sortDir;
    });

    return list;
  }, [ads, filterPlatform, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => -d);
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  // ✅ NEW: sort icon helper
  const SortIcon = ({ column }) => {
    if (sortKey !== column) return null;
    return sortDir === 1 ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div style={{ padding: 20 }}>
      <Fonts />

      {/* ✅ NEW: Loading + Error */}
      {page1.isLoading && <p>Loading ads...</p>}
      {page1.isError && <p>Error loading data</p>}

      {/* CPA INPUT */}
      <div>
        {editingCpa ? (
          <input
            value={targetCpa}
            type="number"
            autoFocus
            onChange={(e) => setTargetCpa(+e.target.value)}
            onBlur={() => setEditingCpa(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingCpa(false)}
          />
        ) : (
          <h3 onClick={() => setEditingCpa(true)}>Target CPA: ₹{targetCpa}</h3>
        )}
      </div>

      {/* ✅ NEW: PLATFORM FILTER UI */}
      <div style={{ margin: '10px 0' }}>
        <button onClick={() => setFilterPlatform('all')}>All</button>
        {platforms.map(p => (
          <button key={p} onClick={() => setFilterPlatform(p)} style={{ marginLeft: 6 }}>
            {p}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th onClick={() => handleSort('spend')}>
              Spend <SortIcon column="spend" />
            </th>
            <th onClick={() => handleSort('revenue')}>
              Revenue <SortIcon column="revenue" />
            </th>
            <th onClick={() => handleSort('ctr')}>
              CTR <SortIcon column="ctr" />
            </th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {displayed.map((ad, i) => (
            <tr key={i}>
              <td>{ad.spend}</td>
              <td>{ad.revenue}</td>
              <td>{ad.ctr}</td>
              <td>{ad.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
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