import {
  BarChart, Bar, Cell, PieChart, Pie, Tooltip, ResponsiveContainer,
  CartesianGrid, XAxis, YAxis, Legend, ReferenceLine
} from 'recharts'
import { returnDecomp, STRAT_COLORS, STRATEGIES } from '../data/mockData'
import { Panel, PanelHeader, KpiCard, ChartTooltip } from '../components/UI'
import { useState } from 'react'

export default function Returns() {
  const [activeIdx, setActiveIdx] = useState(null)

  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-[14px] font-semibold tracking-wide text-[#d0e2f5]">Return Decomposition</h1>
        <div className="text-[10px] text-[#3a5570] mt-0.5 tracking-wide">Factor vs Idiosyncratic · Alpha Attribution</div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-2">
        <KpiCard label="Total Return" value={returnDecomp.totalReturn} suffix="%" color="#c8daf0" sub="YTD annualized" />
        <KpiCard label="Factor Return" value={returnDecomp.factorReturn} suffix="%" color="#4d90ff"
          sub={`${(returnDecomp.factorReturn / returnDecomp.totalReturn * 100).toFixed(0)}% of total`} />
        <KpiCard label="Alpha (Idio)" value={returnDecomp.idioReturn} suffix="%" color="#29cc80"
          sub={`${(returnDecomp.idioReturn / returnDecomp.totalReturn * 100).toFixed(0)}% of total`} />
        <KpiCard label="Alpha Share" value={(returnDecomp.idioReturn / returnDecomp.totalReturn * 100).toFixed(1)} suffix="%"
          color="#8870e0" sub="Idio share" />
      </div>

      {/* Waterfall + Pie */}
      <div className="grid grid-cols-3 gap-3">
        <Panel className="col-span-2">
          <PanelHeader title="Return Waterfall" subtitle="Factor attribution · YTD contribution %" accent="#4d90ff" />
          <div className="p-3" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnDecomp.byFactor} margin={{ top: 5, right: 8, bottom: 22, left: -8 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#162336" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10 }} tickLine={false} axisLine={false} angle={-25} dy={10} />
                <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
                <ReferenceLine y={0} stroke="#243650" />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} name="Contribution">
                  {returnDecomp.byFactor.map((f, i) => <Cell key={i} fill={f.value >= 0 ? f.color : '#e85568'} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Factor vs Alpha Split" subtitle="Return share" accent="#8870e0" />
          <div className="p-3 flex flex-col items-center" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Factor', value: Math.abs(returnDecomp.factorReturn), color: '#4d90ff' },
                    { name: 'Alpha',  value: Math.abs(returnDecomp.idioReturn),   color: '#29cc80' },
                  ]}
                  cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                  dataKey="value" nameKey="name"
                  onMouseEnter={(_, i) => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  {[{ color: '#4d90ff' }, { color: '#29cc80' }].map((e, i) => (
                    <Cell key={i} fill={e.color} opacity={activeIdx === null || activeIdx === i ? 0.9 : 0.3} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={v => `${v?.toFixed(2)}%`}
                  contentStyle={{ background: '#0a1520', border: '1px solid #253a55', fontSize: 11, fontFamily: 'Inter, sans-serif', borderRadius: 6 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-5 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#4d90ff]" />
                <span className="text-[#4a6a8a]">Factor {returnDecomp.factorReturn}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#29cc80]" />
                <span className="text-[#4a6a8a]">Alpha {returnDecomp.idioReturn}%</span>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Strategy-level alpha vs factor */}
      <Panel>
        <PanelHeader title="Alpha vs Factor PnL by Strategy" subtitle="Stacked contribution %" accent="#e07040" />
        <div className="p-3" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={returnDecomp.byStrategy} margin={{ top: 5, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="#162336" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#7a96b4', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#4a6a8a', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#4a6a8a', fontFamily: 'Inter, sans-serif' }} />
              <Bar dataKey="factorPnL" name="Factor PnL" stackId="a" fill="#4d90ff" opacity={0.75} />
              <Bar dataKey="alphaPnL" name="Alpha PnL" stackId="a" fill="#29cc80" opacity={0.75} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Factor attribution table */}
      <Panel>
        <PanelHeader title="Factor Attribution Table" subtitle="Full breakdown · Sorted by contribution" accent="#4d90ff" />
        <div className="p-3">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#192840]">
                {['Factor', 'Return Contribution', 'Share of Total', 'Direction', 'Risk Budget', 'Running Total'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[9px] text-[#4a6a8a] font-medium tracking-wider uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let running = 0
                return returnDecomp.byFactor.map((f, i) => {
                  running += f.value
                  const share = (f.value / returnDecomp.totalReturn * 100).toFixed(1)
                  return (
                    <tr key={i} className="border-b border-[#0d1828] hover:bg-[#0d1828] transition-colors">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.color }} />
                          <span className="font-medium text-[#c8daf0]">{f.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono font-semibold" style={{ color: f.value >= 0 ? '#29cc80' : '#e85568' }}>
                          {f.value > 0 ? '+' : ''}{f.value.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[#7a96b4]">{share}%</td>
                      <td className="py-2 px-3">
                        <span className="text-[9px] px-2 py-0.5 rounded font-semibold"
                          style={{ background: f.value >= 0 ? '#29cc8018' : '#e8556818', color: f.value >= 0 ? '#29cc80' : '#e85568' }}>
                          {f.value >= 0 ? 'ADDITIVE' : 'DRAG'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#192840] rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.abs(f.value) / 3.2 * 100)}%`, background: f.color, opacity: 0.8 }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono font-semibold" style={{ color: running >= 0 ? '#4d90ff' : '#e85568' }}>
                          {running > 0 ? '+' : ''}{running.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              })()}
              <tr className="border-t border-[#4d90ff30] bg-[#4d90ff08]">
                <td className="py-2 px-3 font-semibold text-[#4d90ff]">TOTAL</td>
                <td className="py-2 px-3 font-mono font-semibold text-[#4d90ff]">+{returnDecomp.totalReturn.toFixed(2)}%</td>
                <td className="py-2 px-3 font-mono text-[#7a96b4]">100.0%</td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

    </div>
  )
}
