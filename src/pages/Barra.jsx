import {
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { barraExposures, cryptoFactors, STRATEGIES, STRAT_COLORS, strategyData } from '../data/mockData'
import { Panel, PanelHeader, KpiCard, ChartTooltip } from '../components/UI'

const FACTOR_NAMES = ['BTC Beta','ETH Beta','Momentum','Carry','Liquidity','Size','Volatility','On-chain']

// Deterministic variance decomposition (no Math.random)
const varDecomp = strategyData.map((s, idx) => {
  const seeds = [0.42, 0.61, 0.78, 0.53, 0.35, 0.67]
  const t = seeds[idx] || 0.5
  const totalVar = s.vol ** 2
  return {
    name: s.name,
    color: s.color,
    totalVol: s.vol,
    Systematic:    +(totalVar * (0.40 + t * 0.12)).toFixed(2),
    Idiosyncratic: +(totalVar * (0.32 + t * 0.08)).toFixed(2),
    Residual:      +(totalVar * (0.18 + t * 0.05)).toFixed(2),
  }
})

// Risk contribution by factor (deterministic)
const riskContrib = cryptoFactors.map((f, i) => ({
  ...f,
  riskContrib: +(Math.abs(f.exposure) * (0.35 + i * 0.04) * 2).toFixed(2),
  marginalContrib: +((i % 3 === 0 ? -1 : 1) * 0.15 * (i + 1) * 0.08).toFixed(3),
}))

const teDecomp = [
  { name: 'BTC Beta',      te: 3.2, color: '#4d90ff' },
  { name: 'Momentum',      te: 2.1, color: '#29cc80' },
  { name: 'Carry',         te: 2.8, color: '#e07040' },
  { name: 'Idiosyncratic', te: 4.5, color: '#7a96b4' },
  { name: 'Residual',      te: 1.1, color: '#8870e0' },
]

export default function Barra() {
  const wgtVol = strategyData.reduce((a, s) => a + s.vol * s.allocation / 100, 0)

  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-[14px] font-semibold tracking-wide text-[#d0e2f5]">Barra Risk Model</h1>
        <div className="text-[10px] text-[#3a5570] mt-0.5 tracking-wide">Multi-Factor Risk Decomposition · Variance Attribution</div>
      </div>

      {/* Risk KPIs */}
      <div className="grid grid-cols-6 gap-2">
        <KpiCard label="Fund Vol" value={`${wgtVol.toFixed(2)}%`} color="#e0a030" sub="Annualized" />
        <KpiCard label="Systematic Risk" value="45.2%" color="#4d90ff" sub="Factor-driven" />
        <KpiCard label="Idio Risk" value="35.8%" color="#29cc80" sub="Alpha" />
        <KpiCard label="Tracking Error" value="13.7%" color="#e85568" sub="vs BTC benchmark" />
        <KpiCard label="Active Share" value="68.4%" color="#8870e0" sub="vs index" />
        <KpiCard label="Factor Count" value={8} color="#c8daf0" sub="Significant" />
      </div>

      {/* Variance decomposition + Risk contribution */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Variance Decomposition by Strategy" subtitle="Systematic vs Idiosyncratic vs Residual" />
          <div className="p-3" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varDecomp} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}`} />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#4a6a8a', fontFamily: 'Inter, sans-serif' }} />
                <Bar dataKey="Systematic"    stackId="a" fill="#4d90ff" opacity={0.8} />
                <Bar dataKey="Idiosyncratic" stackId="a" fill="#29cc80" opacity={0.8} />
                <Bar dataKey="Residual"      stackId="a" fill="#8870e0" opacity={0.8} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Factor Risk Contribution" subtitle="% of total fund risk" accent="#e85568" />
          <div className="p-3" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskContrib} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 72 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(3)} />} />
                <Bar dataKey="riskContrib" radius={[0, 3, 3, 0]} name="Risk Contribution">
                  {riskContrib.map((f, i) => <Cell key={i} fill={f.color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Tracking error + Risk radar */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Tracking Error Decomposition" subtitle="Annualized % vs BTC benchmark" accent="#e07040" />
          <div className="p-3" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teDecomp} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
                <Bar dataKey="te" radius={[3, 3, 0, 0]} name="Tracking Error">
                  {teDecomp.map((f, i) => <Cell key={i} fill={f.color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Risk Radar by Strategy" subtitle="Normalized factor exposures" accent="#8870e0" />
          <div className="p-3" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={FACTOR_NAMES.map(f => {
                const row = { factor: f.split(' ')[0] }
                barraExposures.forEach(s => { row[s.strategy] = Math.abs(s[f] || 0) })
                return row
              })}>
                <PolarGrid stroke="#192840" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: '#4a6a8a', fontSize: 9 }} />
                {STRATEGIES.slice(0, 4).map(s => (
                  <Radar key={s} dataKey={s} stroke={STRAT_COLORS[s]} fill={STRAT_COLORS[s]}
                    fillOpacity={0.06} strokeWidth={1.4} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Full Barra exposure table */}
      <Panel>
        <PanelHeader title="Barra Factor Risk Table" subtitle="Full per-strategy exposures with risk metrics" accent="#4d90ff" />
        <div className="p-3 overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="border-b border-[#192840]">
                <th className="text-left py-2 px-3 text-[9px] text-[#4a6a8a] font-medium tracking-wider uppercase w-28">Strategy</th>
                <th className="text-center py-2 px-2 text-[9px] text-[#4a6a8a] font-medium uppercase">Vol%</th>
                <th className="text-center py-2 px-2 text-[9px] text-[#4a6a8a] font-medium uppercase">Alloc</th>
                {FACTOR_NAMES.map(f => (
                  <th key={f} className="text-center py-2 px-1 text-[9px] text-[#4a6a8a] font-medium uppercase"
                    style={{ fontSize: 8 }}>{f.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {barraExposures.map((row, i) => {
                const sd = strategyData.find(s => s.name === row.strategy)
                return (
                  <tr key={i} className="border-b border-[#0d1828] hover:bg-[#0d1828] transition-colors">
                    <td className="py-1.5 px-3">
                      <span className="font-semibold text-[10px]" style={{ color: STRAT_COLORS[row.strategy] }}>{row.strategy}</span>
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono text-[#e0a030]">{sd?.vol}%</td>
                    <td className="py-1.5 px-2 text-center font-mono text-[#7a96b4]">{sd?.allocation}%</td>
                    {FACTOR_NAMES.map(f => {
                      const val = row[f] || 0
                      const abs = Math.abs(val)
                      const isPos = val >= 0
                      const bg = isPos
                        ? `rgba(77,144,255,${Math.min(0.5, abs * 0.42)})`
                        : `rgba(232,85,104,${Math.min(0.5, abs * 0.42)})`
                      const textColor = abs > 0.4 ? (isPos ? '#4d90ff' : '#e85568') : '#7a96b4'
                      return (
                        <td key={f} className="py-1.5 px-1 text-center">
                          <span className="text-[9px] font-mono font-medium px-1 py-0.5 rounded"
                            style={{ background: bg, color: textColor }}>
                            {val > 0 ? '+' : ''}{val}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

    </div>
  )
}
