import {
  MANAGERS, MANAGER_STATS, RETURN_SERIES, fmtPct, fmtUSD,
} from '../data/mockData';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { useMemo, useState } from 'react';

const RANGES: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '18M': 455 };

export default function ManagerAnalysis() {
  const [range, setRange]   = useState('6M');
  const [selected, setSelected] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const days = RANGES[range];
    return RETURN_SERIES.slice(-days).map(p => ({ ...p, date: p.date.slice(5) }));
  }, [range]);

  // Underwater plot for selected or portfolio
  const target = selected ?? 'portfolio';
  const underwaterData = useMemo(() => {
    const days = RANGES[range];
    const slice = RETURN_SERIES.slice(-days);
    let peak = 0;
    return slice.map(p => {
      const v = (p as unknown as Record<string, number>)[target];
      if (v > peak) peak = v;
      const dd = peak > 0 ? (v - peak) / (1 + peak) : 0;
      return { date: p.date.slice(5), dd };
    });
  }, [range, target]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">MANAGER ANALYSIS</div>
          <div className="page-subtitle">Performance, drawdowns, hit rate &amp; rolling statistics</div>
        </div>
        <div className="btn-group">
          {Object.keys(RANGES).map(r => (
            <button key={r} className={`btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Manager selector */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)', marginRight: 4 }}>FOCUS:</span>
          <button className={`btn${selected === null ? ' active' : ''}`} onClick={() => setSelected(null)}>PORTFOLIO</button>
          {MANAGERS.map(m => (
            <button key={m.id} className={`btn${selected === m.id ? ' active' : ''}`} onClick={() => setSelected(m.id)}>
              <span className="manager-dot" style={{ background: m.color }} />
              {m.shortName}
            </button>
          ))}
        </div>

        {/* Cumulative returns chart */}
        <div className="panel" style={{ height: 260 }}>
          <div className="panel-hdr">
            <span className="panel-title">CUMULATIVE RETURNS — MANAGER vs BTC / ETH</span>
          </div>
          <div style={{ height: 220, padding: '4px 4px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                <YAxis tickFormatter={(v: number) => fmtPct(v, 0)} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip formatter={(v: unknown, name: unknown) => [fmtPct(Number(v)), String(name)]} contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }} />
                {MANAGERS.map(m => (
                  <Line key={m.id} type="monotone" dataKey={m.id} stroke={m.color}
                    dot={false} strokeWidth={selected === m.id ? 2.5 : 1}
                    opacity={selected === null || selected === m.id ? 1 : 0.25}
                    name={m.shortName} />
                ))}
                <Line type="monotone" dataKey="portfolio" stroke="var(--white)" dot={false} strokeWidth={selected === null ? 2.5 : 1.5} name="PORTFOLIO" />
                <Line type="monotone" dataKey="BTC" stroke="#F7931A" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="BTC" />
                <Line type="monotone" dataKey="ETH" stroke="#627EEA" dot={false} strokeWidth={1.5} strokeDasharray="2 2" name="ETH" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Underwater plot */}
        <div className="panel" style={{ height: 180 }}>
          <div className="panel-hdr">
            <span className="panel-title">UNDERWATER / DRAWDOWN PLOT</span>
            <span className="panel-meta">{selected ? MANAGERS.find(m => m.id === selected)?.shortName : 'PORTFOLIO'}</span>
          </div>
          <div style={{ height: 140, padding: '4px 4px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={underwaterData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} interval={Math.floor(underwaterData.length / 6)} />
                <YAxis tickFormatter={(v: number) => fmtPct(v, 0)} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
                <ReferenceLine y={0} stroke="var(--border-bright)" />
                <Tooltip formatter={(v: unknown) => [fmtPct(Number(v)), 'Drawdown']} contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }} />
                <Line type="monotone" dataKey="dd" stroke="var(--red)" dot={false} strokeWidth={1.5} fill="var(--red)" name="DD" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats table */}
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">PERFORMANCE STATISTICS</span>
            <span className="panel-meta">ALL MANAGERS</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>MANAGER</th>
                  <th>STRATEGY</th>
                  <th className="r">YTD</th>
                  <th className="r">1M</th>
                  <th className="r">TOTAL RETURN</th>
                  <th className="r">SHARPE</th>
                  <th className="r">MAX DD</th>
                  <th className="r">AUM</th>
                </tr>
              </thead>
              <tbody>
                {MANAGERS.map(m => {
                  const s = MANAGER_STATS[m.id];
                  return (
                    <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(m.id === selected ? null : m.id)}>
                      <td>
                        <span className="manager-dot" style={{ background: m.color }} />
                        <span style={{ color: m.id === selected ? m.color : 'var(--text-bright)' }}>{m.name}</span>
                      </td>
                      <td className="dim">{m.strategy}</td>
                      <td className={`r ${s.ytd >= 0 ? 'pos' : 'neg'}`}>{fmtPct(s.ytd)}</td>
                      <td className={`r ${s.m1 >= 0 ? 'pos' : 'neg'}`}>{fmtPct(s.m1)}</td>
                      <td className={`r ${s.totalReturn >= 0 ? 'pos' : 'neg'}`}>{fmtPct(s.totalReturn)}</td>
                      <td className="r" style={{ color: s.sharpe >= 1.5 ? 'var(--green)' : s.sharpe >= 0.8 ? 'var(--yellow)' : 'var(--red)' }}>{s.sharpe.toFixed(2)}</td>
                      <td className="r neg">{fmtPct(s.maxDD)}</td>
                      <td className="r bright">{fmtUSD(m.aum)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Placeholder sub-sections */}
        <div className="placeholder-grid">
          {[
            ['HIT', 'Hit Rate & Win/Loss Magnitude — Win rate, avg win, avg loss, expectancy'],
            ['ROLL', 'Rolling Performance — 7d/15d/30d/45d/60d returns, vol & Sharpe'],
            ['CORR', 'Manager-to-Manager Correlation — Click through to Correlation Matrix page'],
          ].map(([code, desc]) => (
            <div key={code} className="placeholder-panel">
              <div className="panel-hdr"><span className="panel-title">{code}</span></div>
              <div className="placeholder-body">
                <div className="placeholder-code">{code}</div>
                <div className="placeholder-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
