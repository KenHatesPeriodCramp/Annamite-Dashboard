import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import {
  MANAGERS, TOTAL_NAV, PORTFOLIO_EXPOSURE, MANAGER_STATS,
  RETURN_SERIES, MARGIN_DATA,
  fmtUSD, fmtPct, fmtMult,
  type ReturnPoint,
} from '../data/mockData';

// ── Time range filter ─────────────────────────────────────
const RANGES: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '18M': 545 };

function filterSeries(days: number): ReturnPoint[] {
  return RETURN_SERIES.slice(-Math.min(days, RETURN_SERIES.length));
}

// ── Custom chart tooltip ──────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bb-tooltip">
      <div className="bb-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="bb-tooltip-row">
          <span className="bb-tooltip-name" style={{ color: p.color }}>{p.name}</span>
          <span className="bb-tooltip-val" style={{ color: p.value >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {fmtPct(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Leverage bar ──────────────────────────────────────────
function LeverageBar({ value, max = 4 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const color = pct < 0.5 ? 'var(--green)' : pct < 0.75 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div className="progress-bar-track" style={{ flex: 1 }}>
      <div className="progress-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls = status === 'NORMAL' ? 'badge-green' : status === 'WATCH' ? 'badge-yellow' : 'badge-red';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function Overview() {
  const [range, setRange] = useState('6M');
  const [showManagers, setShowManagers] = useState<Record<string, boolean>>(
    Object.fromEntries([...MANAGERS.map(m => [m.id, true]), ['portfolio', true], ['BTC', true]])
  );
  const [mgrSort, setMgrSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'ytd', dir: 'desc' });

  const sortedMgrs = useMemo(() => [...MANAGERS].sort((a, b) => {
    let va: number, vb: number;
    if (mgrSort.key === 'aum') { va = a.aum; vb = b.aum; }
    else if (mgrSort.key === 'alloc') { va = a.targetAlloc; vb = b.targetAlloc; }
    else {
      va = (MANAGER_STATS[a.id] as unknown as Record<string, number>)[mgrSort.key] ?? 0;
      vb = (MANAGER_STATS[b.id] as unknown as Record<string, number>)[mgrSort.key] ?? 0;
    }
    return mgrSort.dir === 'desc' ? vb - va : va - vb;
  }), [mgrSort]);

  const handleMgrSort = (key: string) => {
    setMgrSort(prev => prev.key === key
      ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { key, dir: 'desc' });
  };
  const si = (key: string) => mgrSort.key === key ? (mgrSort.dir === 'desc' ? ' ↓' : ' ↑') : '';

  const chartData = useMemo(() => {
    const days = RANGES[range];
    return filterSeries(days).map(p => ({
      ...p,
      date: p.date.slice(5), // MM-DD
    }));
  }, [range]);

  const exp = PORTFOLIO_EXPOSURE;
  const ps  = MANAGER_STATS.portfolio;

  const toggleManager = (id: string) =>
    setShowManagers(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-title">PORTFOLIO OVERVIEW</div>
          <div className="page-subtitle">Real-time multi-manager performance dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>AS OF 2026-03-30</span>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="metric-row" style={{ gridTemplateColumns: 'repeat(8,1fr)' }}>
        <MetricCard label="NET ASSET VALUE"    value={fmtUSD(TOTAL_NAV)}               />
        <MetricCard label="GROSS MKT VALUE"    value={fmtUSD(exp.gmv)}                  />
        <MetricCard label="NET MKT VALUE"      value={fmtUSD(exp.nmv)}                  />
        <MetricCard label="LONG MKT VALUE"     value={fmtUSD(exp.lmv)}                  />
        <MetricCard label="SHORT MKT VALUE"    value={fmtUSD(exp.smv)}    neg           />
        <MetricCard label="LEVERAGE"           value={fmtMult(exp.leverage)} orange     />
        <MetricCard label="YTD RETURN"         value={fmtPct(ps.ytd)}     pos={ps.ytd >= 0} neg={ps.ytd < 0} />
        <MetricCard label="SHARPE (SINCE INCEP)" value={ps.sharpe.toFixed(2)} />
      </div>

      {/* Main grid */}
      <div className="overview-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* Chart panel */}
        <div className="panel chart-panel" style={{ minHeight: 0 }}>
          <div className="panel-hdr">
            <span className="panel-title">CUMULATIVE RETURNS</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="btn-group">
                {Object.keys(RANGES).map(r => (
                  <button key={r} className={`btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="panel-body" style={{ flex: 1, padding: '8px 4px 4px 0', minHeight: 0 }}>
            {/* Series toggle pills */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingLeft: 12, paddingBottom: 4 }}>
              {MANAGERS.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleManager(m.id)}
                  style={{
                    padding: '1px 7px',
                    fontSize: 'var(--font-xs)',
                    fontFamily: 'var(--font)',
                    cursor: 'pointer',
                    border: `1px solid ${showManagers[m.id] ? m.color : 'var(--border)'}`,
                    background: showManagers[m.id] ? `${m.color}22` : 'transparent',
                    color: showManagers[m.id] ? m.color : 'var(--text-dim)',
                  }}
                >
                  {m.shortName}
                </button>
              ))}
              <button
                onClick={() => toggleManager('portfolio')}
                style={{
                  padding: '1px 7px', fontSize: 'var(--font-xs)', fontFamily: 'var(--font)', cursor: 'pointer',
                  border: `1px solid ${showManagers.portfolio ? 'var(--white)' : 'var(--border)'}`,
                  background: showManagers.portfolio ? 'rgba(232,242,248,.15)' : 'transparent',
                  color: showManagers.portfolio ? 'var(--white)' : 'var(--text-dim)',
                }}
              >
                PORTFOLIO
              </button>
              <button
                onClick={() => toggleManager('BTC')}
                style={{
                  padding: '1px 7px', fontSize: 'var(--font-xs)', fontFamily: 'var(--font)', cursor: 'pointer',
                  border: `1px solid ${showManagers.BTC ? '#F7931A' : 'var(--border)'}`,
                  background: showManagers.BTC ? 'rgba(247,147,26,.15)' : 'transparent',
                  color: showManagers.BTC ? '#F7931A' : 'var(--text-dim)',
                }}
              >
                BTC
              </button>
            </div>

            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                  tickLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  tickFormatter={(v: number) => fmtPct(v, 0)}
                  tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} />
                {MANAGERS.map(m =>
                  showManagers[m.id] ? (
                    <Line
                      key={m.id}
                      type="monotone"
                      dataKey={m.id}
                      stroke={m.color}
                      dot={false}
                      strokeWidth={1.5}
                      name={m.shortName}
                    />
                  ) : null
                )}
                {showManagers.portfolio && (
                  <Line type="monotone" dataKey="portfolio" stroke="var(--white)"
                    dot={false} strokeWidth={2.5} name="PORTFOLIO" />
                )}
                {showManagers.BTC && (
                  <Line type="monotone" dataKey="BTC" stroke="#F7931A"
                    dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="BTC" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manager summary table */}
        <div className="panel manager-table-panel" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-hdr">
            <span className="panel-title">MANAGER SUMMARY</span>
            <span className="panel-meta">{MANAGERS.length} ACTIVE · ↑↓ CLICK HEADER TO SORT</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>MANAGER</th>
                  <th>TYPE</th>
                  <th className="r" style={{ cursor: 'pointer' }} onClick={() => handleMgrSort('aum')}>AUM{si('aum')}</th>
                  <th className="r" style={{ cursor: 'pointer' }} onClick={() => handleMgrSort('alloc')}>ALLOC{si('alloc')}</th>
                  <th className="r" style={{ cursor: 'pointer' }} onClick={() => handleMgrSort('ytd')}>YTD{si('ytd')}</th>
                  <th className="r" style={{ cursor: 'pointer' }} onClick={() => handleMgrSort('m1')}>1M{si('m1')}</th>
                  <th className="r" style={{ cursor: 'pointer' }} onClick={() => handleMgrSort('sharpe')}>SHARPE{si('sharpe')}</th>
                  <th className="r" style={{ cursor: 'pointer' }} onClick={() => handleMgrSort('maxDD')}>MAX DD{si('maxDD')}</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {sortedMgrs.map(m => {
                  const st = MANAGER_STATS[m.id];
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className="manager-dot" style={{ background: m.color }} />
                        <span style={{ color: 'var(--text-bright)' }}>{m.shortName}</span>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)', marginTop: 1, paddingLeft: 12 }}>
                          {m.strategy}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${m.type === 'CeFi' ? 'badge-cefi' : 'badge-defi'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="r bright">{fmtUSD(m.aum)}</td>
                      <td className="r">{(m.targetAlloc * 100).toFixed(0)}%</td>
                      <td className={`r ${st.ytd >= 0 ? 'pos' : 'neg'}`}>{fmtPct(st.ytd)}</td>
                      <td className={`r ${st.m1 >= 0 ? 'pos' : 'neg'}`}>{fmtPct(st.m1)}</td>
                      <td className="r" style={{ color: st.sharpe >= 1.5 ? 'var(--green)' : st.sharpe >= 0.8 ? 'var(--yellow)' : 'var(--red)' }}>
                        {st.sharpe.toFixed(2)}
                      </td>
                      <td className="r neg">{fmtPct(st.maxDD)}</td>
                      <td><StatusBadge status={m.status} /></td>
                    </tr>
                  );
                })}
                {/* Portfolio total row */}
                <tr style={{ borderTop: '1px solid var(--border-bright)', background: 'var(--bg-active)' }}>
                  <td>
                    <span className="manager-dot" style={{ background: 'var(--white)' }} />
                    <span style={{ color: 'var(--orange)', fontWeight: 'bold' }}>PORTFOLIO</span>
                  </td>
                  <td><span className="badge badge-orange">TOTAL</span></td>
                  <td className="r bright">{fmtUSD(TOTAL_NAV)}</td>
                  <td className="r">100%</td>
                  <td className={`r ${ps.ytd >= 0 ? 'pos' : 'neg'}`} style={{ fontWeight: 'bold' }}>{fmtPct(ps.ytd)}</td>
                  <td className={`r ${ps.m1 >= 0 ? 'pos' : 'neg'}`} style={{ fontWeight: 'bold' }}>{fmtPct(ps.m1)}</td>
                  <td className="r" style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>{ps.sharpe.toFixed(2)}</td>
                  <td className="r neg" style={{ fontWeight: 'bold' }}>{fmtPct(ps.maxDD)}</td>
                  <td><span className="badge badge-green">LIVE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom row */}
        <div className="bottom-row">
          {/* Exposure snapshot */}
          <div className="panel" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-hdr">
              <span className="panel-title">EXPOSURE SNAPSHOT</span>
              <span className="panel-meta">PER MANAGER</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table className="bb-table">
                <thead>
                  <tr>
                    <th>MANAGER</th>
                    <th className="r">LMV</th>
                    <th className="r">SMV</th>
                    <th className="r">GMV</th>
                    <th className="r">NMV</th>
                    <th className="r">LEV</th>
                  </tr>
                </thead>
                <tbody>
                  {MANAGERS.map(m => (
                    <tr key={m.id}>
                      <td>
                        <span className="manager-dot" style={{ background: m.color }} />
                        {m.shortName}
                      </td>
                      <td className="r pos">{fmtUSD(m.lmv)}</td>
                      <td className="r neg">{fmtUSD(m.smv)}</td>
                      <td className="r">{fmtUSD(m.lmv + Math.abs(m.smv))}</td>
                      <td className={`r ${m.lmv + m.smv >= 0 ? 'pos' : 'neg'}`}>{fmtUSD(m.lmv + m.smv)}</td>
                      <td className="r orange">{fmtMult(m.leverage)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '1px solid var(--border-bright)', background: 'var(--bg-active)' }}>
                    <td style={{ color: 'var(--orange)', fontWeight: 'bold' }}>TOTAL</td>
                    <td className="r bright">{fmtUSD(PORTFOLIO_EXPOSURE.lmv)}</td>
                    <td className="r neg">{fmtUSD(PORTFOLIO_EXPOSURE.smv)}</td>
                    <td className="r bright">{fmtUSD(PORTFOLIO_EXPOSURE.gmv)}</td>
                    <td className={`r ${PORTFOLIO_EXPOSURE.nmv >= 0 ? 'pos' : 'neg'}`}>{fmtUSD(PORTFOLIO_EXPOSURE.nmv)}</td>
                    <td className="r orange" style={{ fontWeight: 'bold' }}>{fmtMult(PORTFOLIO_EXPOSURE.leverage)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk / Margin snapshot */}
          <div className="panel" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="panel-hdr">
              <span className="panel-title">MARGIN & LEVERAGE</span>
              <span className="panel-meta" style={{ color: 'var(--red)' }}>⚠ CRITICAL MONITOR</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px' }}>
              {MARGIN_DATA.map((md) => {
                const mgr = MANAGERS.find(m => m.id === md.managerId)!;
                const pct = md.marginUsedPct;
                const color = pct < 0.5 ? 'var(--green)' : pct < 0.75 ? 'var(--yellow)' : 'var(--red)';
                return (
                  <div key={md.managerId} className="risk-bar-item">
                    <div className="risk-bar-top">
                      <span className="risk-bar-name">
                        <span className="manager-dot" style={{ background: mgr.color }} />
                        {mgr.shortName}
                        <span style={{ marginLeft: 6, fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>
                          [{md.exchange}]
                        </span>
                      </span>
                      <span className="risk-bar-val" style={{ color }}>
                        {(pct * 100).toFixed(1)}% used&nbsp;|&nbsp;
                        <span style={{ color: 'var(--text-muted)' }}>{fmtMult(md.leverageCurrent)} lev</span>
                      </span>
                    </div>
                    <LeverageBar value={pct} max={1} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', marginTop: 2 }}>
                      <span style={{ color: 'var(--text-dim)' }}>
                        Margin call at <span style={{ color: 'var(--yellow)' }}>-{(md.distanceToMarginCall * 100).toFixed(1)}%</span>
                      </span>
                      <span style={{ color: 'var(--text-dim)' }}>
                        Liq at <span style={{ color: 'var(--red)' }}>-{(md.distanceToLiquidation * 100).toFixed(1)}%</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MetricCard ────────────────────────────────────────────
function MetricCard({
  label, value, pos, neg, orange,
}: {
  label: string;
  value: string;
  pos?: boolean;
  neg?: boolean;
  orange?: boolean;
}) {
  const cls = pos ? 'pos' : neg ? 'neg' : orange ? 'orange' : '';
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${cls}`}>{value}</span>
    </div>
  );
}
