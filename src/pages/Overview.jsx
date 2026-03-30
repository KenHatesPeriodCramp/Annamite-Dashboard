import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { fundKPIs, navSeries, cryptoMarket, STRAT_COLORS, monthlyReturns } from '../data/mockData'
import { Panel, PanelHeader, KpiCard, ChartTooltip, ReturnCell, LiveDot } from '../components/UI'

const fmtDate = d => d ? d.slice(5) : ''
const slice = navSeries.filter((_, i) => i % 2 === 0)

export default function Overview() {
  const topCoins = cryptoMarket.slice(0, 6)

  return (
    <div className="p-5 space-y-4 animate-slide-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[14px] font-semibold tracking-wide text-[#1e293b]">Fund Overview</h1>
          <div className="text-[10px] text-[#64748b] mt-0.5 tracking-wide">
            Annamite Capital · Systematic Crypto · Multi-Strategy
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="text-[10px] text-[#94a3b8]">Mock Data · {new Date().toISOString().slice(0, 10)}</span>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-9 gap-2">
        <KpiCard label="NAV" value={fundKPIs.nav} color="#2563eb" sub="Base 100" />
        <KpiCard label="AUM" value={`$${fundKPIs.aum}M`} color="#475569" sub="Total" />
        <KpiCard label="YTD Return" value={fundKPIs.ytdReturn} suffix="%" color={fundKPIs.ytdReturn > 0 ? '#059669' : '#dc2626'} trend={fundKPIs.ytdReturn} />
        <KpiCard label="Daily P&L" value={fundKPIs.dailyPnL} suffix="%" color={fundKPIs.dailyPnL > 0 ? '#059669' : '#dc2626'} trend={fundKPIs.dailyPnL} />
        <KpiCard label="Sharpe" value={fundKPIs.sharpe} color="#7c3aed" sub="Annualized" />
        <KpiCard label="Sortino" value={fundKPIs.sortino} color="#7c3aed" sub="Annualized" />
        <KpiCard label="Calmar" value={fundKPIs.calmar} color="#ea580c" sub="Ann/MaxDD" />
        <KpiCard label="Max Drawdown" value={fundKPIs.maxDD} suffix="%" color="#dc2626" sub="Peak-to-trough" />
        <KpiCard label="Volatility" value={fundKPIs.volatility} suffix="%" color="#d97706" sub="Annualized" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-5 gap-2">
        <KpiCard label="Market Beta" value={fundKPIs.beta} color="#2563eb" sub="vs BTC" />
        <KpiCard label="Info Ratio" value={fundKPIs.ir} color="#059669" sub="vs Benchmark" />
        <KpiCard label="Hit Rate" value={fundKPIs.hitRate} suffix="%" color="#d97706" sub="Daily win %" />
        <KpiCard label="Active Strategies" value={6} color="#475569" sub="All running" />
        <KpiCard label="Leverage" value="1.8×" color="#ea580c" sub="Gross" />
      </div>

      {/* NAV chart + Daily PnL */}
      <div className="grid grid-cols-3 gap-3">
        <Panel className="col-span-2">
          <PanelHeader title="Fund NAV" subtitle="Cumulative performance · Base 100" right="252 trading days" />
          <div className="p-3" style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e8eef5" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => v.toFixed(3)} />} />
                <ReferenceLine y={100} stroke="#e2e8f0" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="nav" stroke="#2563eb" strokeWidth={1.5} fill="url(#navGrad)" dot={false} name="NAV" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Daily P&L" subtitle="Return distribution · last 60d" />
          <div className="p-3" style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slice.slice(-60)} margin={{ top: 5, right: 8, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#e8eef5" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => `${v.toFixed(3)}%`} />} />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                <Bar dataKey="dailyRet" name="Daily Ret" radius={[1, 1, 0, 0]} isAnimationActive={false}>
                  {slice.slice(-60).map((entry, i) => (
                    <Cell key={i} fill={entry.dailyRet >= 0 ? '#059669' : '#dc2626'} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Rolling metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Panel>
          <PanelHeader title="Rolling Sharpe" subtitle="63-day window" accent="#7c3aed" />
          <div className="p-3" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="sharpeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e8eef5" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={1} stroke="#05966928" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                <Area type="monotone" dataKey="rollSharpe" stroke="#7c3aed" strokeWidth={1.5} fill="url(#sharpeGrad)" dot={false} name="Sharpe(63d)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Rolling Volatility" subtitle="20-day annualized" accent="#d97706" />
          <div className="p-3" style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={slice} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#e8eef5" />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={v => `${v?.toFixed(2)}%`} />} />
                <Area type="monotone" dataKey="rollVol" stroke="#d97706" strokeWidth={1.5} fill="url(#volGrad)" dot={false} name="Vol(20d)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Monthly returns table */}
      <Panel>
        <PanelHeader title="Monthly Returns" subtitle="2024 · All strategies + fund" accent="#ea580c" />
        <div className="p-3 overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="text-left py-2 px-2 text-[#94a3b8] font-medium text-[9px] uppercase tracking-wider w-24">Strategy</th>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','YTD'].map(m => (
                  <th key={m} className="text-center py-2 px-1 text-[#94a3b8] font-medium text-[9px] uppercase tracking-wider">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyReturns.map((row, i) => (
                <tr key={i}
                  className="border-b border-[#f0f4f8] hover:bg-[#f8fafd] transition-colors"
                  style={{
                    borderTop: row.strategy === 'Fund' ? '1px solid #e2e8f0' : undefined,
                    background: row.strategy === 'Fund' ? 'rgba(37,99,235,0.03)' : undefined,
                  }}>
                  <td className="py-1.5 px-2">
                    <span className="font-semibold text-[11px]"
                      style={{ color: row.strategy === 'Fund' ? '#2563eb' : STRAT_COLORS[row.strategy] || '#475569' }}>
                      {row.strategy}
                    </span>
                  </td>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','YTD'].map(m => (
                    <ReturnCell key={m} value={row[m]} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Crypto market ticker */}
      <Panel>
        <PanelHeader
          title="Crypto Market"
          subtitle="Spot prices · Simulated"
          accent="#059669"
          right={<div className="flex items-center gap-1.5"><LiveDot /><span>Live</span></div>}
        />
        <div className="grid grid-cols-6 divide-x divide-[#e2e8f0]">
          {topCoins.map(coin => (
            <div key={coin.symbol} className="p-3 hover:bg-[#f8fafd] transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-[#334155]">{coin.symbol}</span>
                <span className="text-[9px] text-[#94a3b8]">{coin.name}</span>
              </div>
              <div className="text-[15px] font-semibold text-[#1e293b] font-mono">${coin.price.toLocaleString()}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-medium font-mono" style={{ color: coin.chg24h >= 0 ? '#059669' : '#dc2626' }}>
                  {coin.chg24h >= 0 ? '+' : ''}{coin.chg24h}%
                </span>
                <span className="text-[9px] text-[#94a3b8]">24h</span>
              </div>
              <div className="text-[9px] text-[#94a3b8] mt-1">
                Vol ${coin.vol24h}B · MCap ${coin.mcap}B
              </div>
            </div>
          ))}
        </div>
      </Panel>

    </div>
  )
}
