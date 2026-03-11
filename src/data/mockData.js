// ─── MOCK DATA LAYER ──────────────────────────────────────────────────────────
// Deterministic seeded PRNG for consistent renders
let _seed = 12345
function sr(mn = 0, mx = 1) {
  _seed = (_seed * 1664525 + 1013904223) & 0xffffffff
  const u = (_seed >>> 0) / 4294967296
  return mn + u * (mx - mn)
}
function srn() { return (sr() + sr() + sr() + sr() - 2) / 2 }

export const STRATEGIES = ['StatArb','TSMOM','XS-Mom','MktMaking','BasisArb','MacroOvl']
export const STRAT_COLORS = {
  StatArb:'#2563eb', TSMOM:'#059669', 'XS-Mom':'#7c3aed',
  MktMaking:'#d97706', BasisArb:'#ea580c', MacroOvl:'#dc2626'
}
const ALLOC = { StatArb:0.22, TSMOM:0.18, 'XS-Mom':0.17, MktMaking:0.20, BasisArb:0.15, MacroOvl:0.08 }
const PARAMS = {
  StatArb:    {sharpe:1.8,vol:0.10},
  TSMOM:      {sharpe:1.3,vol:0.20},
  'XS-Mom':   {sharpe:1.5,vol:0.17},
  MktMaking:  {sharpe:2.2,vol:0.08},
  BasisArb:   {sharpe:2.5,vol:0.06},
  MacroOvl:   {sharpe:0.9,vol:0.22},
}

const DAYS = 252
function makeReturns(sharpe, vol) {
  const dv = vol/Math.sqrt(252), dm = sharpe*vol/252
  return Array.from({length:DAYS},()=>dm+srn()*dv)
}
function cumNav(rets, s=100) {
  let n=s; return rets.map(r=>{n*=(1+r);return +n.toFixed(4)})
}
function dateRange() {
  const d=new Date('2024-01-02'),out=[]
  for(let i=0;i<DAYS;i++){
    out.push(d.toISOString().slice(0,10))
    d.setDate(d.getDate()+1)
    if(d.getDay()===6)d.setDate(d.getDate()+2)
    if(d.getDay()===0)d.setDate(d.getDate()+1)
  }
  return out
}
export const DATES = dateRange()

const stratRets = {}
for(const s of STRATEGIES) stratRets[s]=makeReturns(PARAMS[s].sharpe,PARAMS[s].vol)

const fundRets = DATES.map((_,i)=>STRATEGIES.reduce((acc,s)=>acc+stratRets[s][i]*ALLOC[s],0))
const fundNav  = cumNav(fundRets)

function annRet(rets){return Math.pow(rets.reduce((a,r)=>a*(1+r),1),252/rets.length)-1}
function annVol(rets){const m=rets.reduce((a,b)=>a+b)/rets.length;return Math.sqrt(rets.reduce((a,r)=>a+(r-m)**2,0)/rets.length*252)}
function mdd(nav){let pk=nav[0],d=0;for(const v of nav){if(v>pk)pk=v;const dd=(v-pk)/pk;if(dd<d)d=dd}return d}
function rollSharpe(rets,w=63){return rets.map((_,i)=>{if(i<w)return null;const sl=rets.slice(i-w,i);const m=sl.reduce((a,b)=>a+b)/w;const v=Math.sqrt(sl.reduce((a,b)=>a+(b-m)**2,0)/w);return +(m/v*Math.sqrt(252)).toFixed(3)})}
function rollVol(rets,w=20){return rets.map((_,i)=>{if(i<w)return null;const sl=rets.slice(i-w,i);const m=sl.reduce((a,b)=>a+b)/w;return +(Math.sqrt(sl.reduce((a,b)=>a+(b-m)**2,0)/w)*Math.sqrt(252)*100).toFixed(2)})}

const ar=annRet(fundRets), av=annVol(fundRets)
export const fundKPIs = {
  nav:+fundNav[fundNav.length-1].toFixed(2),
  aum:247.3,
  ytdReturn:+(ar*100).toFixed(2),
  dailyPnL:+(fundRets[fundRets.length-1]*100).toFixed(3),
  sharpe:+(ar/av).toFixed(2),
  sortino:+(ar/(av*0.72)).toFixed(2),
  calmar:+(ar/Math.abs(mdd(fundNav))).toFixed(2),
  maxDD:+(mdd(fundNav)*100).toFixed(2),
  volatility:+(av*100).toFixed(2),
  beta:0.31, ir:1.42, hitRate:54.2,
}

export const navSeries = DATES.map((d,i)=>({
  date:d, nav:fundNav[i],
  dailyRet:+(fundRets[i]*100).toFixed(3),
  rollSharpe:rollSharpe(fundRets)[i],
  rollVol:rollVol(fundRets)[i],
}))

export const strategyData = STRATEGIES.map(s=>{
  const rets=stratRets[s], nav=cumNav(rets), ar2=annRet(rets), av2=annVol(rets)
  return {
    name:s, color:STRAT_COLORS[s],
    allocation:+(ALLOC[s]*100).toFixed(1),
    ytdReturn:+(ar2*100).toFixed(2),
    sharpe:+(ar2/av2).toFixed(2),
    vol:+(av2*100).toFixed(2),
    maxDD:+(mdd(nav)*100).toFixed(2),
    sortino:+(ar2/(av2*0.72)).toFixed(2),
    nav:nav, returns:rets,
    dailyPnL:+(rets[rets.length-1]*100).toFixed(3),
    mtdPnL:+((rets.slice(-22).reduce((a,r)=>a*(1+r),1)-1)*100).toFixed(2),
    ytdPnL:+(ar2*100).toFixed(2),
    aum:+(ALLOC[s]*247.3).toFixed(1),
    beta:+sr(0.1,0.9).toFixed(2),
    ir:+sr(0.8,2.5).toFixed(2),
  }
})

export const navChartData = DATES.map((d,i)=>{
  const row={date:d, Fund:+fundNav[i].toFixed(4)}
  for(const s of STRATEGIES) row[s]=+cumNav(stratRets[s])[i].toFixed(4)
  return row
})

function corrMatrix(){
  return STRATEGIES.map(si=>STRATEGIES.map(sj=>{
    if(si===sj)return 1
    const a=stratRets[si],b=stratRets[sj]
    const ma=a.reduce((x,y)=>x+y)/a.length,mb=b.reduce((x,y)=>x+y)/b.length
    const num=a.reduce((s,v,k)=>s+(v-ma)*(b[k]-mb),0)
    const da=Math.sqrt(a.reduce((s,v)=>s+(v-ma)**2,0))
    const db=Math.sqrt(b.reduce((s,v)=>s+(v-mb)**2,0))
    return +(num/(da*db)).toFixed(3)
  }))
}
export const correlationMatrix = corrMatrix()

export const cryptoFactors = [
  {name:'BTC Beta',      exposure:0.82,  tStat:6.2,  pct:0.241, color:'#2563eb'},
  {name:'ETH Beta',      exposure:0.34,  tStat:3.1,  pct:0.087, color:'#7c3aed'},
  {name:'Momentum',      exposure:0.61,  tStat:4.8,  pct:0.192, color:'#059669'},
  {name:'Carry/Funding', exposure:1.12,  tStat:7.4,  pct:0.315, color:'#ea580c'},
  {name:'Liquidity',     exposure:-0.28, tStat:-2.3, pct:-0.044,color:'#d97706'},
  {name:'Size',          exposure:-0.19, tStat:-1.8, pct:-0.021,color:'#dc2626'},
  {name:'Volatility',    exposure:0.45,  tStat:3.6,  pct:0.108, color:'#64748b'},
  {name:'On-chain Flow', exposure:0.33,  tStat:2.9,  pct:0.076, color:'#0891b2'},
  {name:'Idiosyncratic', exposure:1.00,  tStat:null, pct:0.218, color:'#94a3b8'},
]

export const barraExposures = STRATEGIES.map(s=>({
  strategy:s,
  'BTC Beta': +sr(-0.2,1.5).toFixed(2),
  'ETH Beta': +sr(-0.1,0.8).toFixed(2),
  'Momentum': +sr(-0.5,1.2).toFixed(2),
  'Carry':    +sr(0,1.5).toFixed(2),
  'Liquidity':+sr(-0.6,0.3).toFixed(2),
  'Size':     +sr(-0.4,0.2).toFixed(2),
  'Volatility':+sr(-0.2,0.8).toFixed(2),
  'On-chain': +sr(-0.3,0.7).toFixed(2),
}))

// Rolling macro series
function macroSeries(base,vol,trend){
  let v=base; return Array.from({length:DAYS},()=>{v+=trend+srn()*vol;return +v.toFixed(3)})
}
const ffr  = macroSeries(5.25,0.02,-0.001)
const t10  = macroSeries(4.45,0.05,0.002)
const vix  = macroSeries(18.5,1.2,0.01)
const dxy  = macroSeries(104.2,0.4,-0.005)
const btc  = macroSeries(45000,2000,80).map((v,i)=>Math.max(20000,v))
const funding = macroSeries(0.01,0.008,0.00002)
const oi   = macroSeries(18.2,1.5,0.05)

export const macroData = DATES.map((d,i)=>({
  date:d,ffr:ffr[i],t10:t10[i],vix:vix[i],dxy:dxy[i],
  btcPrice:+btc[i].toFixed(0),fundingRate:funding[i],openInterest:oi[i],
  btcDom:+(52+srn()*1.5).toFixed(1),
}))
export const currentMacro = macroData[macroData.length-1]

export const macroSensitivity = STRATEGIES.map(s=>({
  strategy:s,
  'Fed Funds': +sr(-0.8,0.8).toFixed(2),
  '10Y Yield': +sr(-0.6,0.6).toFixed(2),
  'VIX':       +sr(-1.2,1.2).toFixed(2),
  'DXY':       +sr(-0.5,0.5).toFixed(2),
  'BTC Price': +sr(-0.2,1.8).toFixed(2),
  'Funding':   +sr(0,2.0).toFixed(2),
  'Open Int':  +sr(-0.3,1.2).toFixed(2),
}))

const rollV = rollVol(fundRets)
function regime(v){ if(!v)return'Unknown';if(v<10)return'LowVol';if(v<18)return'Normal';if(v<28)return'Stress';return'Crisis'}
export const regimeSeries = DATES.map((d,i)=>({
  date:d,vol:rollV[i],regime:regime(rollV[i]),ret:+(fundRets[i]*100).toFixed(3)
}))
export const REGIME_COLORS={'LowVol':'#059669','Normal':'#2563eb','Stress':'#d97706','Crisis':'#dc2626','Unknown':'#94a3b8'}

const REGIMES=['LowVol','Normal','Stress','Crisis']
export const regimePerf = REGIMES.map(reg=>{
  const days=regimeSeries.filter(r=>r.regime===reg)
  const row={regime:reg, count:days.length, label:{LowVol:'Low Vol',Normal:'Normal',Stress:'Stress',Crisis:'Crisis'}[reg]}
  for(const s of STRATEGIES){
    const idx=days.map(d=>DATES.indexOf(d.date))
    const rets=idx.map(i=>stratRets[s][i]).filter(v=>v!==undefined)
    row[s]=rets.length>5?+(annRet(rets)*100).toFixed(2):null
  }
  return row
})

export const returnDecomp = {
  totalReturn:fundKPIs.ytdReturn,
  factorReturn:+(fundKPIs.ytdReturn*0.58).toFixed(2),
  idioReturn:+(fundKPIs.ytdReturn*0.42).toFixed(2),
  byFactor:[
    {name:'Carry/Funding',value:3.15,color:'#ea580c'},
    {name:'Idiosyncratic',value:2.18,color:'#94a3b8'},
    {name:'BTC Beta',     value:2.41,color:'#2563eb'},
    {name:'Momentum',     value:1.92,color:'#059669'},
    {name:'Volatility',   value:1.08,color:'#64748b'},
    {name:'ETH Beta',     value:0.87,color:'#7c3aed'},
    {name:'On-chain',     value:0.76,color:'#0891b2'},
    {name:'Liquidity',    value:-0.44,color:'#d97706'},
    {name:'Size',         value:-0.21,color:'#dc2626'},
  ],
  byStrategy:STRATEGIES.map(s=>({
    name:s, color:STRAT_COLORS[s],
    factorPnL:+sr(0.5,4).toFixed(2),
    alphaPnL:+sr(0.2,3).toFixed(2),
  })),
}

export const monthlyReturns = (()=>{
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return [...STRATEGIES,'Fund'].map(s=>{
    const rets=s==='Fund'?fundRets:stratRets[s]
    const row={strategy:s}
    months.forEach((m,mi)=>{
      const sl=rets.slice(mi*21,(mi+1)*21)
      row[m]=sl.length?+((sl.reduce((a,r)=>a*(1+r),1)-1)*100).toFixed(2):null
    })
    row.YTD=+(annRet(rets)*100).toFixed(2)
    return row
  })
})()

export const cryptoMarket=[
  {symbol:'BTC', name:'Bitcoin',  price:67842, chg24h:2.14,  vol24h:28.4,mcap:1332,dom:52.1,funding:0.011},
  {symbol:'ETH', name:'Ethereum', price:3521,  chg24h:1.87,  vol24h:14.2,mcap:423, dom:16.6,funding:0.008},
  {symbol:'SOL', name:'Solana',   price:182,   chg24h:3.42,  vol24h:4.8, mcap:84,  dom:3.3, funding:0.019},
  {symbol:'BNB', name:'BNB',      price:584,   chg24h:-0.34, vol24h:2.1, mcap:85,  dom:3.3, funding:0.006},
  {symbol:'AVAX',name:'Avalanche',price:38.4,  chg24h:-1.22, vol24h:0.8, mcap:16,  dom:0.6, funding:0.014},
  {symbol:'LINK',name:'Chainlink',price:14.2,  chg24h:0.88,  vol24h:0.5, mcap:8,   dom:0.3, funding:0.009},
  {symbol:'ARB', name:'Arbitrum', price:1.24,  chg24h:5.12,  vol24h:0.9, mcap:4,   dom:0.2, funding:0.021},
  {symbol:'MATIC',name:'Polygon', price:0.92,  chg24h:-2.44, vol24h:0.6, mcap:9,   dom:0.4, funding:0.007},
]

// ─── RETAIL PARTICIPATION MODULE ─────────────────────────────────────────────
function retailSeries(base,vol,trend){
  let v=base; return Array.from({length:DAYS},()=>{v=Math.max(0,v+trend+srn()*vol);return +v.toFixed(3)})
}

const retailAddresses = retailSeries(42,3,0.08)
const retailVolPct    = retailSeries(38,2,0.04)
const exchangeNetflow = retailSeries(1.2,0.4,-0.002)
const googleTrends    = retailSeries(55,8,0.05)
const fearGreed       = retailSeries(58,10,0.02)
const smallTxPct      = retailSeries(31,2.5,0.06)
const socialSentiment = retailSeries(62,7,0.03)
const newWallets      = retailSeries(85000,15000,200)
const appDownloads    = retailSeries(420,60,1.5)
const retailFunding   = retailSeries(0.015,0.008,0.00003)

// Composite retail participation index (0-100)
const retailIndex = DATES.map((_,i)=>{
  const raws=[
    retailAddresses[i]/80, retailVolPct[i]/70, googleTrends[i]/100,
    fearGreed[i]/100, smallTxPct[i]/60, socialSentiment[i]/100,
    Math.min(1,newWallets[i]/150000), Math.min(1,appDownloads[i]/700),
  ]
  return +(raws.reduce((a,b)=>a+b)/raws.length*100).toFixed(1)
})

// Alpha decay: higher retail → lower alpha (noise traders vs informed)
const stratAlphaDecay = {}
for(const s of STRATEGIES){
  const sensitivity = {StatArb:-0.6,TSMOM:0.3,'XS-Mom':-0.4,MktMaking:0.5,BasisArb:-0.2,MacroOvl:0.1}[s]||0
  stratAlphaDecay[s] = DATES.map((_,i)=>{
    const ri = retailIndex[i]/100
    const base = PARAMS[s].sharpe
    const decay = base + sensitivity*ri + srn()*0.3
    return +decay.toFixed(3)
  })
}

export const retailData = DATES.map((d,i)=>({
  date:d,
  retailIndex: retailIndex[i],
  activeAddresses: +retailAddresses[i].toFixed(1),
  retailVolPct:    +retailVolPct[i].toFixed(1),
  exchangeNetflow: +exchangeNetflow[i].toFixed(3),
  googleTrends:    +googleTrends[i].toFixed(0),
  fearGreed:       +fearGreed[i].toFixed(0),
  smallTxPct:      +smallTxPct[i].toFixed(1),
  socialSentiment: +socialSentiment[i].toFixed(0),
  newWallets:      +newWallets[i].toFixed(0),
  appDownloads:    +appDownloads[i].toFixed(0),
  retailFunding:   +retailFunding[i].toFixed(4),
  btcPrice:        +btc[i].toFixed(0),
}))

export const retailAlphaImpact = STRATEGIES.map(s=>({
  strategy:s,
  color:STRAT_COLORS[s],
  sensitivity:{StatArb:-0.6,TSMOM:0.3,'XS-Mom':-0.4,MktMaking:0.5,BasisArb:-0.2,MacroOvl:0.1}[s]||0,
  alphaDecay:stratAlphaDecay[s],
  description:{
    StatArb:'Retail noise increases mean-reversion signals but degrades pair stability',
    TSMOM:'Retail momentum chasing can amplify trend signals temporarily',
    'XS-Mom':'Cross-sectional signal quality degrades with retail crowding',
    MktMaking:'Retail flow improves spread capture and inventory management',
    BasisArb:'Retail perp demand drives funding; stable alpha regardless',
    MacroOvl:'Retail sentiment used as contrarian macro signal',
  }[s]||'',
}))

// Retail quartile segmentation for alpha impact analysis
export const retailQuartileImpact = (() => {
  const sorted = [...retailData].sort((a,b)=>a.retailIndex-b.retailIndex)
  const q = Math.floor(sorted.length/4)
  return ['Q1 Low (0-25th)', 'Q2 (25-50th)', 'Q3 (50-75th)', 'Q4 High (75-100th)'].map((label,qi)=>{
    const bucket = sorted.slice(qi*q,(qi+1)*q)
    const bucketDates = new Set(bucket.map(b=>b.date))
    const row = {label, avgRetail:+(bucket.reduce((a,b)=>a+b.retailIndex,0)/bucket.length).toFixed(1)}
    for(const s of STRATEGIES){
      const rets = DATES.map((d,i)=>bucketDates.has(d)?stratRets[s][i]:null).filter(v=>v!==null)
      row[s] = +(annRet(rets)*100).toFixed(2)
    }
    return row
  })
})()

export const retailCorrelations = STRATEGIES.map(s=>({
  strategy:s, color:STRAT_COLORS[s],
  corrWithRetail: +(
    (()=>{
      const ri=retailData.map(r=>r.retailIndex)
      const sr2=stratAlphaDecay[s]
      const mr=ri.reduce((a,b)=>a+b)/ri.length, ms=sr2.reduce((a,b)=>a+b)/sr2.length
      const num=ri.reduce((acc,v,i)=>acc+(v-mr)*(sr2[i]-ms),0)
      const dr=Math.sqrt(ri.reduce((a,v)=>a+(v-mr)**2,0))
      const ds=Math.sqrt(sr2.reduce((a,v)=>a+(v-ms)**2,0))
      return num/(dr*ds)
    })()
  ).toFixed(3),
}))
