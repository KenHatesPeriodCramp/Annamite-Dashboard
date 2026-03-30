import {
  MANAGERS, MANAGER_STATS, MANAGER_TRADE_STATS, RETURN_SERIES,
  getCorrelationMatrix, fmtPct, fmtUSD,
} from '../data/mockData';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { useMemo, useState } from 'react';

const RANGES: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '18M': 455 };
const WINDOW = 30;

const TT = {
  background: 'var(--bg-panel-hdr)',
  border: '1px solid var(--border-bright)',
  color: 'var(--text)',
  fontFamily: 'var(--font)',
  fontSize: 11,
};

function corrColor(v: number): string {
  if (v >= 0.7) return '#0b3b25';
  if (v >= 0.4) return '#17522f';
  if (v >= 0.1) return '#1c6938';
  if (v >= -0.1) return '#0f2233';
  if (v >= -0.4) return '#4d1c1c';
  return '#6e2523';
}

type SortKey = 'ytd' | 'm1' | 'totalReturn' | 'sharpe' | 'sortino' | 'calmar' | 'maxDD' | 'aum';

export default function ManagerAnalysis() {
  const [range, setRange]     = useState('6M');
  const [selected, setSelected] = useState<string | null>(null);
  const [bench, setBench]     = useState<'BTC' | 'ETH'>('BTC');
  const [sortKey, setSortKey] = useState<SortKey>('ytd');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const days = RANGES[range];

  const chartData = useMemo(() =>
    RETURN_SERIES.slice(-days).map(p => ({ ...p, date: p.date.slice(5) })),
  [days]);

  const target = selected ?? 'portfolio';
  const underwaterData = useMemo(() => {
    let peak = 0;
    return RETURN_SERIES.slice(-days).map(p => {
      const v = (p as unknown as Record<string, number>)[target];
      if (v > peak) peak = v;
      const dd = peak > 0 ? (v - peak) / (1 + peak) : 0;
      return { date: p.date.slice(5), dd };
    });
  }, [days, target]);

  // Daily returns for the selected range — used by rolling Sharpe & beta/alpha
  const dailyRets = useMemo(() => {
    const slice = RETURN_SERIES.slice(-days);
    const ids = [...MANAGERS.map(m => m.id), 'BTC', 'ETH'];
    const out: Record<string, number[]> = {};
    for (const id of ids) {
      out[id] = slice.slice(1).map((p, i) => {
        const prev = ((slice[i] as unknown as Record<string, number>)[id]) + 1;
        const curr = ((p as unknown as Record<string, number>)[id]) + 1;
        return curr / prev - 1;
      });
    }
    return out;
  }, [days]);

  // Rolling 30d Sharpe — all managers
  const rollSharpData = useMemo(() => {
    const slice = RETURN_SERIES.slice(-days);
    if (days <= WINDOW) return [];
    return slice.slice(1 + WINDOW).map((p, idx) => {
      const j = idx + WINDOW;
      const row: Record<string, string | number> = { date: p.date.slice(5) };
      for (const m of MANAGERS) {
        const rets = dailyRets[m.id].slice(j - WINDOW, j);
        const mean = rets.reduce((s, v) => s + v, 0) / WINDOW;
        const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / WINDOW;
        row[m.id] = variance > 0 ? +(mean / Math.sqrt(variance) * Math.sqrt(252)).toFixed(2) : 0;
      }
      return row;
    });
  }, [days, dailyRets]);

  // Rolling 30d beta & alpha vs selected benchmark
  const betaAlphaData = useMemo(() => {
    const slice = RETURN_SERIES.slice(-days);
    if (days <= WINDOW) return [];
    const br = dailyRets[bench] ?? [];
    return slice.slice(1 + WINDOW).map((p, idx) => {
      const j = idx + WINDOW;
      const bslice = br.slice(j - WINDOW, j);
      const bm = bslice.reduce((s, v) => s + v, 0) / WINDOW;
      const row: Record<string, string | number> = { date: p.date.slice(5) };
      for (const m of MANAGERS) {
        const mslice = dailyRets[m.id].slice(j - WINDOW, j);
        const mm = mslice.reduce((s, v) => s + v, 0) / WINDOW;
        let cov = 0, varB = 0;
        for (let k = 0; k < WINDOW; k++) {
          cov  += (mslice[k] - mm) * (bslice[k] - bm);
          varB += (bslice[k] - bm) ** 2;
        }
        const beta = varB > 0 ? cov / varB : 0;
        const dailyAlpha = mm - beta * bm;
        row[`beta_${m.id}`]  = +beta.toFixed(2);
        row[`alpha_${m.id}`] = +(dailyAlpha * 252 * 100).toFixed(2); // annualised %
      }
      return row;
    });
  }, [days, bench, dailyRets]);

  // Sorted manager list
  const sortedManagers = useMemo(() => [...MANAGERS].sort((a, b) => {
    const va = sortKey === 'aum' ? a.aum : (MANAGER_STATS[a.id] as unknown as Record<string, number>)[sortKey];
    const vb = sortKey === 'aum' ? b.aum : (MANAGER_STATS[b.id] as unknown as Record<string, number>)[sortKey];
    return sortDir === 'desc' ? vb - va : va - vb;
  }), [sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const si = (key: SortKey) => sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  const corrMatrix = useMemo(() => getCorrelationMatrix(90), []);

  const hitData = MANAGERS.map(m => {
    const ts = MANAGER_TRADE_STATS[m.id];
    return {
      winRate: +(ts.winRate * 100).toFixed(1),
      payoffRatio: ts.payoffRatio,
      name: m.shortName,
      color: m.color,
      expectancy: ts.expectancy,
      profitFactor: ts.profitFactor,
      totalTrades: ts.totalTrades,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">MANAGER ANALYSIS</div>
          <div className="page-subtitle">Performance · Drawdowns · Rolling β/α · Hit Rate · Correlation</div>
        </div>
        <div className="btn-group">
          {Object.keys(RANGES).map(r => (
            <button key={r} className={`btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Focus selector */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)', marginRight: 4 }}>FOCUS:</span>
          <button className={`btn${selected === null ? ' active' : ''}`} onClick={() => setSelected(null)}>PORTFOLIO</button>
          {MANAGERS.map(m => (
            <button key={m.id} className={`btn${selected === m.id ? ' active' : ''}`}
              onClick={() => setSelected(m.id === selected ? null : m.id)}>
              <span className="manager-dot" style={{ background: m.color }} />
              {m.shortName}
            </button>
          ))}
        </div>

        {/* Cumulative Returns */}
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
                <Tooltip formatter={(v: unknown, name: unknown) => [fmtPct(Number(v)), String(name)]} contentStyle={TT} />
                {MANAGERS.map(m => (
                  <Line key={m.id} type="monotone" dataKey={m.id} stroke={m.color}
                    dot={false} strokeWidth={selected === m.id ? 2.5 : 1}
                    opacity={selected === null || selected === m.id ? 1 : 0.18}
                    name={m.shortName} />
                ))}
                <Line type="monotone" dataKey="portfolio" stroke="var(--white)" dot={false} strokeWidth={selected === null ? 2.5 : 1.5} name="PORTFOLIO" />
                <Line type="monotone" dataKey="BTC" stroke="#F7931A" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="BTC" />
                <Line type="monotone" dataKey="ETH" stroke="#627EEA" dot={false} strokeWidth={1.5} strokeDasharray="2 2" name="ETH" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Underwater + Rolling Sharpe side-by-side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="panel" style={{ height: 200 }}>
            <div className="panel-hdr">
              <span className="panel-title">DRAWDOWN / UNDERWATER</span>
              <span className="panel-meta">{selected ? MANAGERS.find(m => m.id === selected)?.shortName : 'PORTFOLIO'}</span>
            </div>
            <div style={{ height: 160, padding: '4px 4px 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={underwaterData} margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} interval={Math.floor(underwaterData.length / 5)} />
                  <YAxis tickFormatter={(v: number) => fmtPct(v, 0)} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} axisLine={false} width={44} />
                  <ReferenceLine y={0} stroke="var(--border-bright)" />
                  <Tooltip formatter={(v: unknown) => [fmtPct(Number(v)), 'Drawdown']} contentStyle={TT} />
                  <Line type="monotone" dataKey="dd" stroke="var(--red)" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel" style={{ height: 200 }}>
            <div className="panel-hdr">
              <span className="panel-title">ROLLING 30D SHARPE — ALL MANAGERS</span>
            </div>
            <div style={{ height: 160, padding: '4px 4px 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rollSharpData} margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} interval={Math.floor(rollSharpData.length / 5)} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} axisLine={false} width={32} />
                  <ReferenceLine y={0} stroke="var(--border-bright)" />
                  <ReferenceLine y={1} stroke="var(--green)" strokeDasharray="3 3" strokeOpacity={0.45} label={{ value: '1.0', fill: 'var(--green)', fontSize: 8, position: 'insideTopRight' }} />
                  <Tooltip formatter={(v: unknown, name: unknown) => [Number(v).toFixed(2), String(name)]} contentStyle={TT} />
                  {MANAGERS.map(m => (
                    <Line key={m.id} type="monotone" dataKey={m.id} stroke={m.color}
                      dot={false} strokeWidth={selected === m.id ? 2 : 1}
                      opacity={selected === null || selected === m.id ? 1 : 0.2}
                      name={m.shortName} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Rolling Beta / Rolling Alpha */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="panel" style={{ height: 220 }}>
            <div className="panel-hdr">
              <span className="panel-title">ROLLING 30D BETA vs</span>
              <span className="panel-meta" style={{ display: 'flex', gap: 4 }}>
                <button className={`btn${bench === 'BTC' ? ' active' : ''}`} style={{ padding: '1px 6px' }} onClick={() => setBench('BTC')}>BTC</button>
                <button className={`btn${bench === 'ETH' ? ' active' : ''}`} style={{ padding: '1px 6px' }} onClick={() => setBench('ETH')}>ETH</button>
              </span>
            </div>
            <div style={{ height: 178, padding: '4px 4px 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={betaAlphaData} margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} interval={Math.floor(betaAlphaData.length / 5)} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} axisLine={false} width={32} />
                  <ReferenceLine y={0} stroke="var(--border-bright)" />
                  <ReferenceLine y={1} stroke="var(--text-dim)" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: 'β=1', fill: 'var(--text-dim)', fontSize: 8, position: 'insideTopRight' }} />
                  <Tooltip formatter={(v: unknown, name: unknown) => [Number(v).toFixed(2), String(name).replace('beta_', '')]} contentStyle={TT} />
                  {MANAGERS.map(m => (
                    <Line key={m.id} type="monotone" dataKey={`beta_${m.id}`} stroke={m.color}
                      dot={false} strokeWidth={selected === m.id ? 2 : 1}
                      opacity={selected === null || selected === m.id ? 1 : 0.2}
                      name={`beta_${m.id}`} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel" style={{ height: 220 }}>
            <div className="panel-hdr">
              <span className="panel-title">ROLLING 30D ALPHA vs {bench} (ann. %)</span>
              <span className="panel-meta">style drift detector</span>
            </div>
            <div style={{ height: 178, padding: '4px 4px 0 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={betaAlphaData} margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} interval={Math.floor(betaAlphaData.length / 5)} />
                  <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} axisLine={false} width={44} />
                  <ReferenceLine y={0} stroke="var(--border-bright)" />
                  <Tooltip formatter={(v: unknown, name: unknown) => [`${Number(v).toFixed(2)}%`, String(name).replace('alpha_', '')]} contentStyle={TT} />
                  {MANAGERS.map(m => (
                    <Line key={m.id} type="monotone" dataKey={`alpha_${m.id}`} stroke={m.color}
                      dot={false} strokeWidth={selected === m.id ? 2 : 1}
                      opacity={selected === null || selected === m.id ? 1 : 0.2}
                      name={`alpha_${m.id}`} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sortable performance stats table */}
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">PERFORMANCE STATISTICS</span>
            <span className="panel-meta" style={{ color: 'var(--text-muted)' }}>↑↓ CLICK HEADER TO SORT</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>MANAGER</th>
                  <th>STRATEGY</th>
                  {([
                    ['ytd', 'YTD'], ['m1', '1M'], ['totalReturn', 'TOTAL'],
                    ['sharpe', 'SHARPE'], ['sortino', 'SORTINO'], ['calmar', 'CALMAR'],
                    ['maxDD', 'MAX DD'], ['aum', 'AUM'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th key={key} className="r" style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort(key)}>
                      {label}{si(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedManagers.map(m => {
                  const s = MANAGER_STATS[m.id];
                  return (
                    <tr key={m.id} style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(m.id === selected ? null : m.id)}>
                      <td>
                        <span className="manager-dot" style={{ background: m.color }} />
                        <span style={{ color: m.id === selected ? m.color : 'var(--text-bright)' }}>{m.name}</span>
                      </td>
                      <td className="dim">{m.strategy}</td>
                      <td className={`r ${s.ytd >= 0 ? 'pos' : 'neg'}`}>{fmtPct(s.ytd)}</td>
                      <td className={`r ${s.m1 >= 0 ? 'pos' : 'neg'}`}>{fmtPct(s.m1)}</td>
                      <td className={`r ${s.totalReturn >= 0 ? 'pos' : 'neg'}`}>{fmtPct(s.totalReturn)}</td>
                      <td className="r" style={{ color: s.sharpe >= 1.5 ? 'var(--green)' : s.sharpe >= 0.8 ? 'var(--yellow)' : 'var(--red)' }}>{s.sharpe.toFixed(2)}</td>
                      <td className="r" style={{ color: s.sortino >= 2 ? 'var(--green)' : s.sortino >= 1 ? 'var(--yellow)' : 'var(--red)' }}>{s.sortino.toFixed(2)}</td>
                      <td className="r" style={{ color: s.calmar >= 1 ? 'var(--green)' : s.calmar >= 0.5 ? 'var(--yellow)' : 'var(--red)' }}>{s.calmar.toFixed(2)}</td>
                      <td className="r neg">{fmtPct(s.maxDD)}</td>
                      <td className="r bright">{fmtUSD(m.aum)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* HIT scatter  +  CORR heatmap */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

          {/* HIT RATE vs PAYOFF RATIO */}
          <div className="panel" style={{ height: 320 }}>
            <div className="panel-hdr">
              <span className="panel-title">HIT RATE vs PAYOFF RATIO</span>
              <span className="panel-meta">from trade blotter</span>
            </div>
            <div style={{ height: 280, padding: '4px 4px 24px 4px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 20, bottom: 28, left: 20 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis type="number" dataKey="winRate" name="Win Rate" unit="%" domain={[0, 100]}
                    tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false}
                    label={{ value: 'Win Rate (%)', position: 'insideBottom', offset: -12, fill: 'var(--text-dim)', fontSize: 9 }} />
                  <YAxis type="number" dataKey="payoffRatio" name="Payoff" domain={[0, 'auto']}
                    tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} axisLine={false} width={36}
                    label={{ value: 'Payoff (Win/Loss)', angle: -90, position: 'insideLeft', fill: 'var(--text-dim)', fontSize: 9 }} />
                  <ZAxis range={[70, 70]} />
                  <ReferenceLine x={50} stroke="var(--border-bright)" strokeDasharray="3 3" label={{ value: '50%', fill: 'var(--text-dim)', fontSize: 8, position: 'insideTopRight' }} />
                  <ReferenceLine y={1} stroke="var(--border-bright)" strokeDasharray="3 3" label={{ value: '1×', fill: 'var(--text-dim)', fontSize: 8, position: 'insideTopLeft' }} />
                  <Tooltip contentStyle={TT} content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as typeof hitData[0];
                    return (
                      <div style={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', padding: '6px 10px', fontSize: 10, fontFamily: 'var(--font)' }}>
                        <div style={{ fontWeight: 'bold', color: d.color, marginBottom: 3 }}>{d.name}</div>
                        <div>Win Rate: {d.winRate}%</div>
                        <div>Payoff Ratio: {d.payoffRatio.toFixed(2)}×</div>
                        <div>Profit Factor: {d.profitFactor.toFixed(2)}</div>
                        <div>Expectancy: {d.expectancy >= 0 ? '+' : ''}${d.expectancy.toLocaleString()}</div>
                        <div style={{ color: 'var(--text-dim)' }}>n = {d.totalTrades} trades</div>
                      </div>
                    );
                  }} />
                  {hitData.map((d, i) => (
                    <Scatter key={i} name={d.name} data={[d]} fill={d.color} opacity={0.9} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MANAGER CORRELATION HEATMAP */}
          <div className="panel" style={{ height: 320 }}>
            <div className="panel-hdr">
              <span className="panel-title">MANAGER CORRELATION MATRIX</span>
              <span className="panel-meta">90D ROLLING</span>
            </div>
            <div style={{ padding: '16px 16px 8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-xs)', fontFamily: 'var(--font-data)' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '2px 4px' }} />
                    {MANAGERS.map(m => (
                      <th key={m.id} style={{ padding: '2px 4px', color: m.color, fontWeight: 'normal', textAlign: 'center', fontSize: 8 }}>
                        {m.shortName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MANAGERS.map(row => (
                    <tr key={row.id}>
                      <td style={{ padding: '2px 4px', color: row.color, fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: 8 }}>{row.shortName}</td>
                      {MANAGERS.map(col => {
                        const v = corrMatrix[row.id]?.[col.id] ?? 0;
                        return (
                          <td key={col.id} style={{
                            padding: '4px 2px', textAlign: 'center',
                            background: corrColor(v),
                            color: row.id === col.id ? 'var(--text-bright)'
                              : v > 0.3 ? '#7dffb3' : v < -0.3 ? '#ff9999' : 'var(--text)',
                            fontWeight: row.id === col.id ? 'bold' : 'normal',
                            fontSize: 9, border: '1px solid var(--bg-sidebar)',
                          }}>
                            {v.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-data)' }}>
                <span><span style={{ color: '#7dffb3' }}>■</span> High positive (&gt;0.3)</span>
                <span><span style={{ color: 'var(--text-dim)' }}>■</span> Near zero</span>
                <span><span style={{ color: '#ff9999' }}>■</span> Negative (&lt;-0.3)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Win/Loss magnitude table */}
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">WIN / LOSS STATISTICS — TRADE BLOTTER DERIVED</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>MANAGER</th>
                  <th className="r">TRADES</th>
                  <th className="r">WIN RATE</th>
                  <th className="r">AVG WIN</th>
                  <th className="r">AVG LOSS</th>
                  <th className="r">PAYOFF</th>
                  <th className="r">EXPECTANCY</th>
                  <th className="r">PROFIT FACTOR</th>
                </tr>
              </thead>
              <tbody>
                {MANAGERS.map(m => {
                  const ts = MANAGER_TRADE_STATS[m.id];
                  return (
                    <tr key={m.id}>
                      <td><span className="manager-dot" style={{ background: m.color }} />{m.name}</td>
                      <td className="r">{ts.totalTrades}</td>
                      <td className="r" style={{ color: ts.winRate >= 0.55 ? 'var(--green)' : ts.winRate >= 0.45 ? 'var(--yellow)' : 'var(--red)' }}>
                        {(ts.winRate * 100).toFixed(1)}%
                      </td>
                      <td className="r pos">${ts.avgWin.toLocaleString()}</td>
                      <td className="r neg">−${Math.abs(ts.avgLoss).toLocaleString()}</td>
                      <td className="r" style={{ color: ts.payoffRatio >= 1 ? 'var(--green)' : 'var(--red)' }}>{ts.payoffRatio.toFixed(2)}×</td>
                      <td className={`r ${ts.expectancy >= 0 ? 'pos' : 'neg'}`}>{ts.expectancy >= 0 ? '+' : '−'}${Math.abs(ts.expectancy).toLocaleString()}</td>
                      <td className="r" style={{ color: ts.profitFactor >= 1.5 ? 'var(--green)' : ts.profitFactor >= 1 ? 'var(--yellow)' : 'var(--red)' }}>{ts.profitFactor.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

