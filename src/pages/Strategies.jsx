import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { strategyData, STRATEGIES, STRAT_COLORS, navChartData, correlationMatrix } from '../data/mockData'
import { Panel, PanelHeader, ChartTooltip, HeatCell } from '../components/UI'

const fmtDate = d => d ? d.slice(5) : ''
const slice = navChartData.filter((_, i) => i % 2 === 0)

const radarData = [
  { metric: 'Sharpe' },
  { metric: 'Return' },
  { metric: 'Vol(inv)' },
  { metric: 'Hit Rate' },
  { metric: 'Calmar' },
]
const radarFull = radarData.map(r => {
  const row = { ...r }
  strategyData.forEach(s => {
    if (r.metric === 'Sharpe') row[s.name] = Math.min(100, s.sharpe / 3 * 100)
    else if (r.metric === 'Return') row[s.name] = Math.min(100, Math.max(0, s.ytdReturn / 60 * 100))
    else if (r.metric === 'Vol(inv)') row[s.name] = Math.max(0, 100 - s.vol / 30 * 100)
    else if (r.metric === 'Hit Rate') row[s.name] = 55 + (s.sharpe * 3)
    else if (r.metric === 'Calmar') row[s.name] = Math.min(100, Math.abs(s.ytdReturn / s.maxDD) / 5 * 100)
  })
  return row
})

export default function Strategies() {
  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-[14px] font-semibold tracking-wide text-[#d0e2f5]">Strategy Breakdown</h1>
        <div className="text-[10px] text-[#3a5570] mt-0.5 tracking-wide">Per-strategy metrics · Allocation · Performance</div>
      </div>

      {/* Strategy KPI Cards */}
      <div className="grid grid-cols-6 gap-2">
        {strategyData.map(s => (
          <Panel key={s.name}>
            <div className="p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold" style={{ color: s.color }}>{s.name}</span>
                <span className="text-[10px] text-[#3a5570] font-mono">{s.allocation}%</span>
              </div>
              <div className="text-[10px] text-[#3a5570]">AUM: <span className="font-mono text-[#6a8caa]">${s.aum}M</span></div>
              <div className="space-y-1.5 pt-2 border-t border-[#192840]">
                {[
                  ['YTD', `${s.ytdReturn > 0 ? '+' : ''}${s.ytdReturn}%`, s.ytdReturn > 0 ? '#29cc80' : '#e85568'],
                  ['Sharpe', s.sharpe, '#8870e0'],
                  ['Vol', `${s.vol}%`, '#e0a030'],
                  ['MaxDD', `${s.maxDD}%`, '#e85568'],
                  ['Sortino', s.sortino, '#4d90ff'],
                ].map(([l, v, c]) => (
                  <div key={l} className="flex justify-between items-center">
                    <span className="text-[9px] text-[#3a5570] uppercase tracking-wide">{l}</span>
                    <span className="text-[10px] font-mono font-medium" style={{ color: c }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-[#192840]" />
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#3a5570] uppercase tracking-wide">Daily</span>
                <span className="text-[11px] font-mono font-semibold" style={{ color: s.dailyPnL >= 0 ? '#29cc80' : '#e85568' }}>
                  {s.dailyPnL >= 0 ? '+' : ''}{s.dailyPnL}%
                </span>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* NAV comparison + allocation bar */}
      <div className="grid grid-cols-3 gap-3">
        <Panel className="col-span-2">
          <PanelHeader title="Strategy NAV Comparison" subtitle="Cumulative performance · Base 100" />
          <div className="p-3" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(3)} />} />
                <Line dataKey="Fund" stroke="#c8daf0" strokeWidth={2} dot={false} name="Fund" strokeDasharray="5 2" opacity={0.7} />
                {STRATEGIES.map(s => (
                  <Line key={s} dataKey={s} stroke={STRAT_COLORS[s]} strokeWidth={1.2} dot={false} name={s} opacity={0.85} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Capital Allocation" subtitle="% of AUM" accent="#e07040" />
          <div className="p-3" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} layout="vertical" margin={{ top: 5, right: 30, bottom: 0, left: 42 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10, fontWeight: 500 }}
                  tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
                <Bar dataKey="allocation" radius={[0, 3, 3, 0]} name="Allocation">
                  {strategyData.map(s => <Cell key={s.name} fill={s.color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Radar + Correlation */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Strategy Scorecard" subtitle="Normalized risk-adjusted metrics" accent="#8870e0" />
          <div className="p-3" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarFull}>
                <PolarGrid stroke="#192840" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#4a6a8a', fontSize: 10 }} />
                {STRATEGIES.map(s => (
                  <Radar key={s} dataKey={s} stroke={STRAT_COLORS[s]} fill={STRAT_COLORS[s]}
                    fillOpacity={0.06} strokeWidth={1.5} dot={false} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Inter-Strategy Correlation" subtitle="Pearson · Full sample" accent="#4d90ff" />
          <div className="p-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-1.5 pr-2 text-[9px] text-[#4a6a8a] font-normal w-16" />
                  {STRATEGIES.map(s => (
                    <th key={s} className="text-center py-1.5 px-1 text-[9px] font-semibold"
                      style={{ color: STRAT_COLORS[s] }}>{s.slice(0, 7)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((si, i) => (
                  <tr key={si}>
                    <td className="text-[9px] font-semibold py-0.5 pr-2" style={{ color: STRAT_COLORS[si] }}>{si.slice(0, 7)}</td>
                    {STRATEGIES.map((_, j) => (
                      <HeatCell key={j} value={correlationMatrix[i][j]} min={-1} max={1} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Sharpe + Vol bars */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Sharpe Ratio by Strategy" subtitle="Annualized" accent="#8870e0" />
          <div className="p-3" style={{ height: 165 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="sharpe" radius={[3, 3, 0, 0]} name="Sharpe">
                  {strategyData.map(s => <Cell key={s.name} fill={s.color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Annualized Volatility by Strategy" subtitle="%" accent="#e0a030" />
          <div className="p-3" style={{ height: 165 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyData} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
                <Bar dataKey="vol" radius={[3, 3, 0, 0]} name="Vol %">
                  {strategyData.map(s => <Cell key={s.name} fill={s.color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

    </div>
  )
}
