import { getCorrelationMatrix, CORRELATION_IDS } from '../data/mockData';
import { useState, useMemo } from 'react';

const PERIOD_DAYS: Record<string, number> = {
  '30D': 30, '60D': 60, '90D': 90, '180D': 180, '360D': 360, '540D': 540,
};

const LABELS: Record<string, string> = {
  M1: 'QALPHA', M2: 'DSIGMA', M3: 'NEXDEF', M4: 'APXCAP', M5: 'CHNVST', M6: 'AURORA',
  portfolio: 'PORTFOLIO', BTC: 'BTC', ETH: 'ETH', SPX: 'SPX', VIX: 'VIX',
};

function corrColor(v: number): string {
  if (v >=  0.8) return '#ff3344';
  if (v >=  0.6) return '#ff7722';
  if (v >=  0.4) return '#ffd020';
  if (v >=  0.2) return '#8ab4cc';
  if (v >=  0.0) return '#3a5880';
  if (v >= -0.2) return '#2a4466';
  if (v >= -0.4) return '#1a3355';
  return '#0d2040';
}

function textColor(v: number): string {
  return Math.abs(v) > 0.3 ? '#e8f2f8' : '#6a8090';
}

export default function CorrelationMatrix() {
  const [period, setPeriod] = useState('90D');

  const matrix = useMemo(() => getCorrelationMatrix(PERIOD_DAYS[period]), [period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">CORRELATION MATRIX</div>
          <div className="page-subtitle">Manager, benchmark &amp; market factor correlations</div>
        </div>
        <div className="btn-group">
          {Object.keys(PERIOD_DAYS).map(p => (
            <button key={p} className={`btn${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[[-1,'#0d2040'],[-.6,'#1a3355'],[-.2,'#2a4466'],[0,'#3a5880'],[.2,'#8ab4cc'],[.4,'#ffd020'],[.6,'#ff7722'],[.8,'#ff3344'],[1,'#ff0000']].map(([v,c]) => (
            <div key={v as number} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 28, height: 14, background: c as string }} />
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>{Number(v).toFixed(1)}</span>
            </div>
          ))}
          <span style={{ marginLeft: 8, fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            Rolling {period} correlation
          </span>
        </div>

        {/* Matrix */}
        <div className="panel" style={{ overflow: 'auto' }}>
          <div className="panel-hdr">
            <span className="panel-title">CORRELATION HEATMAP — {period}</span>
            <span className="panel-meta">{CORRELATION_IDS.length}×{CORRELATION_IDS.length}</span>
          </div>
          <div style={{ overflowX: 'auto', padding: 8 }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 'var(--font-xs)' }}>
              <thead>
                <tr>
                  <th style={{ padding: '4px 8px', color: 'var(--orange)', background: 'var(--bg-panel-hdr)', borderBottom: '1px solid var(--border-bright)', textAlign: 'left', minWidth: 72 }}>
                    ASSET
                  </th>
                  {CORRELATION_IDS.map(id => (
                    <th key={id} style={{ padding: '4px 6px', color: 'var(--orange)', background: 'var(--bg-panel-hdr)', borderBottom: '1px solid var(--border-bright)', textAlign: 'center', minWidth: 62, whiteSpace: 'nowrap' }}>
                      {LABELS[id]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CORRELATION_IDS.map(rowId => (
                  <tr key={rowId}>
                    <td style={{ padding: '3px 8px', color: 'var(--orange)', background: 'var(--bg-panel-hdr)', borderRight: '1px solid var(--border-bright)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {LABELS[rowId]}
                    </td>
                    {CORRELATION_IDS.map(colId => {
                      const v = matrix[rowId][colId];
                      return (
                        <td key={colId} style={{
                          padding: '3px 6px',
                          background: corrColor(v),
                          color: textColor(v),
                          textAlign: 'center',
                          fontWeight: rowId === colId ? 'bold' : 'normal',
                          borderBottom: '1px solid rgba(0,0,0,.3)',
                          minWidth: 62,
                        }}>
                          {v === 1 ? '—' : v.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
