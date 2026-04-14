import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueries } from '@tanstack/react-query';
import { X, Target, ChevronUp, ChevronDown, Search, Sparkles, TrendingUp, AlertTriangle, Zap, Eye, Pause, BarChart3 } from 'lucide-react';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 300000, retry: 1 } } });
const API = 'https://mosaicfellowship.in/api/data/content/ads';
const fetchPage = async (p) => { const r = await fetch(API + '?page=' + p + '&limit=100'); if (!r.ok) throw new Error(r.status); return r.json(); };

const C = {
  bg:'#F5EFE4', surf:'#FDFAF5', bord:'rgba(40,25,8,.1)', bord2:'rgba(40,25,8,.18)',
  ink:'#1A1208', ink2:'#4A3C28', ink3:'#7A6A52', ink4:'#A89880',
  kill:'#C0392B', killBg:'rgba(192,57,43,.08)',
  scale:'#1A6B3C', scaleBg:'rgba(26,107,60,.07)',
  upgrade:'#A0522D', upgradeBg:'rgba(160,82,45,.08)',
  optim:'#C47A1E', optimBg:'rgba(196,122,30,.07)',
  pause:'#5A6472', pauseBg:'rgba(90,100,114,.07)',
  watch:'#5B3FA0', watchBg:'rgba(91,63,160,.07)',
  monitor:'#8A9BAA', monitorBg:'rgba(138,155,170,.06)',
};

const ACT = {
  Kill:{c:C.kill,bg:C.killBg,rc:'rk',icon:AlertTriangle},
  Scale:{c:C.scale,bg:C.scaleBg,rc:'rs',icon:TrendingUp},
  Upgrade:{c:C.upgrade,bg:C.upgradeBg,rc:'ru',icon:Zap},
  Optimize:{c:C.optim,bg:C.optimBg,rc:'ro',icon:Sparkles},
  Pause:{c:C.pause,bg:C.pauseBg,rc:'rp',icon:Pause},
  Watch:{c:C.watch,bg:C.watchBg,rc:'rw',icon:Eye},
  Monitor:{c:C.monitor,bg:C.monitorBg,rc:'rm',icon:BarChart3},
};
const CAT_C = {kill:C.kill,scale:C.scale,upgrade:C.upgrade,optimize:C.optim,pause:C.pause,watch:C.watch,info:C.ink4};
const PLAT_C = {meta:'#1877F2',facebook:'#1877F2',instagram:'#D62976',youtube:'#CC0000',google:'#1A8A47'};
const platC = (p) => { if(!p) return '#8A9BAA'; const k=p.toLowerCase(); for(const n in PLAT_C) if(k.includes(n)) return PLAT_C[n]; return '#8A9BAA'; };

const Sty = () => React.createElement('style', null, `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Lora:ital,wght@0,600;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};-webkit-font-smoothing:antialiased}
  .fh{font-family:'Playfair Display',Georgia,serif}
  .fb{font-family:'Lora',Georgia,serif}
  .fu{font-family:'Plus Jakarta Sans',system-ui,sans-serif}
  .fd{font-family:'DM Mono','Courier New',monospace}
  @keyframes fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slidein{from{opacity:0;transform:translateX(44px)}to{opacity:1;transform:translateX(0)}}
  @keyframes sk{0%{background-position:-600px 0}100%{background-position:600px 0}}
  .au{animation:fadeup .44s cubic-bezier(.22,.68,0,1.2) both}
  .ain{animation:slidein .34s cubic-bezier(.22,.68,0,1.2) both}
  .apop{animation:fadeup .28s cubic-bezier(.22,.68,0,1.2) both}
  .skel{background:linear-gradient(90deg,rgba(40,25,8,.04) 0%,rgba(40,25,8,.1) 50%,rgba(40,25,8,.04) 100%);background-size:600px 100%;animation:sk 1.6s infinite;border-radius:6px}
  .row{border-left:3px solid transparent;transition:background .14s,border-color .14s;cursor:pointer}
  .row:hover{background:rgba(40,25,8,.03)}
  .rk:hover{border-left-color:${C.kill};background:rgba(192,57,43,.04)}
  .rs:hover{border-left-color:${C.scale};background:rgba(26,107,60,.04)}
  .ru:hover{border-left-color:${C.upgrade};background:rgba(160,82,45,.04)}
  .ro:hover{border-left-color:${C.optim};background:rgba(196,122,30,.04)}
  .rw:hover{border-left-color:${C.watch};background:rgba(91,63,160,.04)}
  .rp:hover{border-left-color:${C.pause}}
  .rm:hover{border-left-color:rgba(40,25,8,.1)}
  .hl{transition:transform .18s,box-shadow .18s;cursor:default}
  .hl:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(40,25,8,.1)!important}
  .hb{transition:background .13s;cursor:pointer}
  .hb:hover{background:rgba(40,25,8,.05)!important}
  .pill{transition:all .14s;cursor:pointer;border:none}
  .tab{transition:all .15s;cursor:pointer;border:none;background:transparent}
  .si:focus{outline:none;border-color:rgba(40,25,8,.28)!important}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(40,25,8,.14);border-radius:4px}
`);

// tCpa = null means "no CPA set for this ad" → ROAS-only mode, CPA-dependent signals skipped
const analyze = (raw, tCpa) => {
  const spend=+raw.spend||0,conv=+raw.conversions||0,rev=+raw.revenue||0;
  const roas=+raw.roas||0,days=+raw.days_running||0,ctr=+raw.ctr||0;
  const cpc=+raw.cpc||0,impr=+raw.impressions||0,freq=+raw.frequency||0;
  const cs=+raw.creative_score||0,lps=+raw.landing_page_score||0;
  const vcr=raw.video_completion_rate!=null?+raw.video_completion_rate:null;
  const cpa=+raw.cpa||(conv>0?spend/conv:0);
  const status=(raw.status||'').toLowerCase();
  const hasCpa=tCpa!=null&&tCpa>0;
  const S=[];

  // ── CPA-dependent kill signals (only when target set) ──
  if(hasCpa&&spend>3*tCpa&&conv===0&&days>=5) S.push({id:'drain',label:'Budget Drain',cat:'kill',w:100,desc:'Rs'+spend.toLocaleString()+' spent over '+days+'d — '+(spend/tCpa).toFixed(1)+'x target CPA — zero conversions.'});
  if(hasCpa&&cs<2.5&&lps<3&&conv===0&&spend>tCpa) S.push({id:'struct',label:'Structural Failure',cat:'kill',w:88,desc:'Creative '+cs.toFixed(1)+'/10, LP '+lps.toFixed(1)+'/10, zero conversions.'});

  // ── ROAS-only kill signals (always active) ──
  if(roas>0&&roas<0.4&&days>=21) S.push({id:'ruin',label:'Confirmed Loss',cat:'kill',w:96,desc:'ROAS '+roas.toFixed(2)+'x below break-even for '+days+' days. Data confirms structural loss.'});
  if(impr>3e6&&ctr<0.2&&conv===0&&days>=7) S.push({id:'ghost',label:'Ghost Ad',cat:'kill',w:90,desc:(impr/1e6).toFixed(1)+'M impressions, '+ctr+'% CTR, zero conversions. Audience has voted.'});

  // ── Upgrade signals (ROAS-based, always active) ──
  if(conv>0&&rev>0&&cs<5&&roas>1.5) S.push({id:'cceil',label:'Creative Ceiling',cat:'upgrade',w:95,desc:roas.toFixed(1)+'x ROAS despite creative '+cs.toFixed(1)+'/10. Better creative = higher returns.'});
  if(conv>0&&rev>0&&lps<4.5&&roas>1.5) S.push({id:'lpceil',label:'LP Ceiling',cat:'upgrade',w:90,desc:'LP '+lps.toFixed(1)+'/10 suppressing conversions on a '+roas.toFixed(1)+'x ROAS ad.'});
  if(cs>6&&lps<4&&ctr>2&&conv>0) S.push({id:'lpdrag',label:'LP Drag',cat:'upgrade',w:82,desc:'Creative '+cs.toFixed(1)+'/10 driving '+ctr+'% CTR but LP '+lps.toFixed(1)+'/10 squanders those clicks.'});
  if(cs>7.5&&roas<2&&conv>0&&lps<5) S.push({id:'cw',label:'Creative Wasted on Bad LP',cat:'upgrade',w:78,desc:'Creative '+cs.toFixed(1)+'/10 doing its job but LP '+lps.toFixed(1)+'/10 wastes the traffic.'});
  if(vcr!==null&&vcr<30&&conv>0&&cs<6) S.push({id:'vhook',label:'Video Hook Upgrade',cat:'upgrade',w:72,desc:vcr+'% video completion. Compress value into first 3 seconds — fundamentals sound.'});

  // ── CPA-dependent scale signals ──
  if(hasCpa&&cpa>0&&cpa<=tCpa&&ctr>2&&days>=5&&conv>0) S.push({id:'proven',label:'Proven Performer',cat:'scale',w:100,desc:'CPA Rs'+cpa.toFixed(0)+' on target, CTR '+ctr+'%, '+days+'d validated. Scale now.'});
  if(hasCpa&&vcr!==null&&vcr>70&&conv>0&&cpa<=tCpa*1.2) S.push({id:'vid',label:'Video Performer',cat:'scale',w:82,desc:vcr+'% video completion with near-target CPA.'});

  // ── ROAS-only scale signals (always active) ──
  if(roas>=10&&conv>0) S.push({id:'champ',label:'ROAS Champion',cat:'scale',w:96,desc:roas.toFixed(1)+'x return on spend. Push budget aggressively.'});
  if(cs>7&&lps>7&&roas>3&&conv>0) S.push({id:'ff',label:'Full Funnel Firing',cat:'scale',w:88,desc:'Creative '+cs.toFixed(1)+'/10, LP '+lps.toFixed(1)+'/10, ROAS '+roas.toFixed(1)+'x. Everything working.'});

  // ── Optimize signals ──
  if(ctr>3&&lps<5&&conv===0) S.push({id:'lpb',label:'LP Blocking Conv.',cat:'optimize',w:75,desc:ctr+'% CTR proves ad works — LP '+lps.toFixed(1)+'/10 converts zero. Fix the page.'});
  if(hasCpa&&cs<3.5&&ctr<0.8&&spend>tCpa&&conv===0) S.push({id:'dc',label:'Creative Not Landing',cat:'optimize',w:65,desc:'Creative '+cs.toFixed(1)+'/10 with '+ctr+'% CTR. Not breaking through the feed.'});
  if(impr>8e5&&ctr<0.6&&cs<6&&conv===0) S.push({id:'mm',label:'Audience Mismatch',cat:'optimize',w:60,desc:(impr/1e6).toFixed(1)+'M impressions at '+ctr+'% CTR. Test new targeting.'});
  if(vcr!==null&&vcr<20&&spend>500&&conv===0) S.push({id:'hf',label:'Hook Failing',cat:'optimize',w:55,desc:vcr+'% video completion. Rework the opening 3 seconds.'});

  // ── Pause signals ──
  if(freq>8) S.push({id:'sat',label:'Audience Saturated',cat:'pause',w:72,desc:'Frequency '+freq.toFixed(1)+'x. Rest it, refresh creative, return in 2 weeks.'});
  if(hasCpa&&freq>5.5&&cpa>tCpa*0.85) S.push({id:'fat',label:'Fatigue Setting In',cat:'pause',w:58,desc:'Frequency '+freq.toFixed(1)+'x approaching saturation. Rotate before performance drops.'});

  // ── Watch signals ──
  if(hasCpa&&conv>0&&cpa>1.8*tCpa&&days>=7) S.push({id:'costly',label:'Costly Conversions',cat:'watch',w:55,desc:'CPA Rs'+cpa.toFixed(0)+' is '+(cpa/tCpa).toFixed(1)+'x target. Unsustainable long-term.'});
  if(cpc>12&&conv>0) S.push({id:'cpcm',label:'CPC Margin Risk',cat:'watch',w:45,desc:'Rs'+cpc.toFixed(2)+'/click compressing margin. Monitor CPA trend.'});
  if(roas>0&&roas<1&&days<14&&conv>0) S.push({id:'es',label:'Early Struggle',cat:'watch',w:42,desc:'ROAS '+roas.toFixed(2)+'x below break-even, only '+days+'d in. Give it time.'});
  if(hasCpa&&status==='paused'&&roas>2&&cpa<=tCpa*1.3) S.push({id:'pw',label:'Paused With Potential',cat:'watch',w:38,desc:'Paused — but ROAS '+roas.toFixed(1)+'x with near-target CPA. Investigate.'});

  // ── Info ──
  if(days<4) S.push({id:'new',label:'Too Early to Judge',cat:'info',w:20,desc:'Only '+days+'d of data — need at least 5d to draw conclusions.'});

  S.sort((a,b)=>b.w-a.w);
  let action='Monitor';
  const has=c=>S.some(s=>s.cat===c);
  if(has('kill'))action='Kill';
  else if(has('scale'))action='Scale';
  else if(has('upgrade'))action='Upgrade';
  else if(S.some(s=>s.id==='sat'||s.id==='fat'))action='Pause';
  else if(has('optimize'))action='Optimize';
  else if(has('watch'))action='Watch';
  return{action,signals:S,hasCpa};
};

const fmt=(n,p)=>{p=p||'Rs';if(n==null||isNaN(n))return'--';if(n>=1e7)return p+(n/1e7).toFixed(2)+'Cr';if(n>=1e5)return p+(n/1e5).toFixed(2)+'L';if(n>=1e3)return p+(n/1e3).toFixed(1)+'K';return p+Math.round(n).toLocaleString();};
const fmtPct=n=>isNaN(+n)?'--':(+n).toFixed(2)+'%';
const Sk=({w,h})=>React.createElement('div',{className:'skel',style:{width:w||'100%',height:h||13}});

const Donut=({data,size})=>{
  size=size||120;
  const R=44,cx=size/2,cy=size/2,circ=2*Math.PI*R;
  const total=data.reduce((s,d)=>s+d.v,0);
  if(!total)return null;
  let off=0;
  const segs=data.map(d=>{const len=(d.v/total)*circ;const s=Object.assign({},d,{off,len});off+=len;return s;});
  return React.createElement('svg',{width:size,height:size,viewBox:'0 0 '+size+' '+size,style:{transform:'rotate(-90deg)'}},
    React.createElement('circle',{cx,cy,r:R,fill:'none',stroke:C.bord,strokeWidth:12}),
    ...segs.filter(s=>s.v>0).map((s,i)=>React.createElement('circle',{key:i,cx,cy,r:R,fill:'none',stroke:s.color,strokeWidth:12,strokeDasharray:s.len+' '+(circ-s.len),strokeDashoffset:-s.off,strokeLinecap:'butt'}))
  );
};

// Asset Quality Map
// X-axis: LP Score  0→10  (left = weak, right = strong)
// Y-axis: Creative  0→10  (bottom = weak, top = strong)
// SVG Y goes DOWN, so high creative score → small y value → near the top. Labels placed accordingly.
const ScoreMap=({cs,lps,action})=>{
  const W=164, P=20, inner=W-P*2, mid=P+inner/2;
  // Dot: high LP → right, high creative → top (small y)
  const dotX=P+(lps/10)*inner;
  const dotY=P+((10-cs)/10)*inner;
  const dc=ACT[action]?ACT[action].c:C.ink3;
  const F='Plus Jakarta Sans,sans-serif';

  // Quadrant colours (now correct):
  // top-left    = high creative, low LP  → fix LP   (amber)
  // top-right   = high creative, high LP → both good (green)
  // bottom-left = low creative,  low LP  → both weak (red)
  // bottom-right= low creative,  high LP → fix creative (upgrade brown)
  return React.createElement('svg',{width:W,height:W,viewBox:'0 0 '+W+' '+W},

    // Quadrant fills
    React.createElement('rect',{x:P,    y:P,    width:inner/2,height:inner/2,fill:'rgba(196,122,30,.07)',rx:2}), // top-left:  fix LP
    React.createElement('rect',{x:mid,  y:P,    width:inner/2,height:inner/2,fill:'rgba(26,107,60,.09)', rx:2}), // top-right: both strong
    React.createElement('rect',{x:P,    y:mid,  width:inner/2,height:inner/2,fill:'rgba(192,57,43,.07)', rx:2}), // bottom-left: both weak
    React.createElement('rect',{x:mid,  y:mid,  width:inner/2,height:inner/2,fill:'rgba(160,82,45,.07)', rx:2}), // bottom-right: fix creative

    // Grid lines
    React.createElement('line',{x1:mid,y1:P,x2:mid,y2:P+inner,stroke:C.bord2,strokeWidth:0.6}),
    React.createElement('line',{x1:P,y1:mid,x2:P+inner,y2:mid,stroke:C.bord2,strokeWidth:0.6}),
    React.createElement('rect',{x:P,y:P,width:inner,height:inner,fill:'none',stroke:C.bord2,strokeWidth:0.8,rx:3}),

    // Axis score ticks
    React.createElement('text',{x:P,    y:P-4, fontSize:7,fill:C.ink4,fontFamily:F,textAnchor:'middle'},'10'),
    React.createElement('text',{x:P,    y:P+inner+9,fontSize:7,fill:C.ink4,fontFamily:F,textAnchor:'middle'},'0'),
    React.createElement('text',{x:P+inner,y:P+inner+9,fontSize:7,fill:C.ink4,fontFamily:F,textAnchor:'middle'},'10'),

    // Axis labels
    React.createElement('text',{x:P+inner/2,y:P+inner+16,fontSize:7.5,fill:C.ink3,fontFamily:F,textAnchor:'middle',fontWeight:'600'},'LP Score →'),
    React.createElement('text',{x:P-12,y:P+inner/2,fontSize:7.5,fill:C.ink3,fontFamily:F,textAnchor:'middle',fontWeight:'600',transform:'rotate(-90,'+(P-12)+','+(P+inner/2)+')'},'↑ Creative'),

    // Quadrant labels — placed in center of each quadrant
    React.createElement('text',{x:P+inner/4,   y:P+inner/4-4,  textAnchor:'middle',fontSize:6.5,fill:'rgba(196,122,30,.7)',fontFamily:F,fontWeight:'700'},'Fix LP'),
    React.createElement('text',{x:P+inner*3/4, y:P+inner/4-4,  textAnchor:'middle',fontSize:6.5,fill:'rgba(26,107,60,.75)', fontFamily:F,fontWeight:'700'},'Both Strong'),
    React.createElement('text',{x:P+inner/4,   y:P+inner*3/4-4,textAnchor:'middle',fontSize:6.5,fill:'rgba(192,57,43,.7)', fontFamily:F,fontWeight:'700'},'Both Weak'),
    React.createElement('text',{x:P+inner*3/4, y:P+inner*3/4-4,textAnchor:'middle',fontSize:6.5,fill:'rgba(160,82,45,.75)',fontFamily:F,fontWeight:'700'},'Fix Creative'),

    // Score values as sub-labels
    React.createElement('text',{x:P+inner/4,   y:P+inner/4+6,  textAnchor:'middle',fontSize:6,fill:'rgba(196,122,30,.5)',fontFamily:F},'(upgrade LP)'),
    React.createElement('text',{x:P+inner*3/4, y:P+inner/4+6,  textAnchor:'middle',fontSize:6,fill:'rgba(26,107,60,.5)', fontFamily:F},'(scale now)'),
    React.createElement('text',{x:P+inner/4,   y:P+inner*3/4+6,textAnchor:'middle',fontSize:6,fill:'rgba(192,57,43,.5)', fontFamily:F},'(kill / rebuild)'),
    React.createElement('text',{x:P+inner*3/4, y:P+inner*3/4+6,textAnchor:'middle',fontSize:6,fill:'rgba(160,82,45,.5)',fontFamily:F},'(new creative)'),

    // Crosshair lines from dot to axes
    React.createElement('line',{x1:dotX,y1:P+inner,x2:dotX,y2:dotY,stroke:dc,strokeWidth:0.6,strokeDasharray:'2 2',opacity:0.4}),
    React.createElement('line',{x1:P,   y1:dotY,   x2:dotX,y2:dotY,stroke:dc,strokeWidth:0.6,strokeDasharray:'2 2',opacity:0.4}),

    // Dot
    React.createElement('circle',{cx:dotX,cy:dotY,r:11,fill:dc,opacity:0.12}),
    React.createElement('circle',{cx:dotX,cy:dotY,r:5.5,fill:dc,opacity:0.92}),
    React.createElement('circle',{cx:dotX,cy:dotY,r:5.5,fill:'none',stroke:'rgba(255,255,255,.8)',strokeWidth:1.5}),

    // Score labels on axes where dot projects
    React.createElement('text',{x:dotX,y:P+inner+9,textAnchor:'middle',fontSize:6.5,fill:dc,fontFamily:F,fontWeight:'700'},lps.toFixed(1)),
    React.createElement('text',{x:P-5, y:dotY+2,   textAnchor:'end',  fontSize:6.5,fill:dc,fontFamily:F,fontWeight:'700'},cs.toFixed(1))
  );
};

const RoasMini=({roas})=>{
  const pct=Math.min((roas/20)*100,100);
  const color=roas>=2?C.scale:roas>0&&roas<1?C.kill:C.optim;
  return React.createElement('div',{style:{marginTop:4,height:2,background:C.bord,borderRadius:1,overflow:'hidden',width:60}},
    React.createElement('div',{style:{height:'100%',width:pct+'%',background:color,borderRadius:1,transition:'width .6s ease'}}));
};

const PlatBars=({ads})=>{
  const pm=useMemo(()=>{
    const m={};
    ads.forEach(a=>{const p=a.platform||'Unknown';if(!m[p])m[p]={spend:0,rev:0};m[p].spend+=a.spend;m[p].rev+=a.revenue;});
    return Object.entries(m).sort((a,b)=>b[1].spend-a[1].spend).slice(0,5);
  },[ads]);
  const maxS=pm[0]?pm[0][1].spend:1;
  return React.createElement('div',{style:{padding:'20px 40px 24px',borderBottom:'1px solid '+C.bord,background:C.surf}},
    React.createElement('p',{className:'fu',style:{fontSize:10,textTransform:'uppercase',letterSpacing:'.14em',color:C.ink3,fontWeight:700,marginBottom:16}},'Platform Performance'),
    React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:10}},
      pm.map(function([name,d],i){
        const roas=d.spend>0?d.rev/d.spend:0,pct=(d.spend/maxS)*100,col=platC(name);
        return React.createElement('div',{key:name,className:'au',style:{animationDelay:i*50+'ms',display:'flex',alignItems:'center',gap:14}},
          React.createElement('span',{className:'fu',style:{width:74,textAlign:'right',fontSize:12,fontWeight:700,color:C.ink2,flexShrink:0}},name),
          React.createElement('div',{style:{flex:1,height:6,background:C.bord,borderRadius:3,overflow:'hidden'}},
            React.createElement('div',{style:{height:'100%',width:pct+'%',background:col,borderRadius:3,transition:'width .9s cubic-bezier(.22,.68,0,1.2)',transitionDelay:i*60+'ms'}})),
          React.createElement('div',{style:{width:100,flexShrink:0,display:'flex',justifyContent:'space-between',gap:8}},
            React.createElement('span',{className:'fd',style:{fontSize:11,color:C.ink3}},fmt(d.spend)),
            React.createElement('span',{className:'fd',style:{fontSize:12,fontWeight:500,color:roas>=2?C.scale:roas<1?C.kill:C.ink2}},roas.toFixed(1)+'x')));
      })
    )
  );
};

const MCard=({label,value,sub,color,delay,accent,mono})=>{
  delay=delay||0;
  return React.createElement('div',{className:'au hl',style:{animationDelay:delay+'ms',background:C.surf,border:'1px solid '+C.bord,borderRadius:14,padding:'16px 18px',boxShadow:'0 1px 4px rgba(40,25,8,.04)',borderTop:accent?'3px solid '+accent:'1px solid '+C.bord}},
    React.createElement('p',{className:'fu',style:{fontSize:10,textTransform:'uppercase',letterSpacing:'.14em',color:C.ink3,fontWeight:700,marginBottom:8}},label),
    React.createElement('p',{className:mono?'fd':'fh',style:{fontSize:28,fontWeight:mono?500:700,lineHeight:1,color:color||C.ink,fontVariantNumeric:'tabular-nums',letterSpacing:'-.02em'}},value),
    sub&&React.createElement('p',{className:'fu',style:{fontSize:11,color:C.ink3,marginTop:5,fontWeight:400,lineHeight:1.4}},sub)
  );
};

const Intro=({onDismiss})=>React.createElement('div',{className:'au',style:{margin:'28px 40px 0',padding:'28px 32px',background:'linear-gradient(135deg,#FDF8EE 0%,#F5EBD5 100%)',border:'1.5px solid rgba(160,82,45,.22)',borderRadius:16,boxShadow:'0 4px 20px rgba(160,82,45,.1)',position:'relative',overflow:'hidden'}},
  React.createElement('div',{style:{position:'absolute',right:-30,top:-30,width:140,height:140,borderRadius:'50%',background:'rgba(160,82,45,.05)'}}),
  React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:20}},
    React.createElement('div',{style:{flex:1}},
      React.createElement('p',{className:'fu',style:{fontSize:10,textTransform:'uppercase',letterSpacing:'.16em',color:C.upgrade,fontWeight:700,marginBottom:10}},'What is this dashboard?'),
      React.createElement('h2',{className:'fh',style:{fontSize:26,fontWeight:700,color:C.ink,lineHeight:1.3,marginBottom:12}},'Your brand runs hundreds of ads. ',React.createElement('span',{style:{color:C.upgrade,fontStyle:'italic'}},'Not all deserve to keep running.')),
      React.createElement('p',{className:'fu',style:{fontSize:13,color:C.ink2,lineHeight:1.75,maxWidth:680,marginBottom:16}},'This system reads all your active ad campaigns and answers: which ads are ',React.createElement('strong',{style:{color:C.kill,fontWeight:700}},'wasting money'),' and should be stopped, which are ',React.createElement('strong',{style:{color:C.scale,fontWeight:700}},'performing well'),' and deserve more budget, and which are ',React.createElement('strong',{style:{color:C.upgrade,fontWeight:700}},'almost working'),' where one fix could unlock big returns.'),
      React.createElement('div',{style:{display:'flex',gap:16,flexWrap:'wrap'}},
        [{dot:C.kill,text:'Kill: Stop it. Burning money.'},{dot:C.scale,text:'Scale: Double down. It prints money.'},{dot:C.upgrade,text:'Upgrade: Fix one thing, big returns.'},{dot:C.optim,text:'Optimize: Specific technical fix needed.'},{dot:C.watch,text:'Watch: Converting but needs monitoring.'},{dot:C.pause,text:'Pause: Audience is tired of it.'}].map(function(x){
          return React.createElement('div',{key:x.text,style:{display:'flex',alignItems:'center',gap:8}},
            React.createElement('span',{style:{width:8,height:8,borderRadius:'50%',background:x.dot,flexShrink:0,display:'block',boxShadow:'0 0 0 2px '+x.dot+'30'}}),
            React.createElement('span',{className:'fu',style:{fontSize:12,color:C.ink2}},x.text));
        })
      )
    ),
    React.createElement('button',{onClick:onDismiss,className:'hb',style:{background:'rgba(40,25,8,.07)',border:'1px solid '+C.bord,borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,marginTop:2}},
      React.createElement(X,{size:14,color:C.ink2}))
  )
);

const Dashboard=()=>{
  const [perAdCpa,setPerAdCpa]=useState({});
  const [selId,setSelId]=useState(null);
  const [dosTab,setDosTab]=useState('overview');
  const [fAct,setFAct]=useState('all');
  const [fPlat,setFPlat]=useState('all');
  const [search,setSearch]=useState('');
  const [sk,setSk]=useState('spend');
  const [sd,setSd]=useState(-1);
  const [intro,setIntro]=useState(true);

  const p1=useQuery({queryKey:['ads',1],queryFn:()=>fetchPage(1)});
  const nPgs=p1.data&&p1.data.pagination?p1.data.pagination.total_pages:1;
  const rest=useQueries({queries:Array.from({length:Math.max(0,nPgs-1)},function(_,i){return{queryKey:['ads',i+2],queryFn:()=>fetchPage(i+2),enabled:p1.isSuccess&&nPgs>1};})});
  const loaded=1+rest.filter(q=>q.isSuccess).length;
  const fetching=p1.isSuccess&&loaded<nPgs;

  const allRaw=useMemo(()=>{
    const rows=[];
    if(p1.data&&p1.data.data)rows.push(...p1.data.data);
    rest.forEach(q=>{if(q.data&&q.data.data)rows.push(...q.data.data);});
    return rows;
  },[p1.data,rest]);

  const result=useMemo(()=>{
    if(!allRaw.length)return{ads:[],metrics:null,platforms:[]};
    const proc=allRaw.map(raw=>{
      const spend=+raw.spend||0,revenue=+raw.revenue||0,conv=+raw.conversions||0;
      const roas=+raw.roas||0,cpa=(+raw.cpa)||(conv>0?spend/conv:0);
      const adCpa=perAdCpa[raw.ad_id]||null;
      const res=analyze(raw,adCpa);
      return Object.assign({},raw,{spend,revenue,conv,roas,cpa,ctr:+raw.ctr||0,cpc:+raw.cpc||0,
        impressions:+raw.impressions||0,clicks:+raw.clicks||0,days:+raw.days_running||0,
        freq:+raw.frequency||0,cs:+raw.creative_score||0,lps:+raw.landing_page_score||0,
        vcr:raw.video_completion_rate!=null?+raw.video_completion_rate:null,
        action:res.action,signals:res.signals,hasCpa:res.hasCpa,adCpa});
    });
    const by=a=>proc.filter(x=>x.action===a);
    const kills=by('Kill'),ts=proc.reduce((s,a)=>s+a.spend,0);
    const tr=proc.reduce((s,a)=>s+a.revenue,0),w=kills.reduce((s,a)=>s+a.spend,0);
    const pSet=new Set(proc.map(a=>a.platform).filter(Boolean));
    return{ads:proc,metrics:{total:proc.length,totalSpend:ts,totalRev:tr,wasted:w,
      roas:ts>0?tr/ts:0,kills:kills.length,scales:by('Scale').length,
      upgrades:by('Upgrade').length,optims:by('Optimize').length,
      wasteRatio:ts>0?w/ts:0},platforms:Array.from(pSet).sort()};
  },[allRaw,perAdCpa]);

  const ads=result.ads,metrics=result.metrics,platforms=result.platforms;
  // sel is always the live enriched ad object — re-derived whenever ads or selId changes
  const sel=selId?ads.find(a=>a.ad_id===selId)||null:null;

  const displayed=useMemo(()=>{
    let list=[...ads];
    if(fAct!=='all')list=list.filter(a=>a.action===fAct);
    if(fPlat!=='all')list=list.filter(a=>a.platform===fPlat);
    if(search.trim())list=list.filter(a=>(a.brand||a.ad_id||'').toLowerCase().includes(search.toLowerCase().trim()));
    const ORD={Kill:0,Scale:1,Upgrade:2,Optimize:3,Watch:4,Pause:5,Monitor:6};
    list.sort((a,b)=>{if(fAct==='all'){const d=(ORD[a.action]||0)-(ORD[b.action]||0);if(d!==0)return d;}return((b[sk]||0)-(a[sk]||0))*sd;});
    return list;
  },[ads,fAct,fPlat,search,sk,sd]);

  const handleSort=k=>{if(sk===k)setSd(d=>d*-1);else{setSk(k);setSd(-1);}};
  const SC=({k})=>sk===k?(sd===-1?React.createElement(ChevronDown,{size:9,style:{display:'inline',marginLeft:2,opacity:.5}}):React.createElement(ChevronUp,{size:9,style:{display:'inline',marginLeft:2,opacity:.5}})):null;

  const donutData=useMemo(()=>{
    if(!ads.length)return[];
    const cnt={};
    ads.forEach(a=>{cnt[a.action]=(cnt[a.action]||0)+1;});
    return Object.entries(cnt).filter(([,v])=>v>0).map(([k,v])=>({label:k,v,color:ACT[k]?ACT[k].c:C.ink3}));
  },[ads]);

  const h=React.createElement;
  const TH=({l,k})=>h('th',{key:l,onClick:()=>k&&handleSort(k),style:{padding:'10px 16px',textAlign:'left',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.14em',color:C.ink3,cursor:k?'pointer':'default',userSelect:'none',whiteSpace:'nowrap'}},l,h(SC,{k}));

  return h('div',{className:'fu',style:{minHeight:'100vh',background:C.bg,color:C.ink}},
    h(Sty,null),
    fetching&&h('div',{style:{position:'fixed',top:0,left:0,right:0,height:2,zIndex:100}},
      h('div',{style:{height:'100%',background:C.upgrade,width:(loaded/nPgs*100)+'%',transition:'width .4s ease',borderRadius:'0 1px 1px 0',opacity:.8}})),

    /* NAV */
    h('nav',{style:{background:C.surf,borderBottom:'1px solid '+C.bord,padding:'14px 40px',position:'sticky',top:0,zIndex:20,display:'flex',alignItems:'center',gap:14,boxShadow:'0 2px 12px rgba(40,25,8,.06)'}},
      h('div',null,
        h('h1',{className:'fh',style:{fontSize:19,fontWeight:700,color:C.ink,lineHeight:1,letterSpacing:'-.02em'}},'Ad Intelligence'),
        h('span',{className:'fu',style:{fontSize:10,color:C.ink3,marginTop:2,display:'block'}},
          (metrics?metrics.total.toLocaleString():'--')+' ads',
          fetching&&h('span',{style:{color:C.upgrade,marginLeft:6}},loaded+'/'+nPgs+' pages loading...'))),
      h('div',{style:{width:1,height:24,background:C.bord}}),
      h('div',{style:{flex:1,maxWidth:280,position:'relative'}},
        h(Search,{size:13,style:{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:C.ink3}}),
        h('input',{className:'si',value:search,onChange:e=>setSearch(e.target.value),placeholder:'Search brands...',style:{width:'100%',paddingLeft:32,paddingRight:12,height:34,border:'1.5px solid '+C.bord,borderRadius:9,background:'rgba(40,25,8,.03)',fontSize:12,color:C.ink,fontFamily:'Plus Jakarta Sans,system-ui,sans-serif',transition:'all .15s'}}))),

    /* INTRO */
    intro&&h(Intro,{onDismiss:()=>setIntro(false)}),

    /* HERO */
    h('div',{style:{padding:(intro?24:36)+'px 40px 32px',borderBottom:'1px solid '+C.bord}},
      p1.isLoading?h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr) 220px',gap:12}},
        [1,2,3,4].map(i=>h(Sk,{key:i,w:'100%',h:90}))):
      metrics&&h('div',{style:{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}},
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,minmax(130px,1fr))',gap:10,flex:'1 1 400px'}},
          h(MCard,{label:'Capital at risk',value:fmt(metrics.wasted),sub:metrics.kills+' ads to kill · '+(metrics.wasteRatio*100).toFixed(1)+'% of spend',color:C.kill,delay:0,accent:C.kill,mono:true}),
          h(MCard,{label:'Total revenue',value:fmt(metrics.totalRev),sub:metrics.total+' ads total',delay:50,mono:true}),
          h(MCard,{label:'Overall ROAS',value:metrics.roas.toFixed(2)+'x',sub:'revenue / spend',color:metrics.roas>=2?C.scale:metrics.roas<1?C.kill:C.ink,delay:100,accent:metrics.roas>=2?C.scale:null,mono:true}),
          h(MCard,{label:'Scale ready',value:metrics.scales,sub:'increase budget',color:C.scale,delay:150,accent:C.scale}),
          h(MCard,{label:'Upgrade',value:metrics.upgrades,sub:'latent potential',color:C.upgrade,delay:200,accent:C.upgrade}),
          h(MCard,{label:'Optimize',value:metrics.optims,sub:'fix and re-test',color:C.optim,delay:250})),
        h('div',{className:'au hl',style:{animationDelay:'200ms',background:C.surf,border:'1px solid '+C.bord,borderRadius:16,padding:'20px 22px',display:'flex',gap:20,alignItems:'center',flexShrink:0,boxShadow:'0 1px 6px rgba(40,25,8,.04)',cursor:'default'}},
          h('div',{style:{position:'relative',flexShrink:0}},
            h(Donut,{data:donutData,size:120}),
            h('div',{style:{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}},
              h('span',{className:'fh',style:{fontSize:24,fontWeight:700,color:C.ink,lineHeight:1}},metrics.total),
              h('span',{className:'fu',style:{fontSize:9,color:C.ink3,textTransform:'uppercase',letterSpacing:'.1em',marginTop:2}},'ads'))),
          h('div',{style:{display:'flex',flexDirection:'column',gap:4,minWidth:116}},
            donutData.map(d=>h('div',{key:d.label,className:'hb',onClick:()=>setFAct(fAct===d.label?'all':d.label),style:{display:'flex',alignItems:'center',gap:7,padding:'4px 8px',borderRadius:7,background:fAct===d.label?(ACT[d.label]?ACT[d.label].bg:'transparent'):'transparent'}},
              h('span',{style:{width:7,height:7,borderRadius:2,background:d.color,flexShrink:0,display:'block'}}),
              h('span',{className:'fu',style:{fontSize:12,color:fAct===d.label?d.color:C.ink2,fontWeight:fAct===d.label?700:400}},d.label),
              h('span',{className:'fd',style:{marginLeft:'auto',fontSize:11,color:C.ink3}},d.v))))))),

    ads.length>0&&h(PlatBars,{ads}),

    /* FILTERS */
    h('div',{style:{padding:'12px 40px',borderBottom:'1px solid '+C.bord,background:C.surf,display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',position:'sticky',top:54,zIndex:15}},
      ['all','Kill','Scale','Upgrade','Optimize','Watch','Pause','Monitor'].map(f=>{
        const active=fAct===f,cfg=ACT[f],count=f!=='all'?ads.filter(a=>a.action===f).length:ads.length;
        return h('button',{key:f,onClick:()=>setFAct(f),className:'pill fu',style:{padding:'5px 13px',borderRadius:100,fontSize:11,fontWeight:active?700:500,cursor:'pointer',border:'1.5px solid '+(active?(cfg?cfg.c+'66':C.bord2):C.bord),background:active?(cfg?cfg.bg:'rgba(40,25,8,.06)'):'transparent',color:active?(cfg?cfg.c:C.ink):C.ink2}},
          f==='all'?'All':f,h('span',{style:{marginLeft:5,opacity:.45,fontSize:10,fontWeight:400}},count));
      }),
      platforms.length>0&&h('div',{style:{width:1,height:14,background:C.bord,margin:'0 3px'}}),
      platforms.map(p=>{
        const active=fPlat===p,col=platC(p);
        return h('button',{key:p,onClick:()=>setFPlat(active?'all':p),className:'pill fu',style:{padding:'5px 13px',borderRadius:100,fontSize:11,fontWeight:active?700:500,cursor:'pointer',border:'1.5px solid '+(active?col+'66':C.bord),background:active?col+'12':'transparent',color:active?col:C.ink3}},
          h('span',{style:{display:'inline-block',width:5,height:5,borderRadius:'50%',background:col,marginRight:6,verticalAlign:'middle'}}),p);
      }),
      h('span',{className:'fu',style:{marginLeft:'auto',fontSize:11,color:C.ink3}},displayed.length+' shown'+(search?' for "'+search+'"':''))),

    /* TABLE */
    h('div',{style:{overflowX:'auto',background:C.surf}},
      h('table',{style:{width:'100%',borderCollapse:'collapse',minWidth:900}},
        h('thead',null,h('tr',{style:{background:'#EDE6DA',borderBottom:'1.5px solid '+C.bord2}},
          h(TH,{l:'Action',k:null}),h(TH,{l:'Brand / Ad',k:null}),
          h(TH,{l:'Spend',k:'spend'}),h(TH,{l:'Revenue',k:'revenue'}),
          h(TH,{l:'ROAS',k:'roas'}),h(TH,{l:'CPA',k:'cpa'}),
          h(TH,{l:'CTR',k:'ctr'}),h(TH,{l:'Conv.',k:'conv'}),
          h(TH,{l:'Days',k:'days'}),h(TH,{l:'Signals',k:null}))),
        h('tbody',null,
          p1.isLoading?Array.from({length:12}).map((_,i)=>h('tr',{key:i,style:{borderBottom:'1px solid '+C.bord}},
            Array.from({length:10}).map((_,j)=>h('td',{key:j,style:{padding:'14px 16px'}},h(Sk,{w:j===1?120:55,h:12}))))):
          displayed.map((ad,i)=>{
            const cfg=ACT[ad.action]||ACT.Monitor;
            const top=ad.signals[0];
            const nK=ad.signals.filter(s=>s.cat==='kill').length;
            const nS=ad.signals.filter(s=>s.cat==='scale').length;
            const nU=ad.signals.filter(s=>s.cat==='upgrade').length;
            const shown=nK+nS+nU+(top&&!['kill','scale','upgrade'].includes(top.cat)?1:0);
            return h('tr',{key:ad.ad_id||i,onClick:()=>{setSelId(ad.ad_id);setDosTab('overview');},className:'row '+cfg.rc+' au',style:{borderBottom:'1px solid '+C.bord,animationDelay:Math.min(i*12,220)+'ms'}},
              h('td',{style:{padding:'13px 16px'}},
                h('span',{style:{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:100,fontSize:10,fontWeight:700,background:cfg.bg,color:cfg.c,border:'1.5px solid '+cfg.c+'33'}},ad.action)),
              h('td',{style:{padding:'13px 16px'}},
                h('div',{className:'fb',style:{fontSize:15,fontWeight:600,fontStyle:'italic',color:C.ink,lineHeight:1.2}},ad.brand||ad.ad_id),
                h('div',{className:'fu',style:{fontSize:10,color:C.ink3,marginTop:3,display:'flex',alignItems:'center',gap:5,fontWeight:400}},
                  h('span',{style:{display:'inline-block',width:4,height:4,borderRadius:'50%',background:platC(ad.platform)}}),
                  ad.platform+' · '+ad.category+' · '+ad.ad_type)),
              h('td',{style:{padding:'13px 16px'}},
                h('span',{className:'fd',style:{fontSize:12,color:C.ink2,fontVariantNumeric:'tabular-nums'}},fmt(ad.spend)),
                h('div',{style:{marginTop:4,height:2,background:C.bord,borderRadius:1,width:56,overflow:'hidden'}},
                  h('div',{style:{height:'100%',width:Math.min((ad.spend/(metrics?metrics.totalSpend:1||1))*100*20,100)+'%',background:platC(ad.platform),borderRadius:1}}))),
              h('td',{style:{padding:'13px 16px'}},h('span',{className:'fd',style:{fontSize:12,color:C.ink2,opacity:.85,fontVariantNumeric:'tabular-nums'}},fmt(ad.revenue))),
              h('td',{style:{padding:'13px 16px'}},
                h('span',{className:'fh',style:{fontSize:18,fontWeight:700,lineHeight:1,fontVariantNumeric:'tabular-nums',color:ad.roas>=2?C.scale:ad.roas>0&&ad.roas<1?C.kill:C.ink}},ad.roas.toFixed(2)+'x'),
                h(RoasMini,{roas:ad.roas})),
              h('td',{style:{padding:'13px 16px'}},h('span',{className:'fd',style:{fontSize:12,fontVariantNumeric:'tabular-nums',fontWeight:500,color:ad.adCpa?(ad.cpa<=ad.adCpa?C.scale:ad.cpa>ad.adCpa*1.8?C.kill:C.optim):C.ink2}},fmt(ad.cpa))),
              h('td',{style:{padding:'13px 16px'}},h('span',{className:'fd',style:{fontSize:11,color:C.ink3,fontVariantNumeric:'tabular-nums'}},fmtPct(ad.ctr))),
              h('td',{style:{padding:'13px 16px'}},h('span',{className:'fd',style:{fontSize:11,color:C.ink3,fontVariantNumeric:'tabular-nums'}},ad.conv.toLocaleString())),
              h('td',{style:{padding:'13px 16px'}},h('span',{className:'fu',style:{fontSize:11,color:C.ink3}},ad.days+'d')),
              h('td',{style:{padding:'13px 16px'}},
                h('div',{style:{display:'flex',gap:4,flexWrap:'wrap'}},
                  nK>0&&h('span',{className:'fu',style:{fontSize:9,padding:'2px 8px',borderRadius:100,background:'rgba(192,57,43,.1)',color:C.kill,fontWeight:700}},nK+' kill'),
                  nS>0&&h('span',{className:'fu',style:{fontSize:9,padding:'2px 8px',borderRadius:100,background:'rgba(26,107,60,.1)',color:C.scale,fontWeight:700}},nS+' scale'),
                  nU>0&&h('span',{className:'fu',style:{fontSize:9,padding:'2px 8px',borderRadius:100,background:'rgba(160,82,45,.1)',color:C.upgrade,fontWeight:700}},nU+' upgrade'),
                  top&&!['kill','scale','upgrade'].includes(top.cat)&&h('span',{className:'fu',style:{fontSize:9,padding:'2px 8px',borderRadius:100,background:(CAT_C[top.cat]||C.ink3)+'14',color:CAT_C[top.cat]||C.ink3,fontWeight:500}},top.label),
                  ad.signals.length>shown&&h('span',{className:'fu',style:{fontSize:9,color:C.ink3}},' +'+(ad.signals.length-shown)))));
          }),
          !p1.isLoading&&displayed.length===0&&h('tr',null,h('td',{colSpan:10,style:{padding:'72px 40px',textAlign:'center',color:C.ink3,fontSize:14}},search?'No ads found for "'+search+'"':'No ads match the current filter.'))))),

    /* DOSSIER */
    sel&&(()=>{
      const cfg=ACT[sel.action]||ACT.Monitor;
      const Icon=cfg.icon;
      const adCpa=sel.adCpa;
      const setCpa=v=>setPerAdCpa(prev=>Object.assign({},prev,{[sel.ad_id]:v>0?v:null}));
      const ti=(id,label)=>h('button',{key:id,onClick:()=>setDosTab(id),className:'tab fu',style:{padding:'9px 16px',fontSize:12,fontWeight:dosTab===id?700:400,color:dosTab===id?C.ink:C.ink3,borderBottom:'2px solid '+(dosTab===id?C.ink:'transparent')}},label);
      return h('div',{style:{position:'fixed',inset:0,zIndex:50,display:'flex',justifyContent:'flex-end'}},
        h('div',{onClick:()=>setSelId(null),style:{position:'absolute',inset:0,background:'rgba(20,12,4,.32)',backdropFilter:'blur(8px)'}}),
        h('div',{className:'ain fu',style:{position:'relative',width:'100%',maxWidth:490,background:C.surf,borderLeft:'1px solid '+C.bord,height:'100%',overflowY:'auto',display:'flex',flexDirection:'column',boxShadow:'-24px 0 72px rgba(40,25,8,.14)'}},
          h('div',{style:{padding:'24px 28px 0',borderBottom:'1px solid '+C.bord,position:'sticky',top:0,background:C.surf,zIndex:10}},
            h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}},
              h('div',null,
                h('span',{className:'fu',style:{fontSize:9,textTransform:'uppercase',letterSpacing:'.16em',color:C.ink3,display:'block',marginBottom:8,fontWeight:700}},'Intelligence Brief'),
                h('h2',{className:'fb',style:{fontSize:26,fontWeight:600,fontStyle:'italic',color:C.ink,lineHeight:1.2}},sel.brand||sel.ad_id),
                h('p',{className:'fu',style:{fontSize:11,color:C.ink3,marginTop:5,display:'flex',alignItems:'center',gap:6,fontWeight:400}},
                  h('span',{style:{display:'inline-block',width:5,height:5,borderRadius:'50%',background:platC(sel.platform)}}),
                  sel.platform+' · '+sel.ad_type+' · '+sel.category)),
              h('button',{onClick:()=>setSelId(null),className:'hb',style:{background:'rgba(40,25,8,.06)',border:'1.5px solid '+C.bord,borderRadius:'50%',width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,marginTop:2}},h(X,{size:14,color:C.ink2}))),

            /* Per-ad Target CPA input */
            h('div',{style:{marginBottom:14,padding:'12px 14px',borderRadius:10,border:'1.5px solid '+(adCpa?C.upgrade+'66':C.bord),background:adCpa?'rgba(160,82,45,.04)':'rgba(40,25,8,.025)',display:'flex',alignItems:'center',gap:10}},
              h(Target,{size:14,style:{color:adCpa?C.upgrade:C.ink3,flexShrink:0}}),
              h('div',{style:{flex:1}},
                h('p',{className:'fu',style:{fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:adCpa?C.upgrade:C.ink3,fontWeight:700,marginBottom:3}},'Target CPA for this ad'),
                h('p',{className:'fu',style:{fontSize:11,color:C.ink3,fontWeight:400}},adCpa?'CPA-based signals active':'No CPA set — showing ROAS analysis only')),
              h('input',{
                type:'number',min:'1',placeholder:'e.g. 150',
                value:adCpa||'',
                onChange:e=>setCpa(+e.target.value),
                className:'si',
                style:{width:90,height:32,border:'1.5px solid '+(adCpa?C.upgrade+'66':C.bord),borderRadius:8,background:C.surf,fontSize:13,fontFamily:'DM Mono,monospace',fontWeight:500,color:C.ink,textAlign:'right',padding:'0 10px',transition:'all .2s'}
              })),

            /* Verdict */
            h('div',{style:{padding:'10px 14px',borderRadius:10,background:cfg.bg,borderLeft:'3px solid '+cfg.c,marginBottom:14,display:'flex',gap:10,alignItems:'flex-start'}},
              h(Icon,{size:16,style:{color:cfg.c,flexShrink:0,marginTop:1}}),
              h('div',null,
                h('span',{className:'fu',style:{fontSize:10,fontWeight:700,color:cfg.c,textTransform:'uppercase',letterSpacing:'.08em'}},sel.action+(!adCpa?' · ROAS only':'')),
                h('p',{className:'fu',style:{fontSize:12,color:C.ink2,marginTop:2,lineHeight:1.6}},sel.signals[0]?sel.signals[0].desc:'Performance within normal range.'))),
            h('div',{style:{display:'flex',gap:0,borderTop:'1px solid '+C.bord}},
              ti('overview','Overview'),ti('signals','Signals ('+sel.signals.length+')'),ti('details','Details'))),
          h('div',{style:{padding:'22px 28px',flex:1}},
            dosTab==='overview'&&h('div',null,
              h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:20}},
                [{l:'Spend',v:fmt(sel.spend),mono:true},{l:'Revenue',v:fmt(sel.revenue),mono:true},
                 {l:'ROAS',v:sel.roas.toFixed(2)+'x',mono:true,c:sel.roas>=2?C.scale:sel.roas>0&&sel.roas<1?C.kill:C.ink},
                 {l:'CPA',v:fmt(sel.cpa),mono:true,c:adCpa?(sel.cpa<=adCpa?C.scale:sel.cpa>adCpa*1.8?C.kill:C.optim):C.ink2},
                 {l:'CTR',v:fmtPct(sel.ctr),mono:true},{l:'Conv.',v:sel.conv.toLocaleString(),mono:true},
                 {l:'Creative',v:sel.cs.toFixed(1)+'/10',mono:true,c:sel.cs>=7?C.scale:sel.cs<4?C.kill:C.ink},
                 {l:'LP score',v:sel.lps.toFixed(1)+'/10',mono:true,c:sel.lps>=7?C.scale:sel.lps<4?C.kill:C.ink},
                 {l:'Freq.',v:sel.freq.toFixed(1)+'x',mono:true,c:sel.freq>7?C.kill:C.ink}].map(function(x){
                  return h('div',{key:x.l,className:'apop',style:{padding:'10px 12px',border:'1px solid '+C.bord,borderRadius:9,background:'#EDE6DA'}},
                    h('p',{className:'fu',style:{fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:C.ink3,fontWeight:700,marginBottom:5}},x.l),
                    h('p',{className:x.mono?'fd':'fh',style:{fontSize:19,fontWeight:x.mono?500:700,lineHeight:1,color:x.c||C.ink2,fontVariantNumeric:'tabular-nums'}},x.v));
                })),
              h('div',{style:{background:'#EDE6DA',border:'1px solid '+C.bord,borderRadius:12,padding:'16px 18px',display:'flex',gap:16,alignItems:'flex-start'}},
                h('div',null,
                  h('p',{className:'fu',style:{fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:C.ink3,fontWeight:700,marginBottom:10}},'Asset quality map'),
                  h(ScoreMap,{cs:sel.cs,lps:sel.lps,action:sel.action})),
                h('div',{style:{flex:1}},
                  h('p',{className:'fu',style:{fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:C.ink3,fontWeight:700,marginBottom:12}},'Score breakdown'),
                  [{l:'Creative',v:sel.cs,pct:sel.cs*10,c:sel.cs>=7?C.scale:sel.cs<4?C.kill:C.optim},
                   {l:'Landing page',v:sel.lps,pct:sel.lps*10,c:sel.lps>=7?C.scale:sel.lps<4?C.kill:C.optim},
                   ...(sel.vcr!=null?[{l:'Video completion',v:sel.vcr,pct:sel.vcr,label:sel.vcr+'%',c:sel.vcr>60?C.scale:sel.vcr<25?C.kill:C.optim}]:[])].map(function(x){
                    return h('div',{key:x.l,style:{marginBottom:11}},
                      h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:5}},
                        h('span',{className:'fu',style:{fontSize:11,color:C.ink2,fontWeight:600}},x.l),
                        h('span',{className:'fd',style:{fontSize:12,fontWeight:500,color:x.c}},x.label||x.v.toFixed(1)+'/10')),
                      h('div',{style:{height:5,background:C.bord,borderRadius:3,overflow:'hidden'}},
                        h('div',{style:{height:'100%',width:x.pct+'%',background:x.c,borderRadius:3,transition:'width .8s ease'}})));
                  })))),
            dosTab==='signals'&&h('div',null,
              !adCpa&&h('div',{style:{padding:'10px 14px',borderRadius:8,background:'rgba(196,122,30,.07)',border:'1px solid rgba(196,122,30,.25)',marginBottom:12,display:'flex',gap:8,alignItems:'flex-start'}},
                h(Target,{size:13,style:{color:C.optim,flexShrink:0,marginTop:1}}),
                h('p',{className:'fu',style:{fontSize:11,color:C.ink2,lineHeight:1.55}},'Enter a Target CPA above to unlock 8 additional signals — including Budget Drain, Proven Performer, Costly Conversions, and more. Currently showing ROAS-based signals only.')),
              h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
              sel.signals.length===0?h('p',{className:'fb',style:{fontSize:15,color:C.ink3,fontStyle:'italic',padding:'20px 0'}},'No active signals detected.'):
              sel.signals.map(sig=>{
                const col=CAT_C[sig.cat]||C.ink3;
                return h('div',{key:sig.id,style:{padding:'12px 15px',borderRadius:10,background:col+'0E',borderLeft:'3px solid '+col}},
                  h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
                    h('span',{className:'fu',style:{fontSize:11,fontWeight:700,color:col,letterSpacing:'.03em'}},sig.label),
                    h('span',{className:'fu',style:{fontSize:9,color:C.ink3,textTransform:'uppercase',letterSpacing:'.09em',background:col+'18',padding:'2px 8px',borderRadius:100,fontWeight:700}},sig.cat)),
                  h('p',{className:'fu',style:{fontSize:12,color:C.ink2,lineHeight:1.6,fontWeight:400}},sig.desc));
              }))),
            dosTab==='details'&&h('div',null,
              [['Ad ID',sel.ad_id],['Brand',sel.brand],['Platform',sel.platform],['Ad type',sel.ad_type],['Category',sel.category],['Audience',sel.target_audience],['Creative theme',sel.creative_theme],['Status',sel.status],['Start date',sel.start_date],['Days running',sel.days+'d'],['Spend',fmt(sel.spend)],['Revenue',fmt(sel.revenue)],['ROAS',sel.roas.toFixed(2)+'x'],['CPA',fmt(sel.cpa)],['Target CPA',adCpa?fmt(adCpa):'Not set (ROAS only)'],['CTR',fmtPct(sel.ctr)],['CPC',fmt(sel.cpc)],['Conversions',sel.conv.toLocaleString()],['Impressions',(+sel.impressions||0).toLocaleString()],['Clicks',(+sel.clicks||0).toLocaleString()],['Frequency',sel.freq.toFixed(2)+'x'],['Creative score',sel.cs.toFixed(1)+'/10'],['LP score',sel.lps.toFixed(1)+'/10'],['Video compl.',sel.vcr!=null?sel.vcr+'%':'N/A']].map(function([label,value]){
                return h('div',{key:label,style:{display:'flex',justifyContent:'space-between',alignItems:'baseline',padding:'8px 0',borderBottom:'1px solid '+C.bord}},
                  h('span',{className:'fu',style:{fontSize:11,color:C.ink3,fontWeight:600}},label),
                  h('span',{className:'fd',style:{fontSize:12,color:C.ink2}},value||'--'));
              })))));
    })()
  );
};

export default function App(){
  return React.createElement(QueryClientProvider,{client:queryClient},React.createElement(Dashboard,null));
}