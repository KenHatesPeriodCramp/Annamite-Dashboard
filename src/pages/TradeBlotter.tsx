import { TRADES, MANAGERS, fmtUSD } from '../data/mockData';
import { useState } from 'react';

export default function TradeBlotter() {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  const [mgrFilter, setMgrFilter] = useState<string>('All');

  const filtered = TRADES.filter(t =>
    (statusFilter === 'All' || t.status === statusFilter) &&
    (mgrFilter === 'All' || t.managerId === mgrFilter)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">TRADE BLOTTER</div>
          <div className="page-subtitle">Real-time trade record — all managers &amp; exchanges</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Status filter */}
          <div className="btn-group">
            {(['All','Open','Closed'] as const).map(s => (
              <button key={s} className={`btn${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
          {/* Manager filter */}
          <div className="btn-group">
            <button className={`btn${mgrFilter === 'All' ? ' active' : ''}`} onClick={() => setMgrFilter('All')}>ALL MGR</button>
            {MANAGERS.map(m => (
              <button key={m.id} className={`btn${mgrFilter === m.id ? ' active' : ''}`} onClick={() => setMgrFilter(m.id)}>
                <span className="manager-dot" style={{ background: m.color }} />{m.shortName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', borderBottom: '1px solid var(--border-bright)' }}>
        {[
          { label: 'TOTAL TRADES', value: String(filtered.length) },
          { label: 'OPEN', value: String(filtered.filter(t=>t.status==='Open').length), color: 'var(--yellow)' },
          { label: 'CLOSED', value: String(filtered.filter(t=>t.status==='Closed').length), color: 'var(--text-muted)' },
          { label: 'TOTAL PNL', value: fmtUSD(filtered.reduce((s,t)=>s+t.pnlUsd,0)), color: filtered.reduce((s,t)=>s+t.pnlUsd,0) >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'TOTAL FEES', value: fmtUSD(filtered.reduce((s,t)=>s+t.feesUsd,0)), color: 'var(--text-muted)' },
          { label: 'TOTAL VOLUME', value: fmtUSD(filtered.reduce((s,t)=>s+t.sizeUsd,0)) },
        ].map(item => (
          <div key={item.label} className="metric-card">
            <span className="metric-label">{item.label}</span>
            <span className="metric-value" style={{ color: item.color ?? 'var(--text-bright)', fontSize: 'var(--font-xl)' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Trade table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="bb-table">
          <thead>
            <tr>
              <th>TRADE ID</th>
              <th>TIME</th>
              <th>MANAGER</th>
              <th>EXCHANGE</th>
              <th>PAIR</th>
              <th>DIRECTION</th>
              <th className="r">SIZE (USD)</th>
              <th className="r">PNL (USD)</th>
              <th className="r">FEES</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const mgr = MANAGERS.find(m => m.id === t.managerId)!;
              const ts  = new Date(t.timestamp);
              return (
                <tr key={t.id}>
                  <td className="orange">{t.id}</td>
                  <td className="dim">{ts.toISOString().slice(0,16).replace('T',' ')}</td>
                  <td>
                    <span className="manager-dot" style={{ background: mgr.color }} />
                    {mgr.shortName}
                  </td>
                  <td className="dim">{t.exchange}</td>
                  <td style={{ color: 'var(--text-bright)' }}>{t.pair}</td>
                  <td>
                    <span className={`badge ${t.direction === 'Long' ? 'badge-green' : 'badge-red'}`}>
                      {t.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="r bright">{fmtUSD(t.sizeUsd)}</td>
                  <td className={`r ${t.pnlUsd >= 0 ? 'pos' : 'neg'}`} style={{ fontWeight: 'bold' }}>
                    {t.pnlUsd >= 0 ? '+' : ''}{fmtUSD(t.pnlUsd, 0)}
                  </td>
                  <td className="r dim">-{fmtUSD(t.feesUsd, 0)}</td>
                  <td>
                    <span className={`badge ${t.status === 'Open' ? 'badge-yellow' : 'badge-green'}`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>NO TRADES MATCH FILTER</div>
        )}
      </div>
    </div>
  );
}
