import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { macroData, currentMacro, macroSensitivity, STRATEGIES, STRAT_COLORS } from '../data/mockData'
import { Panel, PanelHeader, KpiCard, ChartTooltip } from '../components/UI'

const slice = macroData.filter((_, i) => i % 2 === 0)
const fmtDate = d => d ? d.slice(5) : ''

const MACRO_FACTORS = ['Fed Funds','10Y Yield','VIX','DXY','BTC Price','Funding','Open Int']

export default function Macro() {
  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-[14px] font-semibold tracking-wide text-[#d0e2f5]">Macro Monitor</h1>
        <div className="text-[10px] text-[#3a5570] mt-0.5 tracking-wide">FRED Macro + Crypto-Specific · Strategy Sensitivity</div>
      </div>

      {/* Macro KPIs */}
      <div className="grid grid-cols-8 gap-2">
        <KpiCard label="Fed Funds Rate" value={currentMacro.ffr} suffix="%" color="#e85568" sub="FOMC" />
        <KpiCard label="10Y Treasury" value={currentMacro.t10} suffix="%" color="#e0a030" sub="Yield" />
        <KpiCard label="VIX" value={currentMacro.vix} color="#e85568" sub="Vol Index" />
        <KpiCard label="DXY" value={currentMacro.dxy} color="#4d90ff" sub="Dollar Index" />
        <KpiCard label="BTC Price" value={`$${Number(currentMacro.btcPrice).toLocaleString()}`} color="#e07040" sub="Spot" />
        <KpiCard label="Funding Rate" value={`${(currentMacro.fundingRate * 100).toFixed(3)}%`} color="#29cc80" sub="8h Avg" />
        <KpiCard label="Open Interest" value={`$${currentMacro.openInterest}B`} color="#8870e0" sub="Perps" />
        <KpiCard label="BTC Dom" value={currentMacro.btcDom} suffix="%" color="#4d90ff" sub="Market share" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-3">
        <Panel>
          <PanelHeader title="Fed Funds Rate" subtitle="% · Simulated FRED series" accent="#e85568" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="ffrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e85568" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e85568" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(3)}%`} />} />
                <Area type="monotone" dataKey="ffr" stroke="#e85568" strokeWidth={1.5} fill="url(#ffrGrad)" dot={false} name="Fed Funds" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="VIX Index" subtitle="Implied volatility" accent="#e0a030" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="vixGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e0a030" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e0a030" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={20} stroke="#e8556830" strokeDasharray="3 3"
                  label={{ value: 'STRESS', fill: '#e85568', fontSize: 9 }} />
                <Area type="monotone" dataKey="vix" stroke="#e0a030" strokeWidth={1.5} fill="url(#vixGrad)" dot={false} name="VIX" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="BTC Price" subtitle="Spot $USD" accent="#e07040" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: 2 }}>
                <defs>
                  <linearGradient id="btcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e07040" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#e07040" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip formatter={v => `$${Number(v).toLocaleString()}`} />} />
                <Area type="monotone" dataKey="btcPrice" stroke="#e07040" strokeWidth={1.5} fill="url(#btcGrad)" dot={false} name="BTC" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-3 gap-3">
        <Panel>
          <PanelHeader title="10Y Treasury Yield" subtitle="%" accent="#e0a030" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(3)}%`} />} />
                <Line type="monotone" dataKey="t10" stroke="#e0a030" strokeWidth={1.5} dot={false} name="10Y Yield" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Funding Rate (Perps)" subtitle="8-hour · Annualized equivalent" accent="#29cc80" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="fundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#29cc80" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#29cc80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v*100).toFixed(2)}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${(v*100).toFixed(3)}%`} />} />
                <ReferenceLine y={0} stroke="#243650" />
                <Area type="monotone" dataKey="fundingRate" stroke="#29cc80" strokeWidth={1.5} fill="url(#fundGrad)" dot={false} name="Funding" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="DXY Dollar Index" subtitle="USD strength" accent="#4d90ff" />
          <div className="p-3" style={{ height: 155 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(2)} />} />
                <Line type="monotone" dataKey="dxy" stroke="#4d90ff" strokeWidth={1.5} dot={false} name="DXY" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Macro sensitivity heatmap */}
      <Panel>
        <PanelHeader title="Macro Sensitivity Matrix" subtitle="Strategy beta to macro factors · OLS estimate" accent="#8870e0" />
        <div className="p-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#192840]">
                <th className="text-left py-2 px-3 text-[9px] text-[#4a6a8a] font-medium tracking-wider uppercase w-28">Strategy</th>
                {MACRO_FACTORS.map(f => (
                  <th key={f} className="text-center py-2 px-2 text-[9px] text-[#4a6a8a] font-medium tracking-wider uppercase">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {macroSensitivity.map((row, i) => (
                <tr key={i} className="border-b border-[#0d1828] hover:bg-[#0d1828] transition-colors">
                  <td className="py-2 px-3">
                    <span className="text-[10px] font-semibold" style={{ color: STRAT_COLORS[row.strategy] }}>{row.strategy}</span>
                  </td>
                  {MACRO_FACTORS.map(f => {
                    const val = row[f] || 0
                    const abs = Math.abs(val)
                    const isPos = val >= 0
                    const bg = isPos
                      ? `rgba(77,144,255,${Math.min(0.55, abs * 0.65)})`
                      : `rgba(232,85,104,${Math.min(0.55, abs * 0.65)})`
                    const textColor = abs > 0.4 ? (isPos ? '#4d90ff' : '#e85568') : '#7a96b4'
                    return (
                      <td key={f} className="py-1.5 px-2 text-center">
                        <div className="text-[10px] font-mono font-medium py-1 px-2 rounded text-center"
                          style={{ background: bg, color: textColor }}>
                          {val > 0 ? '+' : ''}{val}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-6 text-[9px] text-[#3a5570]">
            <span><span style={{ color: '#4d90ff' }}>■ Positive</span> — strategy gains when factor rises</span>
            <span><span style={{ color: '#e85568' }}>■ Negative</span> — strategy gains when factor falls</span>
            <span>■ Intensity = magnitude of beta</span>
          </div>
        </div>
      </Panel>

    </div>
  )
}
