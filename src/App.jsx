import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown, Search } from 'lucide-react';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 300_000, retry: 1 } } });
const API = 'https://mosaicfellowship.in/api/data/content/ads';
const fetchPage = async (p) => { const r = await fetch(`${API}?page=${p}&limit=100`); if (!r.ok) throw new Error(r.status); return r.json(); };

const T = {
  bg:'#F2EDE3', surf:'#FDFAF4', surf2:'#F7F2E8',
  bord:'rgba(42,30,12,.08)', bord2:'rgba(42,30,12,.14)',
  txt:'#1A1508', txt2:'#6B6050', txt3:'#ADA090',
  kill:'#B91C1C', killBg:'rgba(185,28,28,.07)',
  scale:'#166534', scaleBg:'rgba(22,101,52,.07)',
  upgrade:'#92400E', upgradeBg:'rgba(146,64,14,.07)',
  optim:'#B45309', optimBg:'rgba(180,83,9,.07)',
  pause:'#6B7280', pauseBg:'rgba(107,114,128,.07)',
  watch:'#5B21B6', watchBg:'rgba(91,33,182,.07)',
  monitor:'#9CA3AF', monitorBg:'rgba(156,163,175,.05)',
};
const AC = {
  Kill:{c:T.kill,bg:T.killBg,rc:'rk'}, Scale:{c:T.scale,bg:T.scaleBg,rc:'rs'},
  Upgrade:{c:T.upgrade,bg:T.upgradeBg,rc:'ru'}, Optimize:{c:T.optim,bg:T.optimBg,rc:'ro'},
  Pause:{c:T.pause,bg:T.pauseBg,rc:'rp'}, Watch:{c:T.watch,bg:T.watchBg,rc:'rw'},
  Monitor:{c:T.monitor,bg:T.monitorBg,rc:'rm'},
};
const CAT_C = { kill:'#B91C1C',scale:'#166534',upgrade:'#92400E',optimize:'#B45309',pause:'#6B7280',watch:'#5B21B6',info:'#ADA090' };
const PLAT_C = { meta:'#1877F2',facebook:'#1877F2',instagram:'#E1306C',youtube:'#CC0000',google:'#188038' };
const platC = (p='') => { const k=p.toLowerCase(); for(const n in PLAT_C) if(k.includes(n)) return PLAT_C[n]; return '#9CA3AF'; };

const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,600&family=Geist:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:${T.bg};-webkit-font-smoothing:antialiased}
    .fd{font-family:'Cormorant Garamond',Georgia,serif}
    .fb{font-family:'Geist',system-ui,sans-serif}
    @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slidein{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes sk{0%{background-position:-600px 0}100%{background-position:600px 0}}
    .au{animation:up .42s cubic-bezier(.22,.68,0,1.2) both}
    .ain{animation:slidein .32s cubic-bezier(.22,.68,0,1.2) both}
    .apop{animation:up .3s cubic-bezier(.22,.68,0,1.2) both}
    .skel{background:linear-gradient(90deg,rgba(0,0,0,.04) 0%,rgba(0,0,0,.09) 50%,rgba(0,0,0,.04) 100%);background-size:600px 100%;animation:sk 1.6s infinite;border-radius:4px}
    .row{border-left:3px solid transparent;transition:all .15s;cursor:pointer}
    .row:hover{background:rgba(42,30,12,.03)}
    .rk:hover{border-left-color:${T.kill};background:rgba(185,28,28,.04)}
    .rs:hover{border-left-color:${T.scale};background:rgba(22,101,52,.04)}
    .ru:hover{border-left-color:${T.upgrade};background:rgba(146,64,14,.04)}
    .ro:hover{border-left-color:${T.optim};background:rgba(180,83,9,.04)}
    .rw:hover{border-left-color:${T.watch};background:rgba(91,33,182,.04)}
    .rp:hover{border-left-color:${T.pause}}
    .rm:hover{border-left-color:rgba(42,30,12,.1)}
    .fp{transition:all .13s;cursor:pointer}
    .tab-btn{transition:all .15s;cursor:pointer;border:none;font-family:'Geist',system-ui,sans-serif}
    .mcard{transition:transform .18s,box-shadow .18s}
    .mcard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(42,30,12,.09)!important}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:rgba(42,30,12,.12);border-radius:4px}
    input:focus{outline:none}
    .sinput:focus{border-color:rgba(42,30,12,.22)!important}
  `}</style>
);

const analyze = (raw, tCpa) => {
  const spend=+raw.spend||0,conv=+raw.conversions||0,rev=+raw.revenue||0;
  const roas=+raw.roas||0,days=+raw.days_running||0,ctr=+raw.ctr||0;
  const cpc=+raw.cpc||0,impr=+raw.impressions||0,freq=+raw.frequency||0;
  const cs=+raw.creative_score||0,lps=+raw.landing_page_score||0;
  const vcr=raw.video_completion_rate!=null?+raw.video_completion_rate:null;
  const cpa=+raw.cpa||(conv>0?spend/conv:0),status=(raw.status||'').toLowerCase();
  const S=[];
  if(spend>3*tCpa&&conv===0&&days>=5)          S.push({id:'drain',  label:'Budget Drain',        cat:'kill',   w:100,desc:`${spend.toLocaleString()} spent over ${days}d with zero conversions.`});
  if(roas>0&&roas<0.4&&days>=21)               S.push({id:'ruin',   label:'Confirmed Loss',      cat:'kill',   w:96, desc:`ROAS ${roas.toFixed(2)}x below 40p/Rs for ${days} days. Structural.`});
  if(impr>3e6&&ctr<0.2&&conv===0&&days>=7)     S.push({id:'ghost',  label:'Ghost Ad',            cat:'kill',   w:90, desc:`${(impr/1e6).toFixed(1)}M impressions, ${ctr}% CTR, zero conversions.`});
  if(cs<2.5&&lps<3&&conv===0&&spend>tCpa)      S.push({id:'struct', label:'Structural Failure',  cat:'kill',   w:88, desc:`Creative ${cs.toFixed(1)}/10, LP ${lps.toFixed(1)}/10, zero conversions.`});
  if(conv>0&&rev>0&&cs<5&&roas>1.5)            S.push({id:'cceil',  label:'Creative Ceiling',    cat:'upgrade',w:95, desc:`${roas.toFixed(1)}x ROAS despite creative ${cs.toFixed(1)}/10. Upgrade creative to multiply returns.`});
  if(conv>0&&rev>0&&lps<4.5&&roas>1.5)         S.push({id:'lpceil', label:'LP Ceiling',          cat:'upgrade',w:90, desc:`LP ${lps.toFixed(1)}/10 suppressing conversions on a ${roas.toFixed(1)}x ROAS ad.`});
  if(cs>6&&lps<4&&ctr>2&&conv>0)               S.push({id:'lpdrag', label:'LP Drag',             cat:'upgrade',w:82, desc:`Creative ${cs.toFixed(1)}/10 driving ${ctr}% CTR but LP ${lps.toFixed(1)}/10 squanders clicks.`});
  if(cs>7.5&&roas<2&&conv>0&&lps<5)            S.push({id:'cw',     label:'Creative Wasted on LP',cat:'upgrade',w:78,desc:`Creative ${cs.toFixed(1)}/10 working hard but LP ${lps.toFixed(1)}/10 wastes the traffic.`});
  if(vcr!==null&&vcr<30&&conv>0&&cs<6)         S.push({id:'vhook',  label:'Video Hook Upgrade',  cat:'upgrade',w:72, desc:`${vcr}% completion. Compress value into first 3 seconds.`});
  if(cpa>0&&cpa<=tCpa&&ctr>2&&days>=5&&conv>0) S.push({id:'proven', label:'Proven Performer',    cat:'scale',  w:100,desc:`CPA on target. CTR ${ctr}%. ${days}d validated. Ready to scale.`});
  if(roas>=10&&conv>0)                         S.push({id:'champ',  label:'ROAS Champion',       cat:'scale',  w:96, desc:`${roas.toFixed(1)}x return. Push budget aggressively.`});
  if(cs>7&&lps>7&&roas>3&&conv>0)              S.push({id:'ff',     label:'Full Funnel Firing',  cat:'scale',  w:88, desc:`Creative ${cs.toFixed(1)}/10, LP ${lps.toFixed(1)}/10, ROAS ${roas.toFixed(1)}x.`});
  if(vcr!==null&&vcr>70&&conv>0&&cpa<=tCpa*1.2)S.push({id:'vid',    label:'Video Performer',     cat:'scale',  w:82, desc:`${vcr}% video completion with near-target CPA.`});
  if(ctr>3&&lps<5&&conv===0)                   S.push({id:'lpb',    label:'LP Blocking Conv.',   cat:'optimize',w:75,desc:`${ctr}% CTR proves ad works but LP ${lps.toFixed(1)}/10 converts zero.`});
  if(cs<3.5&&ctr<0.8&&spend>tCpa&&conv===0)    S.push({id:'dc',     label:'Creative Not Landing',cat:'optimize',w:65,desc:`Creative ${cs.toFixed(1)}/10 with ${ctr}% CTR. Not breaking through the feed.`});
  if(impr>8e5&&ctr<0.6&&cs<6&&conv===0)        S.push({id:'mm',     label:'Audience Mismatch',   cat:'optimize',w:60,desc:`${(impr/1e6).toFixed(1)}M impressions at ${ctr}% CTR. Test new targeting.`});
  if(vcr!==null&&vcr<20&&spend>500&&conv===0)   S.push({id:'hf',     label:'Hook Failing',        cat:'optimize',w:55,desc:`${vcr}% video completion. Rework the opening 3 seconds.`});
  if(freq>8)                                   S.push({id:'sat',    label:'Audience Saturated',  cat:'pause',  w:72, desc:`Frequency ${freq.toFixed(1)}x. Pull back and refresh creative.`});
  if(freq>5.5&&cpa>tCpa*0.85)                  S.push({id:'fat',    label:'Fatigue Setting In',  cat:'pause',  w:58, desc:`Frequency ${freq.toFixed(1)}x, CPA approaching ceiling.`});
  if(conv>0&&cpa>1.8*tCpa&&days>=7)            S.push({id:'costly', label:'Costly Conversions',  cat:'watch',  w:55, desc:`CPA ${cpa.toFixed(0)} is ${(cpa/tCpa).toFixed(1)}x target.`});
  if(cpc>12&&conv>0)                           S.push({id:'cpcm',   label:'CPC Margin Risk',     cat:'watch',  w:45, desc:`Rs${cpc.toFixed(2)}/click compressing margin.`});
  if(roas>0&&roas<1&&days<14&&conv>0)          S.push({id:'es',     label:'Early Struggle',      cat:'watch',  w:42, desc:`ROAS ${roas.toFixed(2)}x below break-even, only ${days}d in.`});
  if(status==='paused'&&roas>2&&cpa<=tCpa*1.3) S.push({id:'pw',     label:'Paused With Potential',cat:'watch', w:38, desc:`Paused but ROAS ${roas.toFixed(1)}x with near-target CPA.`});
  if(days<4)                                   S.push({id:'new',    label:'Too Early',           cat:'info',   w:20, desc:`Only ${days}d of data. Need more time.`});
  S.sort((a,b)=>b.w-a.w);
  let action='Monitor';
  const has=c=>S.some(s=>s.cat===c);
  if(has('kill'))action='Kill';
  else if(has('scale'))action='Scale';
  else if(has('upgrade'))action='Upgrade';
  else if(S.some(s=>s.id==='sat'||s.id==='fat'))action='Pause';
  else if(has('optimize'))action='Optimize';
  else if(has('watch'))action='Watch';
  return{action,signals:S};
};

const fmt=(n,p='Rs')=>{if(n==null||isNaN(n))return'--';if(n>=1e7)return`${p}${(n/1e7).toFixed(2)}Cr`;if(n>=1e5)return`${p}${(n/1e5).toFixed(2)}L`;if(n>=1e3)return`${p}${(n/1e3).toFixed(1)}K`;return`${p}${Math.round(n).toLocaleString()}`;};
const fmtPct=n=>isNaN(+n)?'--':`${(+n).toFixed(2)}%`;
const Sk=({w='100%',h=13})=><div className="skel" style={{width:w,height:h}}/>;

const Donut = ({ data, size=128 }) => {
  const R=46,cx=size/2,cy=size/2,circ=2*Math.PI*R;
  const total=data.reduce((s,d)=>s+d.v,0);
  if(!total)return null;
  let off=0;
  const segs=data.map(d=>{const len=(d.v/total)*circ;const s={...d,off,len};off+=len;return s;});
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={T.bord} strokeWidth={11}/>
      {segs.filter(s=>s.v>0).map((s,i)=>(
        <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={s.color} strokeWidth={11}
          strokeDasharray={`${s.len} ${circ-s.len}`} strokeDashoffset={-s.off} strokeLinecap="butt"/>
      ))}
    </svg>
  );
};

const ScoreQuad = ({ cs, lps, action }) => {
  const W=156,P=22,inner=W-P*2,mid=P+inner/2;
  const x=P+(lps/10)*inner, y=P+((10-cs)/10)*inner;
  const dc=AC[action]?.c||T.txt3;
  return(
    <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`}>
      <rect x={P} y={P} width={inner/2} height={inner/2} fill="rgba(185,28,28,.05)" rx={2}/>
      <rect x={mid} y={P} width={inner/2} height={inner/2} fill="rgba(180,83,9,.05)" rx={2}/>
      <rect x={P} y={mid} width={inner/2} height={inner/2} fill="rgba(91,33,182,.05)" rx={2}/>
      <rect x={mid} y={mid} width={inner/2} height={inner/2} fill="rgba(22,101,52,.07)" rx={2}/>
      <line x1={mid} y1={P} x2={mid} y2={W-P} stroke={T.bord2} strokeWidth={0.5}/>
      <line x1={P} y1={mid} x2={W-P} y2={mid} stroke={T.bord2} strokeWidth={0.5}/>
      <rect x={P} y={P} width={inner} height={inner} fill="none" stroke={T.bord2} strokeWidth={0.5} rx={3}/>
      <text x={P+4} y={P+9} fontSize={6.5} fill="rgba(185,28,28,.5)" fontFamily="Geist,sans-serif">Both weak</text>
      <text x={W-P-3} y={P+9} textAnchor="end" fontSize={6.5} fill="rgba(180,83,9,.5)" fontFamily="Geist,sans-serif">LP strong</text>
      <text x={P+4} y={W-P-4} fontSize={6.5} fill="rgba(91,33,182,.5)" fontFamily="Geist,sans-serif">Creative strong</text>
      <text x={W-P-3} y={W-P-4} textAnchor="end" fontSize={6.5} fill="rgba(22,101,52,.5)" fontFamily="Geist,sans-serif">Both strong</text>
      <text x={W/2} y={W-2} textAnchor="middle" fontSize={7} fill={T.txt3} fontFamily="Geist,sans-serif">LP Score</text>
      <text x={5} y={W/2} textAnchor="middle" fontSize={7} fill={T.txt3} fontFamily="Geist,sans-serif" transform={`rotate(-90,5,${W/2})`}>Creative</text>
      <circle cx={x} cy={y} r={9} fill={dc} opacity={0.15}/>
      <circle cx={x} cy={y} r={5} fill={dc} opacity={0.9}/>
      <circle cx={x} cy={y} r={5} fill="none" stroke="white" strokeWidth={1} opacity={0.5}/>
    </svg>
  );
};

const RoasBar = ({ roas }) => {
  const pct=Math.min((roas/20)*100,100);
  const color=roas>=2?T.scale:roas>0&&roas<1?T.kill:T.optim;
  return(<div style={{marginTop:3,height:2,background:T.bord,borderRadius:1,overflow:'hidden',width:58}}>
    <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:1}}/>
  </div>);
};

const PlatformBars = ({ ads }) => {
  const pm=useMemo(()=>{
    const m={};
    ads.forEach(a=>{const p=a.platform||'Unknown';if(!m[p])m[p]={spend:0,rev:0};m[p].spend+=a.spend;m[p].rev+=a.revenue;});
    return Object.entries(m).sort((a,b)=>b[1].spend-a[1].spend).slice(0,5);
  },[ads]);
  const maxS=pm[0]?.[1]?.spend||1;
  return(
    <div style={{padding:'18px 40px 22px',borderBottom:`1px solid ${T.bord}`,background:T.surf}}>
      <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:T.txt3,fontWeight:500,marginBottom:14}}>Platform performance</p>
      <div style={{display:'flex',flexDirection:'column',gap:9}}>
        {pm.map(([name,d],i)=>{
          const roas=d.spend>0?d.rev/d.spend:0,pct=(d.spend/maxS)*100,c=platC(name);
          return(
            <div key={name} className="au" style={{animationDelay:`${i*50}ms`,display:'flex',alignItems:'center',gap:12}}>
              <span style={{width:70,textAlign:'right',fontSize:11,fontWeight:500,color:T.txt2,flexShrink:0}}>{name}</span>
              <div style={{flex:1,height:5,background:T.bord,borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:c,borderRadius:3,transition:'width .8s cubic-bezier(.22,.68,0,1.2)'}}/>
              </div>
              <div style={{width:96,flexShrink:0,display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:11,color:T.txt3}}>{fmt(d.spend)}</span>
                <span style={{fontSize:11,fontWeight:600,color:roas>=2?T.scale:roas<1?T.kill:T.txt2}}>{roas.toFixed(1)}x</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MCard = ({ label, value, sub, color, delay=0, accent }) => (
  <div className="au mcard" style={{animationDelay:`${delay}ms`,background:T.surf,border:`1px solid ${T.bord}`,borderRadius:12,padding:'14px 16px',
    borderTop:accent?`3px solid ${accent}`:`1px solid ${T.bord}`,boxShadow:'0 1px 3px rgba(42,30,12,.04)'}}>
    <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:T.txt3,fontWeight:500,marginBottom:7}}>{label}</p>
    <p className="fd" style={{fontSize:26,fontWeight:300,lineHeight:1,color:color||T.txt,fontVariantNumeric:'tabular-nums',letterSpacing:'-.02em'}}>{value}</p>
    {sub&&<p style={{fontSize:11,color:T.txt3,marginTop:4,fontWeight:300}}>{sub}</p>}
  </div>
);

const Tab = ({ active, onClick, children }) => (
  <button onClick={onClick} className="tab-btn" style={{padding:'8px 14px',fontSize:12,fontWeight:active?500:400,
    color:active?T.txt:T.txt3,background:'transparent',borderBottom:`2px solid ${active?T.txt:'transparent'}`}}>
    {children}
  </button>
);

const Dashboard = () => {
  const [tCpa,setTCpa]=useState(50);
  const [editCpa,setEditCpa]=useState(false);
  const [sel,setSel]=useState(null);
  const [dosTab,setDosTab]=useState('overview');
  const [fAct,setFAct]=useState('all');
  const [fPlat,setFPlat]=useState('all');
  const [search,setSearch]=useState('');
  const [sk,setSk]=useState('spend');
  const [sd,setSd]=useState(-1);

  const p1=useQuery({queryKey:['ads',1],queryFn:()=>fetchPage(1)});
  const nPgs=p1.data?.pagination?.total_pages||1;
  const rest=useQueries({queries:Array.from({length:Math.max(0,nPgs-1)},(_,i)=>({queryKey:['ads',i+2],queryFn:()=>fetchPage(i+2),enabled:p1.isSuccess&&nPgs>1}))});
  const loaded=1+rest.filter(q=>q.isSuccess).length;
  const fetching=p1.isSuccess&&loaded<nPgs;

  const allRaw=useMemo(()=>{const rows=[];if(p1.data?.data)rows.push(...p1.data.data);rest.forEach(q=>{if(q.data?.data)rows.push(...q.data.data);});return rows;},[p1.data,rest]);

  const {ads,metrics,platforms}=useMemo(()=>{
    if(!allRaw.length)return{ads:[],metrics:null,platforms:[]};
    const proc=allRaw.map(raw=>{
      const spend=+raw.spend||0,revenue=+raw.revenue||0,conv=+raw.conversions||0;
      const roas=+raw.roas||0,cpa=(+raw.cpa)||(conv>0?spend/conv:0);
      const {action,signals}=analyze(raw,tCpa);
      return{...raw,spend,revenue,conv,roas,cpa,ctr:+raw.ctr||0,cpc:+raw.cpc||0,
        impressions:+raw.impressions||0,clicks:+raw.clicks||0,days:+raw.days_running||0,
        freq:+raw.frequency||0,cs:+raw.creative_score||0,lps:+raw.landing_page_score||0,
        vcr:raw.video_completion_rate!=null?+raw.video_completion_rate:null,action,signals};
    });
    const by=a=>proc.filter(x=>x.action===a);
    const kills=by('Kill'),totalSpend=proc.reduce((s,a)=>s+a.spend,0);
    const totalRev=proc.reduce((s,a)=>s+a.revenue,0),wasted=kills.reduce((s,a)=>s+a.spend,0);
    const pSet=new Set(proc.map(a=>a.platform).filter(Boolean));
    return{ads:proc,metrics:{total:proc.length,totalSpend,totalRev,wasted,roas:totalSpend>0?totalRev/totalSpend:0,
      kills:kills.length,scales:by('Scale').length,upgrades:by('Upgrade').length,optims:by('Optimize').length,
      wasteRatio:totalSpend>0?wasted/totalSpend:0},platforms:Array.from(pSet).sort()};
  },[allRaw,tCpa]);

  const displayed=useMemo(()=>{
    let list=[...ads];
    if(fAct!=='all')list=list.filter(a=>a.action===fAct);
    if(fPlat!=='all')list=list.filter(a=>a.platform===fPlat);
    if(search.trim())list=list.filter(a=>(a.brand||a.ad_id||'').toLowerCase().includes(search.toLowerCase().trim()));
    const ORD={Kill:0,Scale:1,Upgrade:2,Optimize:3,Watch:4,Pause:5,Monitor:6};
    list.sort((a,b)=>{if(fAct==='all'){const d=(ORD[a.action]??6)-(ORD[b.action]??6);if(d!==0)return d;}return((b[sk]??0)-(a[sk]??0))*sd;});
    return list;
  },[ads,fAct,fPlat,search,sk,sd]);

  const handleSort=k=>{if(sk===k)setSd(d=>d*-1);else{setSk(k);setSd(-1);}};
  const SC=({k})=>sk===k?(sd===-1?<ChevronDown size={9} style={{display:'inline',marginLeft:1,opacity:.5}}/>:<ChevronUp size={9} style={{display:'inline',marginLeft:1,opacity:.5}}/>):null;

  const donutData=useMemo(()=>{
    if(!ads.length)return[];
    const cnt={};
    ads.forEach(a=>{cnt[a.action]=(cnt[a.action]||0)+1;});
    return Object.entries(cnt).filter(([,v])=>v>0).map(([k,v])=>({label:k,v,color:AC[k]?.c||T.txt3}));
  },[ads]);

  return(
    <div className="fb" style={{minHeight:'100vh',background:T.bg,color:T.txt}}>
      <Fonts/>
      {fetching&&(
        <div style={{position:'fixed',top:0,left:0,right:0,height:2,zIndex:100}}>
          <div style={{height:'100%',background:T.upgrade,width:`${(loaded/nPgs)*100}%`,transition:'width .4s ease',borderRadius:'0 1px 1px 0',opacity:.75}}/>
        </div>
      )}

      {/* NAV */}
      <div style={{background:T.surf,borderBottom:`1px solid ${T.bord}`,padding:'14px 40px',position:'sticky',top:0,zIndex:20,
        display:'flex',alignItems:'center',gap:14,boxShadow:'0 1px 8px rgba(42,30,12,.05)'}}>
        <h1 className="fd" style={{fontSize:20,fontWeight:400,fontStyle:'italic',color:T.txt,whiteSpace:'nowrap'}}>Ad Intelligence</h1>
        <div style={{width:1,height:16,background:T.bord}}/>
        <span style={{fontSize:11,color:T.txt3,whiteSpace:'nowrap'}}>
          {metrics?.total.toLocaleString()||'--'} ads
          {fetching&&<span style={{color:T.upgrade,marginLeft:6}}>{loaded}/{nPgs} pages</span>}
        </span>
        <div style={{flex:1,maxWidth:280,position:'relative'}}>
          <Search size={12} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.txt3}}/>
          <input className="sinput" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search brands..."
            style={{width:'100%',paddingLeft:28,paddingRight:10,height:32,border:`1px solid ${T.bord}`,borderRadius:8,
              background:T.bg,fontSize:12,color:T.txt,fontFamily:'inherit',transition:'border-color .15s'}}/>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:7,padding:'6px 12px',border:`1px solid ${T.bord}`,borderRadius:8,background:T.bg,cursor:'text'}} onClick={()=>setEditCpa(true)}>
          <Target size={12} style={{color:T.txt3}}/>
          <span style={{fontSize:10,color:T.txt3,textTransform:'uppercase',letterSpacing:'.07em',fontWeight:500}}>CPA</span>
          {editCpa
            ?<input type="number" value={tCpa} autoFocus onChange={e=>setTCpa(Math.max(1,+e.target.value))} onBlur={()=>setEditCpa(false)}
               style={{width:52,background:'transparent',border:'none',outline:'none',color:T.txt,fontSize:13,fontWeight:500,textAlign:'right',fontFamily:'inherit'}}/>
            :<span style={{fontSize:13,fontWeight:500,color:T.txt}}>Rs{tCpa}</span>}
        </div>
      </div>

      {/* HERO */}
      <div style={{padding:'36px 40px 32px',borderBottom:`1px solid ${T.bord}`}}>
        {p1.isLoading?(
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr) 200px',gap:12}}>
            {[1,2,3,4,5].map(i=><Sk key={i} h={76}/>)}
          </div>
        ):metrics&&(
          <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(120px,1fr))',gap:10,flex:'1 1 380px'}}>
              <MCard label="Capital at risk" value={fmt(metrics.wasted)} sub={`${metrics.kills} ads to kill`} color={T.kill} delay={0} accent={T.kill}/>
              <MCard label="Total revenue" value={fmt(metrics.totalRev)} sub={`${metrics.total} ads`} delay={50}/>
              <MCard label="Overall ROAS" value={`${metrics.roas.toFixed(2)}x`} sub="blended" color={metrics.roas>=2?T.scale:metrics.roas<1?T.kill:T.txt} delay={100} accent={metrics.roas>=2?T.scale:undefined}/>
              <MCard label="Scale ready" value={metrics.scales} sub="increase budget" color={T.scale} delay={150} accent={T.scale}/>
              <MCard label="Upgrade" value={metrics.upgrades} sub="latent potential" color={T.upgrade} delay={200} accent={T.upgrade}/>
              <MCard label="Optimize" value={metrics.optims} sub="fix and re-test" color={T.optim} delay={250}/>
            </div>
            <div className="au" style={{animationDelay:'180ms',background:T.surf,border:`1px solid ${T.bord}`,borderRadius:14,
              padding:'18px 20px',display:'flex',gap:18,alignItems:'center',flexShrink:0,boxShadow:'0 1px 4px rgba(42,30,12,.04)'}}>
              <div style={{position:'relative',flexShrink:0}}>
                <Donut data={donutData} size={120}/>
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                  <span className="fd" style={{fontSize:22,fontWeight:300,color:T.txt}}>{metrics.total}</span>
                  <span style={{fontSize:9,color:T.txt3,textTransform:'uppercase',letterSpacing:'.08em',marginTop:1}}>total</span>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5,minWidth:108}}>
                {donutData.map(d=>(
                  <div key={d.label} className="fp" onClick={()=>setFAct(fAct===d.label?'all':d.label)}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'3px 6px',borderRadius:6,
                      background:fAct===d.label?AC[d.label]?.bg:'transparent'}}>
                    <span style={{width:7,height:7,borderRadius:2,background:d.color,flexShrink:0,display:'block'}}/>
                    <span style={{fontSize:11,color:fAct===d.label?d.color:T.txt2,fontWeight:fAct===d.label?500:400}}>{d.label}</span>
                    <span style={{marginLeft:'auto',fontSize:10,color:T.txt3,fontVariantNumeric:'tabular-nums'}}>{d.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {ads.length>0&&<PlatformBars ads={ads}/>}

      {/* FILTER BAR */}
      <div style={{padding:'12px 40px',borderBottom:`1px solid ${T.bord}`,background:T.surf,
        display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',position:'sticky',top:53,zIndex:15}}>
        {['all','Kill','Scale','Upgrade','Optimize','Watch','Pause','Monitor'].map(f=>{
          const active=fAct===f,cfg=AC[f],count=f!=='all'?ads.filter(a=>a.action===f).length:ads.length;
          return(
            <button key={f} onClick={()=>setFAct(f)} className="fp"
              style={{padding:'5px 12px',borderRadius:100,fontSize:11,fontWeight:active?500:400,cursor:'pointer',fontFamily:'inherit',
                border:`1px solid ${active?(cfg?`${cfg.c}55`:T.bord2):T.bord}`,
                background:active?(cfg?cfg.bg:'rgba(42,30,12,.06)'):'transparent',
                color:active?(cfg?cfg.c:T.txt):T.txt2}}>
              {f==='all'?'All':f}<span style={{marginLeft:4,opacity:.4,fontSize:10}}>{count}</span>
            </button>
          );
        })}
        {platforms.length>0&&<div style={{width:1,height:14,background:T.bord,margin:'0 2px'}}/>}
        {platforms.map(p=>{const active=fPlat===p,c=platC(p);return(
          <button key={p} onClick={()=>setFPlat(active?'all':p)} className="fp"
            style={{padding:'5px 12px',borderRadius:100,fontSize:11,fontWeight:active?500:400,cursor:'pointer',fontFamily:'inherit',
              border:`1px solid ${active?`${c}55`:T.bord}`,background:active?`${c}12`:'transparent',color:active?c:T.txt3}}>
            <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:c,marginRight:5,verticalAlign:'middle'}}/>
            {p}
          </button>
        );})}
        <span style={{marginLeft:'auto',fontSize:11,color:T.txt3}}>{displayed.length} shown{search&&` for "${search}"`}</span>
      </div>

      {/* TABLE */}
      <div style={{overflowX:'auto',background:T.surf}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:880}}>
          <thead>
            <tr style={{background:T.bg,borderBottom:`1px solid ${T.bord}`}}>
              {[{l:'Action',key:null,w:90},{l:'Brand',key:null,w:null},{l:'Spend',key:'spend',w:110},{l:'Revenue',key:'revenue',w:115},
                {l:'ROAS',key:'roas',w:95},{l:'CPA',key:'cpa',w:100},{l:'CTR',key:'ctr',w:72},{l:'Conv.',key:'conv',w:72},
                {l:'Days',key:'days',w:60},{l:'Signals',key:null,w:180}].map(({l,key,w})=>(
                <th key={l} onClick={()=>key&&handleSort(key)}
                  style={{padding:'8px 16px',textAlign:'left',fontSize:9,fontWeight:500,textTransform:'uppercase',
                    letterSpacing:'.12em',color:T.txt3,cursor:key?'pointer':'default',userSelect:'none',whiteSpace:'nowrap',width:w||undefined}}>
                  {l}<SC k={key}/>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p1.isLoading?(
              Array.from({length:12}).map((_,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.bord}`}}>
                  {Array.from({length:10}).map((_,j)=>(<td key={j} style={{padding:'13px 16px'}}><Sk w={j===1?110:52} h={11}/></td>))}
                </tr>
              ))
            ):displayed.map((ad,i)=>{
              const cfg=AC[ad.action]||AC.Monitor;
              const top=ad.signals[0];
              const nK=ad.signals.filter(s=>s.cat==='kill').length;
              const nS=ad.signals.filter(s=>s.cat==='scale').length;
              const nU=ad.signals.filter(s=>s.cat==='upgrade').length;
              const shown=nK+nS+nU+(top&&!['kill','scale','upgrade'].includes(top.cat)?1:0);
              return(
                <tr key={ad.ad_id||i} onClick={()=>{setSel(ad);setDosTab('overview');}}
                  className={`row ${cfg.rc} au`} style={{borderBottom:`1px solid ${T.bord}`,animationDelay:`${Math.min(i*12,240)}ms`}}>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{display:'inline-block',padding:'3px 10px',borderRadius:100,fontSize:10,fontWeight:500,
                      background:cfg.bg,color:cfg.c,border:`1px solid ${cfg.c}22`}}>
                      {ad.action}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <div className="fd" style={{fontSize:15,fontWeight:400,fontStyle:'italic',color:T.txt,lineHeight:1.2}}>
                      {ad.brand||ad.ad_id}
                    </div>
                    <div style={{fontSize:10,color:T.txt3,marginTop:2,display:'flex',alignItems:'center',gap:5}}>
                      <span style={{display:'inline-block',width:4,height:4,borderRadius:'50%',background:platC(ad.platform)}}/>
                      {ad.platform} · {ad.category} · {ad.ad_type}
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:12,color:T.txt2,fontVariantNumeric:'tabular-nums'}}>
                    <div>{fmt(ad.spend)}</div>
                    <div style={{marginTop:3,height:2,background:T.bord,borderRadius:1,width:56,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${Math.min((ad.spend/(metrics?.totalSpend||1))*100*20,100)}%`,background:platC(ad.platform),borderRadius:1}}/>
                    </div>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:12,color:T.txt2,fontVariantNumeric:'tabular-nums',opacity:.9}}>{fmt(ad.revenue)}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span className="fd" style={{fontSize:17,fontWeight:400,lineHeight:1,fontVariantNumeric:'tabular-nums',
                      color:ad.roas>=2?T.scale:ad.roas>0&&ad.roas<1?T.kill:T.txt}}>
                      {ad.roas.toFixed(2)}x
                    </span>
                    <RoasBar roas={ad.roas}/>
                  </td>
                  <td style={{padding:'12px 16px',fontSize:12,fontVariantNumeric:'tabular-nums',
                    color:ad.cpa<=tCpa?T.scale:ad.cpa>tCpa*1.8?T.kill:T.optim}}>{fmt(ad.cpa)}</td>
                  <td style={{padding:'12px 16px',fontSize:11,color:T.txt3,fontVariantNumeric:'tabular-nums'}}>{fmtPct(ad.ctr)}</td>
                  <td style={{padding:'12px 16px',fontSize:11,color:T.txt3,fontVariantNumeric:'tabular-nums'}}>{ad.conv.toLocaleString()}</td>
                  <td style={{padding:'12px 16px',fontSize:11,color:T.txt3}}>{ad.days}d</td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {nK>0&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:100,background:'rgba(185,28,28,.1)',color:T.kill,fontWeight:600}}>{nK} kill</span>}
                      {nS>0&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:100,background:'rgba(22,101,52,.1)',color:T.scale,fontWeight:600}}>{nS} scale</span>}
                      {nU>0&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:100,background:'rgba(146,64,14,.1)',color:T.upgrade,fontWeight:600}}>{nU} upgrade</span>}
                      {top&&!['kill','scale','upgrade'].includes(top.cat)&&(
                        <span style={{fontSize:9,padding:'2px 7px',borderRadius:100,background:`${CAT_C[top.cat]||T.txt3}15`,color:CAT_C[top.cat]||T.txt3}}>{top.label}</span>
                      )}
                      {ad.signals.length>shown&&<span style={{fontSize:9,color:T.txt3}}> +{ad.signals.length-shown}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!p1.isLoading&&displayed.length===0&&(
          <div style={{padding:'72px 40px',textAlign:'center',color:T.txt3,fontSize:14}}>
            {search?`No ads found for "${search}"`:'No ads match the current filter.'}
          </div>
        )}
      </div>

      {/* DOSSIER */}
      {sel&&(()=>{
        const cfg=AC[sel.action]||AC.Monitor;
        return(
          <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',justifyContent:'flex-end'}}>
            <div onClick={()=>setSel(null)} style={{position:'absolute',inset:0,background:'rgba(15,10,4,.35)',backdropFilter:'blur(8px)'}}/>
            <div className="ain fb" style={{position:'relative',width:'100%',maxWidth:480,background:T.surf,borderLeft:`1px solid ${T.bord}`,
              height:'100%',overflowY:'auto',display:'flex',flexDirection:'column',boxShadow:'-20px 0 60px rgba(42,30,12,.12)'}}>
              <div style={{padding:'22px 26px 0',borderBottom:`1px solid ${T.bord}`,position:'sticky',top:0,background:T.surf,zIndex:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                  <div>
                    <span style={{fontSize:9,textTransform:'uppercase',letterSpacing:'.14em',color:T.txt3,display:'block',marginBottom:7}}>Intelligence Brief</span>
                    <h2 className="fd" style={{fontSize:26,fontWeight:400,fontStyle:'italic',color:T.txt,lineHeight:1.2}}>{sel.brand||sel.ad_id}</h2>
                    <p style={{fontSize:11,color:T.txt3,marginTop:4,display:'flex',alignItems:'center',gap:5}}>
                      <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:platC(sel.platform)}}/>
                      {sel.platform} · {sel.ad_type} · {sel.category}
                    </p>
                  </div>
                  <button onClick={()=>setSel(null)} style={{background:T.bg,border:`1px solid ${T.bord}`,borderRadius:'50%',width:30,height:30,
                    display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:T.txt2,flexShrink:0,marginTop:2}}>
                    <X size={14}/>
                  </button>
                </div>
                <div style={{padding:'9px 13px',borderRadius:8,background:cfg.bg,borderLeft:`3px solid ${cfg.c}`,marginBottom:14}}>
                  <span style={{fontSize:10,fontWeight:600,color:cfg.c,textTransform:'uppercase',letterSpacing:'.07em'}}>{sel.action}</span>
                  <p style={{fontSize:12,color:T.txt2,marginTop:2,lineHeight:1.55}}>{sel.signals[0]?.desc||'Performance within normal range.'}</p>
                </div>
                <div style={{display:'flex',gap:0,borderTop:`1px solid ${T.bord}`}}>
                  <Tab active={dosTab==='overview'} onClick={()=>setDosTab('overview')}>Overview</Tab>
                  <Tab active={dosTab==='signals'} onClick={()=>setDosTab('signals')}>Signals ({sel.signals.length})</Tab>
                  <Tab active={dosTab==='details'} onClick={()=>setDosTab('details')}>Details</Tab>
                </div>
              </div>

              <div style={{padding:'20px 26px',flex:1}}>
                {dosTab==='overview'&&(
                  <>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:20}}>
                      {[
                        {l:'Spend',v:fmt(sel.spend)},
                        {l:'Revenue',v:fmt(sel.revenue)},
                        {l:'ROAS',v:`${sel.roas.toFixed(2)}x`,c:sel.roas>=2?T.scale:sel.roas>0&&sel.roas<1?T.kill:T.txt},
                        {l:'CPA',v:fmt(sel.cpa),c:sel.cpa<=tCpa?T.scale:sel.cpa>tCpa*1.8?T.kill:T.optim},
                        {l:'CTR',v:fmtPct(sel.ctr)},
                        {l:'Conv.',v:sel.conv.toLocaleString()},
                        {l:'Creative',v:`${sel.cs.toFixed(1)}/10`,c:sel.cs>=7?T.scale:sel.cs<4?T.kill:T.txt},
                        {l:'LP score',v:`${sel.lps.toFixed(1)}/10`,c:sel.lps>=7?T.scale:sel.lps<4?T.kill:T.txt},
                        {l:'Freq.',v:`${sel.freq.toFixed(1)}x`,c:sel.freq>7?T.kill:T.txt},
                      ].map(({l,v,c=T.txt2})=>(
                        <div key={l} className="apop" style={{padding:'9px 11px',border:`1px solid ${T.bord}`,borderRadius:8,background:T.bg}}>
                          <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'.1em',color:T.txt3,fontWeight:500,marginBottom:4}}>{l}</p>
                          <p className="fd" style={{fontSize:19,fontWeight:300,lineHeight:1,color:c,fontVariantNumeric:'tabular-nums'}}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{background:T.bg,border:`1px solid ${T.bord}`,borderRadius:10,padding:'14px 16px',display:'flex',gap:14,alignItems:'flex-start'}}>
                      <div>
                        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'.1em',color:T.txt3,fontWeight:500,marginBottom:8}}>Asset quality map</p>
                        <ScoreQuad cs={sel.cs} lps={sel.lps} action={sel.action}/>
                      </div>
                      <div style={{flex:1}}>
                        <p style={{fontSize:9,textTransform:'uppercase',letterSpacing:'.1em',color:T.txt3,fontWeight:500,marginBottom:10}}>Score bars</p>
                        {[
                          {l:'Creative',v:sel.cs,c:sel.cs>=7?T.scale:sel.cs<4?T.kill:T.optim},
                          {l:'Landing page',v:sel.lps,c:sel.lps>=7?T.scale:sel.lps<4?T.kill:T.optim},
                          ...(sel.vcr!=null?[{l:'Video compl.',v:sel.vcr/10,c:sel.vcr>60?T.scale:sel.vcr<25?T.kill:T.optim,pct:sel.vcr,label:`${sel.vcr}%`}]:[]),
                        ].map(({l,v,c,pct,label})=>(
                          <div key={l} style={{marginBottom:10}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                              <span style={{fontSize:11,color:T.txt2}}>{l}</span>
                              <span style={{fontSize:11,fontWeight:500,color:c}}>{label||`${v.toFixed(1)}/10`}</span>
                            </div>
                            <div style={{height:5,background:T.bord,borderRadius:3,overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${(pct!==undefined?pct:v*10)}%`,background:c,borderRadius:3,transition:'width .7s ease'}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {dosTab==='signals'&&(
                  <div style={{display:'flex',flexDirection:'column',gap:7}}>
                    {sel.signals.length===0?(
                      <p className="fd" style={{fontSize:15,color:T.txt3,fontStyle:'italic',padding:'20px 0'}}>No active signals detected.</p>
                    ):sel.signals.map(sig=>{
                      const c=CAT_C[sig.cat]||T.txt3;
                      return(
                        <div key={sig.id} style={{padding:'11px 14px',borderRadius:9,background:`${c}0E`,borderLeft:`3px solid ${c}`}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                            <span style={{fontSize:11,fontWeight:600,color:c,letterSpacing:'.03em'}}>{sig.label}</span>
                            <span style={{fontSize:9,color:T.txt3,textTransform:'uppercase',letterSpacing:'.07em',
                              background:`${c}15`,padding:'2px 7px',borderRadius:100}}>{sig.cat}</span>
                          </div>
                          <p style={{fontSize:12,color:T.txt2,lineHeight:1.55}}>{sig.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {dosTab==='details'&&(
                  <div>
                    {[['Ad ID',sel.ad_id],['Brand',sel.brand],['Platform',sel.platform],['Ad type',sel.ad_type],
                      ['Category',sel.category],['Audience',sel.target_audience],['Creative theme',sel.creative_theme],
                      ['Status',sel.status],['Start date',sel.start_date],['Days running',`${sel.days}d`],
                      ['Spend',fmt(sel.spend)],['Revenue',fmt(sel.revenue)],['ROAS',`${sel.roas.toFixed(2)}x`],
                      ['CPA',fmt(sel.cpa)],['CTR',fmtPct(sel.ctr)],['CPC',fmt(sel.cpc)],
                      ['Conversions',sel.conv.toLocaleString()],['Impressions',(+sel.impressions||0).toLocaleString()],
                      ['Clicks',(+sel.clicks||0).toLocaleString()],['Frequency',`${sel.freq.toFixed(2)}x`],
                      ['Creative score',`${sel.cs.toFixed(1)}/10`],['LP score',`${sel.lps.toFixed(1)}/10`],
                      ['Video compl.',sel.vcr!=null?`${sel.vcr}%`:'N/A'],
                    ].map(([label,value])=>(
                      <div key={label} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'7px 0',borderBottom:`1px solid ${T.bord}`}}>
                        <span style={{fontSize:11,color:T.txt3}}>{label}</span>
                        <span style={{fontSize:12,color:T.txt2}}>{value||'--'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default function App() {
  return <QueryClientProvider client={queryClient}><Dashboard/></QueryClientProvider>;
}