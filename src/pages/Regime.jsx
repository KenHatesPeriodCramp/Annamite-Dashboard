import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { regimeSeries, regimePerf, navSeries, STRATEGIES, STRAT_COLORS, REGIME_COLORS } from '../data/mockData'
import { Panel, PanelHeader, ChartTooltip } from '../components/UI'

const fmtDate = d => d ? d.slice(5) : ''
const slice = regimeSeries.filter((_, i) => i % 2 === 0)
const navSlice = navSeries.filter((_, i) => i % 2 === 0)

const REGIME_LABELS = { LowVol: 'Low Vol', Normal: 'Normal', Stress: 'Stress', Crisis: 'Crisis' }
const REGIMES = ['LowVol', 'Normal', 'Stress', 'Crisis']

export default function Regime() {
  const [selected, setSelected] = useState('Normal')

  const dist = REGIMES.map(r => ({
    regime: REGIME_LABELS[r],
    key: r,
    count: regimeSeries.filter(d => d.regime === r).length,
    pct: +(regimeSeries.filter(d => d.regime === r).length / regimeSeries.length * 100).toFixed(1),
    color: REGIME_COLORS[r],
  }))

  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-[14px] font-semibold tracking-wide text-[#1e293b]">Regime Analysis</h1>
        <div className="text-[10px] text-[#64748b] mt-0.5 tracking-wide">Volatility-Based Regime Detection · Strategy Sensitivity</div>
      </div>

      {/* Regime distribution cards */}
      <div className="grid grid-cols-4 gap-3">
        {dist.map(r => (
          <div
            key={r.key}
            className="bg-white border rounded-md p-4 cursor-pointer transition-all duration-150 shadow-sm"
            style={{
              borderColor: selected === r.key ? r.color : '#e2e8f0',
              background: selected === r.key ? `rgba(${r.color === '#29cc80' ? '41,204,128' : r.color === '#4d90ff' ? '77,144,255' : r.color === '#e0a030' ? '224,160,48' : '232,85,104'},0.05)` : 'white',
            }}
            onClick={() => setSelected(r.key)}
          >
            <div className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: r.color }}>{r.regime}</div>
            <div className="text-[26px] font-semibold mt-1.5 font-mono" style={{ color: r.color }}>{r.pct}%</div>
            <div className="text-[10px] text-[#64748b] mt-0.5">{r.count} trading days</div>
            <div className="mt-3 h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, background: r.color, opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Vol regime timeline */}
      <Panel>
        <PanelHeader title="Volatility Regime Timeline" subtitle="20-day rolling ann. vol · Regime classification" />
        <div className="p-3" style={{ height: 185 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={slice} margin={{ top: 5, right: 45, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="volRegGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4d90ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4d90ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
              <ReferenceLine y={10} stroke="#29cc8040" strokeDasharray="3 3"
                label={{ value: 'LOW VOL', fill: '#29cc80', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={18} stroke="#e0a03040" strokeDasharray="3 3"
                label={{ value: 'STRESS', fill: '#e0a030', fontSize: 9, position: 'right' }} />
              <ReferenceLine y={28} stroke="#e8556840" strokeDasharray="3 3"
                label={{ value: 'CRISIS', fill: '#e85568', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="vol" stroke="#4d90ff" strokeWidth={1.5} fill="url(#volRegGrad)"
                dot={false} name="Rolling Vol" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* NAV + Strategy performance by regime */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Fund NAV by Regime" subtitle="Cumulative performance" accent="#e07040" />
          <div className="p-3" style={{ height: 205 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={navSlice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="navRegGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4d90ff" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4d90ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(3)} />} />
                <Area type="monotone" dataKey="nav" stroke="#4d90ff" strokeWidth={1.5} fill="url(#navRegGrad)" dot={false} name="Fund NAV" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Strategy Performance by Regime" subtitle="Annualized return %" accent="#8870e0" />
          <div className="p-3" style={{ height: 205 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regimePerf} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                {STRATEGIES.map(s => (
                  <Bar key={s} dataKey={s} fill={STRAT_COLORS[s]} name={s} opacity={0.85} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Regime performance table */}
      <Panel>
        <PanelHeader title="Strategy Returns by Regime" subtitle="Annualized · All volatility regimes" accent="#4d90ff" />
        <div className="p-3 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="text-left py-2 px-3 text-[9px] text-[#94a3b8] font-medium tracking-wider uppercase w-32">Regime</th>
                <th className="text-center py-2 px-2 text-[9px] text-[#94a3b8] font-medium tracking-wider uppercase">Days</th>
                <th className="text-center py-2 px-2 text-[9px] text-[#94a3b8] font-medium tracking-wider uppercase">%Time</th>
                {STRATEGIES.map(s => (
                  <th key={s} className="text-center py-2 px-2 text-[9px] font-medium tracking-wider uppercase"
                    style={{ color: STRAT_COLORS[s] }}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regimePerf.map((row, i) => {
                const regKey = REGIMES[i]
                return (
                  <tr key={i} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: REGIME_COLORS[regKey] }} />
                        <span className="font-semibold text-[10px]" style={{ color: REGIME_COLORS[regKey] }}>{row.label}</span>
                      </div>
                    </td>
                    <td className="text-center py-2 px-2 font-mono text-[#64748b]">{row.count}</td>
                    <td className="text-center py-2 px-2 font-mono text-[#64748b]">{(row.count / 252 * 100).toFixed(1)}%</td>
                    {STRATEGIES.map(s => {
                      const val = row[s]
                      if (val === null) return <td key={s} className="text-center py-2 px-2 text-[#cbd5e1]">—</td>
                      const color = val > 10 ? '#059669' : val > 0 ? '#2563eb' : val > -10 ? '#d97706' : '#dc2626'
                      const bg = val > 0 ? 'rgba(5,150,105,0.05)' : 'rgba(220,38,38,0.05)'
                      return (
                        <td key={s} className="text-center py-2 px-2 font-mono font-medium"
                          style={{ color, background: bg }}>
                          {val > 0 ? '+' : ''}{val?.toFixed(1)}%
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
