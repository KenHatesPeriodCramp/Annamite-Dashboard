import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { cryptoFactors, barraExposures, STRATEGIES, STRAT_COLORS } from '../data/mockData'
import { Panel, PanelHeader, ChartTooltip } from '../components/UI'

const FACTOR_NAMES = ['BTC Beta','ETH Beta','Momentum','Carry','Liquidity','Size','Volatility','On-chain']

export default function Factors() {
  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-[14px] font-semibold tracking-wide text-[#d0e2f5]">Crypto Factor Exposure</h1>
        <div className="text-[10px] text-[#3a5570] mt-0.5 tracking-wide">Custom Factor Model · 8 Factors · Cross-Sectional</div>
      </div>

      {/* Fund-level factor exposures */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Factor Exposures" subtitle="Fund level · Standardized beta" />
          <div className="p-3" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cryptoFactors} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 72 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(3)} />} />
                <ReferenceLine x={0} stroke="#243650" />
                <Bar dataKey="exposure" radius={[0, 3, 3, 0]} name="Beta">
                  {cryptoFactors.map(f => <Cell key={f.name} fill={f.exposure >= 0 ? '#4d90ff' : '#e85568'} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Return Contribution by Factor" subtitle="YTD attribution · %" accent="#29cc80" />
          <div className="p-3" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cryptoFactors} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 72 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
                <ReferenceLine x={0} stroke="#243650" />
                <Bar dataKey="pct" radius={[0, 3, 3, 0]} name="Contribution %">
                  {cryptoFactors.map(f => <Cell key={f.name} fill={f.pct >= 0 ? '#29cc80' : '#e85568'} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Factor model summary table */}
      <Panel>
        <PanelHeader title="Factor Model Summary" subtitle="Cross-sectional regression · Full sample" accent="#4d90ff" />
        <div className="p-3">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#192840]">
                {['Factor','Exposure (β)','t-Statistic','Significance','Return Contribution','Direction','Risk Budget'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[9px] text-[#4a6a8a] font-medium tracking-wider uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cryptoFactors.map((f, i) => {
                const sig = f.tStat === null ? '—' : Math.abs(f.tStat) > 3 ? '***' : Math.abs(f.tStat) > 2 ? '**' : '*'
                const sigColor = sig === '***' ? '#29cc80' : sig === '**' ? '#e0a030' : '#e85568'
                return (
                  <tr key={i} className="border-b border-[#0d1828] hover:bg-[#0d1828] transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.color }} />
                        <span className="font-medium text-[#c8daf0]">{f.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono font-semibold" style={{ color: f.exposure >= 0 ? '#4d90ff' : '#e85568' }}>
                        {f.exposure > 0 ? '+' : ''}{f.exposure.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[#7a96b4]">
                      {f.tStat !== null ? (f.tStat > 0 ? '+' : '') + f.tStat.toFixed(1) : '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono font-semibold" style={{ color: sigColor }}>{sig}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-mono font-semibold" style={{ color: f.pct >= 0 ? '#29cc80' : '#e85568' }}>
                        {f.pct >= 0 ? '+' : ''}{(f.pct * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[9px] px-2 py-0.5 rounded font-semibold"
                        style={{ background: f.exposure >= 0 ? '#4d90ff18' : '#e8556818', color: f.exposure >= 0 ? '#4d90ff' : '#e85568' }}>
                        {f.exposure >= 0 ? 'LONG' : 'SHORT'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#192840] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{
                            width: `${Math.min(100, Math.abs(f.pct) * 25)}%`,
                            background: f.color, opacity: 0.8
                          }} />
                        </div>
                        <span className="text-[#4a6a8a] text-[9px] w-8 font-mono">{Math.abs(f.pct * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Per-strategy factor heatmap */}
      <Panel>
        <PanelHeader title="Factor Exposure Heatmap" subtitle="Per strategy · Standardized betas" accent="#e07040" />
        <div className="p-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-[9px] text-[#4a6a8a] font-medium tracking-wider uppercase w-28">Strategy</th>
                {FACTOR_NAMES.map(f => (
                  <th key={f} className="text-center py-2 px-2 text-[9px] text-[#4a6a8a] font-medium tracking-wider uppercase">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {barraExposures.map((row, i) => (
                <tr key={i} className="border-b border-[#0d1828]">
                  <td className="py-1.5 px-3">
                    <span className="text-[10px] font-semibold" style={{ color: STRAT_COLORS[row.strategy] }}>{row.strategy}</span>
                  </td>
                  {FACTOR_NAMES.map(f => {
                    const val = row[f] || 0
                    const abs = Math.abs(val)
                    const isPos = val >= 0
                    const bg = isPos
                      ? `rgba(77,144,255,${Math.min(0.55, abs * 0.45)})`
                      : `rgba(232,85,104,${Math.min(0.55, abs * 0.45)})`
                    const textColor = abs > 0.5 ? (isPos ? '#4d90ff' : '#e85568') : '#7a96b4'
                    return (
                      <td key={f} className="py-1.5 px-2 text-center">
                        <div className="text-[10px] font-mono font-medium py-1 px-2 rounded"
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
        </div>
      </Panel>

    </div>
  )
}
