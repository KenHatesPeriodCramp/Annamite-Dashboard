import { useState } from 'react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell, ComposedChart
} from 'recharts'
import {
  retailData, retailAlphaImpact, retailQuartileImpact, retailCorrelations,
  STRATEGIES, STRAT_COLORS
} from '../data/mockData'
import { Panel, PanelHeader, KpiCard, ChartTooltip, LiveDot } from '../components/UI'

const fmtDate = d => d ? d.slice(5) : ''
const slice = retailData.filter((_, i) => i % 2 === 0)
const latest = retailData[retailData.length - 1]

function getSentiment(score) {
  if (score < 20) return { label: 'Extreme Fear', color: '#e85568' }
  if (score < 40) return { label: 'Fear',         color: '#e07040' }
  if (score < 60) return { label: 'Neutral',      color: '#e0a030' }
  if (score < 80) return { label: 'Greed',        color: '#7acc9a' }
  return              { label: 'Extreme Greed', color: '#29cc80' }
}

function calcAlphaImpact(retailLevel, strategy) {
  const sensMap    = { StatArb: -0.6, TSMOM: 0.3, 'XS-Mom': -0.4, MktMaking: 0.5, BasisArb: -0.2, MacroOvl: 0.1 }
  const baseSharpe = { StatArb: 1.8,  TSMOM: 1.3, 'XS-Mom': 1.5,  MktMaking: 2.2, BasisArb: 2.5,  MacroOvl: 0.9 }
  return +(baseSharpe[strategy] + sensMap[strategy] * (retailLevel / 100)).toFixed(3)
}

export default function Retail() {
  const [selectedStrat, setSelectedStrat] = useState('StatArb')
  const [retailLevel, setRetailLevel] = useState(Math.round(latest.retailIndex))

  const sentiment = getSentiment(latest.fearGreed)
  const currentAlpha = calcAlphaImpact(retailLevel, selectedStrat)

  const impactCurve = Array.from({ length: 101 }, (_, lvl) => ({
    level: lvl,
    ...Object.fromEntries(STRATEGIES.map(s => [s, calcAlphaImpact(lvl, s)]))
  }))

  const scatterData = retailData.filter((_, i) => i % 3 === 0).map((d, i) => ({
    retail: d.retailIndex,
    alpha: retailAlphaImpact.find(r => r.strategy === selectedStrat)?.alphaDecay[i * 3] || 0,
  }))

  const indicators = [
    { name: 'Active Addresses', value: latest.activeAddresses,              unit: 'M',    max: 80,  color: '#4d90ff' },
    { name: 'Retail Vol Share', value: latest.retailVolPct,                 unit: '%',    max: 70,  color: '#29cc80' },
    { name: 'Google Trends',    value: latest.googleTrends,                 unit: '/100', max: 100, color: '#8870e0' },
    { name: 'Fear & Greed',     value: latest.fearGreed,                    unit: '/100', max: 100, color: '#e0a030' },
    { name: 'Small Tx Share',   value: latest.smallTxPct,                   unit: '%',    max: 60,  color: '#e07040' },
    { name: 'Social Sentiment', value: latest.socialSentiment,              unit: '/100', max: 100, color: '#64748b' },
    { name: 'New Wallets',      value: (latest.newWallets/1000).toFixed(1), unit: 'K/d',  max: 150, color: '#e85568' },
    { name: 'App Downloads',    value: latest.appDownloads,                 unit: '/d',   max: 700, color: '#3abcd4' },
  ]

  return (
    <div className="p-5 space-y-4 animate-slide-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[14px] font-semibold tracking-wide text-[#1e293b]">Retail Participation Monitor</h1>
          <div className="text-[10px] text-[#64748b] mt-0.5 tracking-wide">
            Composite Retail Index · Absolute & Relative Measures · Alpha Impact Assessment
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="text-[10px] text-[#94a3b8]">Simulated · Multi-Signal Composite</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-8 gap-2">
        {/* Retail Index */}
        <div className="col-span-2 bg-white border border-[#e2e8f0] rounded-md p-3 shadow-sm">
          <div className="text-[10px] tracking-[0.06em] uppercase text-[#94a3b8] font-semibold mb-2">Retail Participation Index</div>
          <div className="text-[30px] font-semibold leading-none font-mono text-[#2563eb]">{latest.retailIndex}</div>
          <div className="text-[10px] text-[#64748b] mt-1">Composite · 0–100 scale</div>
          <div className="mt-2.5 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${latest.retailIndex}%`, background: 'linear-gradient(to right, #2563eb, #7c3aed)' }} />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-[#94a3b8]">
            <span>Low</span><span>High</span>
          </div>
        </div>

        {/* Fear & Greed */}
        <div className="col-span-2 bg-white border border-[#e2e8f0] rounded-md p-3 shadow-sm">
          <div className="text-[10px] tracking-[0.06em] uppercase text-[#94a3b8] font-semibold mb-2">Fear & Greed Index</div>
          <div className="text-[30px] font-semibold leading-none font-mono" style={{ color: sentiment.color }}>{latest.fearGreed}</div>
          <div className="text-[11px] font-medium mt-1" style={{ color: sentiment.color }}>{sentiment.label}</div>
          <div className="mt-2.5 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${latest.fearGreed}%`, background: sentiment.color, opacity: 0.85 }} />
          </div>
        </div>

        <KpiCard label="Active Addresses" value={`${latest.activeAddresses}M`}   color="#4d90ff" sub="On-chain · daily" />
        <KpiCard label="Retail Vol Share" value={`${latest.retailVolPct}%`}       color="#29cc80" sub="% of total vol" />
        <KpiCard label="Social Sentiment" value={latest.socialSentiment} suffix="/100" color="#8870e0" sub="Composite" />
        <KpiCard label="New Wallets"      value={`${(latest.newWallets/1000).toFixed(0)}K`} color="#e0a030" sub="Per day" />
      </div>

      {/* Retail index time series + Signal components */}
      <div className="grid grid-cols-3 gap-3">
        <Panel className="col-span-2">
          <PanelHeader title="Retail Participation Index" subtitle="Composite 8-signal model · 252-day history" />
          <div className="p-3" style={{ height: 185 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={slice} margin={{ top: 5, right: 42, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id="retailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d90ff" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#4d90ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="ri" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <YAxis yAxisId="btc" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine yAxisId="ri" y={70} stroke="#e8556828" strokeDasharray="3 3"
                  label={{ value: 'HIGH', fill: '#e85568', fontSize: 9, position: 'right' }} />
                <ReferenceLine yAxisId="ri" y={30} stroke="#29cc8028" strokeDasharray="3 3"
                  label={{ value: 'LOW', fill: '#29cc80', fontSize: 9, position: 'right' }} />
                <Area yAxisId="ri" type="monotone" dataKey="retailIndex" stroke="#4d90ff" strokeWidth={1.5}
                  fill="url(#retailGrad)" dot={false} name="Retail Index" />
                <Line yAxisId="btc" type="monotone" dataKey="btcPrice" stroke="#e0703050" strokeWidth={1}
                  dot={false} name="BTC Price" strokeDasharray="3 2" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Signal Components" subtitle="Current reading vs max" accent="#8870e0" />
          <div className="p-3 space-y-2.5">
            {indicators.map(ind => {
              const pct = Math.min(100, (parseFloat(ind.value) / ind.max) * 100)
              return (
                <div key={ind.name}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] text-[#94a3b8]">{ind.name}</span>
                    <span className="text-[10px] font-mono font-medium" style={{ color: ind.color }}>
                      {ind.value}{ind.unit}
                    </span>
                  </div>
                  <div className="h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ind.color, opacity: 0.8 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* Absolute metric charts */}
      <div className="grid grid-cols-3 gap-3">
        <Panel>
          <PanelHeader title="On-chain Active Addresses" subtitle="Millions · Daily" accent="#4d90ff" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id="addrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d90ff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4d90ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(1)}M`} />} />
                <Area type="monotone" dataKey="activeAddresses" stroke="#4d90ff" strokeWidth={1.5}
                  fill="url(#addrGrad)" dot={false} name="Active Addrs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Retail Volume Share" subtitle="% of total spot+perp volume" accent="#29cc80" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <defs>
                  <linearGradient id="volShareGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#29cc80" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#29cc80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(1)}%`} />} />
                <Area type="monotone" dataKey="retailVolPct" stroke="#29cc80" strokeWidth={1.5}
                  fill="url(#volShareGrad)" dot={false} name="Retail Vol%" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Social Sentiment Index" subtitle="Composite · 0–100" accent="#8870e0" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={50} stroke="#e2e8f0" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="fearGreed"       stroke="#e0a030" strokeWidth={1.5} dot={false} name="Fear/Greed" />
                <Line type="monotone" dataKey="socialSentiment" stroke="#8870e0" strokeWidth={1.5} dot={false} name="Social" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Section divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#e2e8f0]" />
        <span className="text-[9px] tracking-[0.18em] uppercase font-semibold text-[#4d90ff]">Alpha Impact Assessment</span>
        <div className="flex-1 h-px bg-[#e2e8f0]" />
      </div>

      {/* Impact tool */}
      <div className="grid grid-cols-3 gap-3">
        <Panel className="col-span-2">
          <PanelHeader title="Alpha Sensitivity to Retail Participation" subtitle="Sharpe ratio vs retail index level · All strategies" accent="#29cc80" />
          <div className="p-3" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impactCurve} margin={{ top: 5, right: 10, bottom: 18, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis dataKey="level" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                  label={{ value: 'Retail Index Level', fill: '#94a3b8', fontSize: 10, position: 'insideBottom', offset: -5 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                  label={{ value: 'Sharpe', fill: '#94a3b8', fontSize: 10, angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(3)} />} />
                <ReferenceLine x={retailLevel} stroke="#cbd5e125" strokeDasharray="3 3"
                  label={{ value: `Now: ${retailLevel}`, fill: '#334155', fontSize: 9 }} />
                <ReferenceLine y={1} stroke="#29cc8020" strokeDasharray="3 3" />
                {STRATEGIES.map(s => (
                  <Line key={s} type="monotone" dataKey={s} stroke={STRAT_COLORS[s]}
                    strokeWidth={selectedStrat === s ? 2.5 : 1.2}
                    dot={false} name={s} opacity={selectedStrat === s ? 1 : 0.25} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Impact Simulator" subtitle="Adjust retail level · See alpha change" accent="#e07040" />
          <div className="p-4 space-y-4">
            <div>
              <div className="text-[9px] text-[#94a3b8] uppercase tracking-wider mb-2">Select Strategy</div>
              <div className="grid grid-cols-2 gap-1">
                {STRATEGIES.map(s => (
                  <button key={s} onClick={() => setSelectedStrat(s)}
                    className="text-[10px] py-1.5 px-2 rounded text-left font-medium transition-all"
                    style={{
                      background: selectedStrat === s ? STRAT_COLORS[s] + '18' : '#ffffff',
                      color: selectedStrat === s ? STRAT_COLORS[s] : '#64748b',
                      border: `1px solid ${selectedStrat === s ? STRAT_COLORS[s] + '50' : '#e2e8f0'}`,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="text-[9px] text-[#94a3b8] uppercase tracking-wider">Retail Index Level</div>
                <div className="text-[13px] font-semibold font-mono text-[#4d90ff]">{retailLevel}</div>
              </div>
              <input type="range" min={0} max={100} value={retailLevel}
                onChange={e => setRetailLevel(+e.target.value)}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #4d90ff ${retailLevel}%, #e2e8f0 ${retailLevel}%)` }} />
              <div className="flex justify-between text-[9px] text-[#64748b] mt-1">
                <span>Low Retail</span><span>High Retail</span>
              </div>
            </div>

            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-md p-3">
              <div className="text-[9px] text-[#94a3b8] uppercase tracking-wider mb-1.5">Projected Sharpe · {selectedStrat}</div>
              <div className="text-[26px] font-semibold font-mono" style={{
                color: currentAlpha > 1.5 ? '#29cc80' : currentAlpha > 0.8 ? '#e0a030' : '#e85568'
              }}>
                {currentAlpha.toFixed(3)}
              </div>
              <div className="text-[10px] mt-1" style={{
                color: currentAlpha > 1.5 ? '#29cc80' : currentAlpha > 0.8 ? '#e0a030' : '#e85568'
              }}>
                {currentAlpha > 1.5 ? '● Strong alpha regime' : currentAlpha > 0.8 ? '● Moderate alpha' : '● Alpha degradation risk'}
              </div>
              <div className="text-[10px] text-[#64748b] mt-2 leading-relaxed">
                {retailAlphaImpact.find(r => r.strategy === selectedStrat)?.description}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Quartile + Correlation bars */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Strategy Returns by Retail Quartile" subtitle="Annualized % · Conditional on retail index level" accent="#e0a030" />
          <div className="p-3" style={{ height: 205 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retailQuartileImpact} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                {STRATEGIES.map(s => <Bar key={s} dataKey={s} fill={STRAT_COLORS[s]} name={s} opacity={0.85} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Alpha-Retail Correlation by Strategy" subtitle="Pearson corr · Alpha vs Retail Index" accent="#e85568" />
          <div className="p-3" style={{ height: 205 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...retailCorrelations].sort((a, b) => a.corrWithRetail - b.corrWithRetail)}
                layout="vertical"
                margin={{ top: 5, right: 30, bottom: 0, left: 62 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                  domain={[-1, 1]} tickFormatter={v => v.toFixed(1)} />
                <YAxis type="category" dataKey="strategy" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(3)} />} />
                <ReferenceLine x={0} stroke="#e2e8f0" />
                <Bar dataKey="corrWithRetail" name="Corr" radius={[0, 3, 3, 0]}>
                  {[...retailCorrelations].sort((a, b) => a.corrWithRetail - b.corrWithRetail)
                    .map((r, i) => <Cell key={i} fill={r.corrWithRetail >= 0 ? '#29cc80' : '#e85568'} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Scatter + Sensitivity summary */}
      <div className="grid grid-cols-3 gap-3">
        <Panel className="col-span-2">
          <PanelHeader title="Retail Index vs Strategy Alpha" subtitle={`Scatter · ${selectedStrat} · Click strategy above to change`} accent="#4d90ff" />
          <div className="p-3" style={{ height: 185 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 8, bottom: 18, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="retail" name="Retail Index" domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false}
                  label={{ value: 'Retail Index', fill: '#94a3b8', fontSize: 10, position: 'insideBottom', offset: -5 }} />
                <YAxis type="number" dataKey="alpha" name="Alpha (Sharpe)"
                  tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-white border border-[#e2e8f0] rounded-md p-2.5 text-[11px] shadow-lg">
                        <div className="text-[#94a3b8]">Retail: {payload[0]?.payload?.retail?.toFixed(1)}</div>
                        <div className="font-mono" style={{ color: STRAT_COLORS[selectedStrat] }}>
                          Alpha: {payload[0]?.payload?.alpha?.toFixed(3)}
                        </div>
                      </div>
                    )
                  }} />
                <Scatter data={scatterData} fill={STRAT_COLORS[selectedStrat]} opacity={0.5} r={3} name={selectedStrat} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Strategy Sensitivity Summary" subtitle="Retail participation impact direction" accent="#8870e0" />
          <div className="p-4 space-y-2.5">
            {retailAlphaImpact.map(r => {
              const dir = r.sensitivity > 0 ? 'BENEFITS' : 'HARMED'
              const color = r.sensitivity > 0 ? '#29cc80' : '#e85568'
              const mag = Math.abs(r.sensitivity)
              return (
                <div key={r.strategy} className="flex items-center gap-3 py-1 border-b border-[#f1f5f9]">
                  <span className="text-[10px] font-semibold w-20" style={{ color: r.color }}>{r.strategy}</span>
                  <div className="flex-1 bg-[#e2e8f0] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${mag * 50}%`, background: color, opacity: 0.8 }} />
                  </div>
                  <span className="text-[9px] font-semibold w-16 text-right" style={{ color }}>{dir}</span>
                  <span className="text-[9px] font-mono text-[#94a3b8] w-12 text-right">
                    {r.sensitivity > 0 ? '+' : ''}{r.sensitivity.toFixed(1)}β
                  </span>
                </div>
              )
            })}
            <div className="pt-1.5 text-[9px] text-[#64748b] leading-relaxed">
              β = marginal Sharpe change per 100pt retail index move
            </div>
          </div>
        </Panel>
      </div>

      {/* Rolling retail vs rolling sharpe */}
      <Panel>
        <PanelHeader title="Rolling Retail Index vs Fund Sharpe" subtitle="63-day window · Dual axis" accent="#4d90ff" />
        <div className="p-3" style={{ height: 165 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={slice.filter((_, i) => i > 30).map((d, i) => ({
                date: d.date,
                retailIndex: d.retailIndex,
                rollSharpe: +(1.5 + Math.sin(i / 20) * 0.48 + Math.cos(i / 11) * 0.15).toFixed(3),
              }))}
              margin={{ top: 5, right: 42, bottom: 0, left: -14 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="ri" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="sr" orientation="right" domain={[0, 3]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area yAxisId="ri" type="monotone" dataKey="retailIndex" stroke="#4d90ff" strokeWidth={1.5}
                fill="#4d90ff0d" dot={false} name="Retail Index" />
              <Line yAxisId="sr" type="monotone" dataKey="rollSharpe" stroke="#29cc80" strokeWidth={1.8}
                dot={false} name="Fund Sharpe(63d)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

    </div>
  )
}
