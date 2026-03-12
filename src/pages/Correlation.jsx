import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { correlationMatrix, strategyData, STRATEGIES, STRAT_COLORS, navSeries } from '../data/mockData'
import { Panel, PanelHeader, KpiCard, ChartTooltip } from '../components/UI'

const fmtDate = d => d ? d.slice(5) : ''

// Deterministic rolling correlation (no Math.random)
const rollCorr30 = navSeries.map((d, i) => {
  if (i < 30) return { date: d.date, corr: null }
  const t = i / navSeries.length
  const corr = -0.08 + Math.sin(t * Math.PI * 4) * 0.28 + Math.cos(t * Math.PI * 7) * 0.06
  return { date: d.date, corr: +corr.toFixed(3) }
}).filter((_, i) => i % 2 === 0)

const varData = strategyData.map(s => ({
  name: s.name,
  color: s.color,
  var95: +(s.vol / Math.sqrt(252) * 1.645 * 100).toFixed(3),
  var99: +(s.vol / Math.sqrt(252) * 2.326 * 100).toFixed(3),
  cvar95: +(s.vol / Math.sqrt(252) * 2.06 * 100).toFixed(3),
  vol: s.vol,
}))

const fundVar = {
  var95: +(varData.reduce((a, s) => a + s.var95 * strategyData.find(x => x.name === s.name).allocation / 100, 0)).toFixed(3),
  var99: +(varData.reduce((a, s) => a + s.var99 * strategyData.find(x => x.name === s.name).allocation / 100, 0)).toFixed(3),
  cvar95: +(varData.reduce((a, s) => a + s.cvar95 * strategyData.find(x => x.name === s.name).allocation / 100, 0)).toFixed(3),
}

const retDist = (() => {
  const rets = navSeries.map(d => d.dailyRet)
  const min = Math.floor(Math.min(...rets) * 10) / 10
  const max = Math.ceil(Math.max(...rets) * 10) / 10
  const bins = []
  const step = 0.15
  for (let b = min; b <= max; b = +(b + step).toFixed(2)) {
    const count = rets.filter(r => r >= b && r < b + step).length
    bins.push({ bin: b.toFixed(1), count, isNeg: b < 0 })
  }
  return bins
})()

const avgCorr = (correlationMatrix.flat().filter((v, i) => i % 7 !== 0).reduce((a, b) => a + b) / 30).toFixed(3)

export default function Correlation() {
  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-[14px] font-semibold tracking-wide text-[#1e293b]">Correlation & VaR</h1>
        <div className="text-[10px] text-[#64748b] mt-0.5 tracking-wide">Risk Analytics · Value-at-Risk · Return Distribution</div>
      </div>

      {/* VaR KPIs */}
      <div className="grid grid-cols-6 gap-2">
        <KpiCard label="Fund VaR 95%" value={`-${fundVar.var95}%`} color="#e0a030" sub="1-day, parametric" />
        <KpiCard label="Fund VaR 99%" value={`-${fundVar.var99}%`} color="#e85568" sub="1-day, parametric" />
        <KpiCard label="CVaR 95%" value={`-${fundVar.cvar95}%`} color="#e85568" sub="Expected shortfall" />
        <KpiCard label="Avg Corr" value={avgCorr} color="#8870e0" sub="Strategy cross-corr" />
        <KpiCard label="Diversif. Ratio" value="1.42" color="#29cc80" sub="Marginal risk benefit" />
        <KpiCard label="Portfolio Beta" value="0.31" color="#4d90ff" sub="vs BTC" />
      </div>

      {/* Correlation matrix + Return distribution */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Strategy Correlation Matrix" subtitle="Pearson · Full 252-day sample" />
          <div className="p-4">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-1.5 pr-3 text-[9px] text-[#94a3b8] font-normal w-20" />
                  {STRATEGIES.map(s => (
                    <th key={s} className="text-center py-1.5 px-2 text-[9px] font-semibold"
                      style={{ color: STRAT_COLORS[s] }}>{s.slice(0, 7)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((si, i) => (
                  <tr key={si}>
                    <td className="py-0.5 pr-3 text-[9px] font-semibold" style={{ color: STRAT_COLORS[si] }}>{si.slice(0, 7)}</td>
                    {STRATEGIES.map((_, j) => {
                      const val = correlationMatrix[i][j]
                      const isD = i === j
                      const abs = Math.abs(val)
                      const bg = isD ? '#f1f5f9'
                        : val > 0
                          ? `rgba(37,99,235,${Math.min(0.15, abs * 0.2)})`
                          : `rgba(220,38,38,${Math.min(0.15, abs * 0.2)})`
                      const tc = isD ? '#334155' : abs > 0.3 ? (val > 0 ? '#2563eb' : '#dc2626') : '#64748b'
                      return (
                        <td key={j} className="py-1 px-1 text-center">
                          <div className="text-[10px] font-mono font-semibold py-1.5 px-1 rounded text-center"
                            style={{ background: bg, color: tc, minWidth: 44 }}>
                            {val === 1 ? '1.00' : (val > 0 ? '+' : '') + val.toFixed(2)}
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

        <Panel>
          <PanelHeader title="Daily Return Distribution" subtitle="Fund · 252 days" accent="#8870e0" />
          <div className="p-3" style={{ height: 270 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retDist} margin={{ top: 5, right: 8, bottom: 22, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 9 }} tickLine={false} axisLine={false} angle={-45} dy={10}
                  label={{ value: 'Daily Return %', fill: '#94a3b8', fontSize: 10, position: 'insideBottom', offset: -5 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v} days`} />} />
                <ReferenceLine x="0.0" stroke="#e2e8f0" />
                <Bar dataKey="count" name="Frequency" radius={[2, 2, 0, 0]}>
                  {retDist.map((b, i) => <Cell key={i} fill={b.isNeg ? '#e85568' : '#29cc80'} opacity={0.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* VaR by strategy + Rolling correlation */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="VaR by Strategy" subtitle="1-day parametric · 95% and 99% confidence" accent="#e85568" />
          <div className="p-3" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varData} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `-${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `-${v?.toFixed(3)}%`} />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }} />
                <Bar dataKey="var95" name="VaR 95%" fill="#e0a030" opacity={0.8} />
                <Bar dataKey="var99" name="VaR 99%" fill="#e85568" opacity={0.8} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Rolling Correlation" subtitle="StatArb vs TSMOM · 30-day" accent="#4d90ff" />
          <div className="p-3" style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rollCorr30} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} domain={[-1, 1]} />
                <Tooltip content={<ChartTooltip formatter={v => v?.toFixed(3)} />} />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                <ReferenceLine y={0.5}  stroke="#e0a03030" strokeDasharray="3 3" />
                <ReferenceLine y={-0.5} stroke="#e8556830" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="corr" stroke="#4d90ff" strokeWidth={1.5} dot={false} name="Corr(30d)" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* VaR summary table */}
      <Panel>
        <PanelHeader title="Risk Summary Table" subtitle="All strategies · Full VaR attribution" accent="#e0a030" />
        <div className="p-3">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                {['Strategy','Alloc%','Ann Vol%','VaR 95% (1d)','VaR 99% (1d)','CVaR 95%','10d VaR 99%','VaR/$M'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[9px] text-[#94a3b8] font-medium tracking-wider uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {varData.map((row, i) => {
                const s = strategyData[i]
                return (
                  <tr key={i} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    <td className="py-2 px-3 font-semibold" style={{ color: row.color }}>{row.name}</td>
                    <td className="py-2 px-3 font-mono text-[#64748b]">{s.allocation}%</td>
                    <td className="py-2 px-3 font-mono text-[#d97706]">{row.vol}%</td>
                    <td className="py-2 px-3 font-mono text-[#d97706]">-{row.var95}%</td>
                    <td className="py-2 px-3 font-mono text-[#dc2626]">-{row.var99}%</td>
                    <td className="py-2 px-3 font-mono text-[#dc2626]">-{row.cvar95}%</td>
                    <td className="py-2 px-3 font-mono text-[#dc2626]">-{(row.var99 * Math.sqrt(10)).toFixed(3)}%</td>
                    <td className="py-2 px-3 font-mono text-[#64748b]">${(row.var99 / 100 * s.aum * 1e6 / 1e3).toFixed(0)}K</td>
                  </tr>
                )
              })}
              <tr className="border-t border-[#d9770630] bg-[#d9770608]">
                <td className="py-2 px-3 font-semibold text-[#d97706]">FUND</td>
                <td className="py-2 px-3 font-mono text-[#64748b]">100%</td>
                <td className="py-2 px-3 font-mono text-[#d97706]">~11.2%</td>
                <td className="py-2 px-3 font-mono text-[#d97706]">-{fundVar.var95}%</td>
                <td className="py-2 px-3 font-mono text-[#dc2626]">-{fundVar.var99}%</td>
                <td className="py-2 px-3 font-mono text-[#dc2626]">-{fundVar.cvar95}%</td>
                <td className="py-2 px-3 font-mono text-[#dc2626]">-{(fundVar.var99 * Math.sqrt(10)).toFixed(3)}%</td>
                <td className="py-2 px-3 font-mono text-[#64748b]">${(fundVar.var99 / 100 * 247.3 * 1e6 / 1e3).toFixed(0)}K</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

    </div>
  )
}
