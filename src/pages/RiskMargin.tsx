import { MANAGERS, MARGIN_DATA, fmtUSD, fmtMult } from '../data/mockData';

function LeverageGauge({ value, max = 4 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const color = pct < 0.45 ? 'var(--green)' : pct < 0.65 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)' }}>
        <span style={{ color: 'var(--text-dim)' }}>0×</span>
        <span style={{ color }}>▶ {fmtMult(value)}</span>
        <span style={{ color: 'var(--text-dim)' }}>{max}×</span>
      </div>
      <div className="progress-bar-track" style={{ height: 10 }}>
        <div className="progress-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

const BTC_SHOCKS = [-0.10, -0.20, -0.30, -0.40, -0.50];

export default function RiskMargin() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">RISK & MARGIN</div>
          <div className="page-subtitle" style={{ color: 'var(--red)' }}>
            ⚠ CRITICAL — Monitor leverage, margin calls &amp; liquidation risk
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Leverage gauges per manager */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {MARGIN_DATA.map(md => {
            const mgr = MANAGERS.find(m => m.id === md.managerId)!;
            const marginColor = md.marginUsedPct < 0.5 ? 'var(--green)' : md.marginUsedPct < 0.75 ? 'var(--yellow)' : 'var(--red)';
            return (
              <div key={md.managerId} className="panel">
                <div className="panel-hdr">
                  <span className="panel-title">
                    <span className="manager-dot" style={{ background: mgr.color }} />
                    {mgr.shortName}
                  </span>
                  <span className="panel-meta">{md.exchange}</span>
                </div>
                <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <LeverageGauge value={md.leverageCurrent} max={md.leverageMax} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 'var(--font-xs)' }}>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>MARGIN USED</div>
                      <div style={{ color: marginColor, fontWeight: 'bold', fontSize: 'var(--font-base)' }}>
                        {(md.marginUsedPct * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>COLLATERAL</div>
                      <div style={{ color: 'var(--text-bright)', fontWeight: 'bold', fontSize: 'var(--font-base)' }}>
                        {fmtUSD(md.collateralUsd)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>MARGIN CALL</div>
                      <div style={{ color: 'var(--yellow)', fontWeight: 'bold' }}>
                        -{(md.distanceToMarginCall * 100).toFixed(1)}% BTC
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-dim)' }}>LIQUIDATION</div>
                      <div style={{ color: 'var(--red)', fontWeight: 'bold' }}>
                        -{(md.distanceToLiquidation * 100).toFixed(1)}% BTC
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Liquidation scenario matrix */}
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">LIQUIDATION SCENARIO MATRIX</span>
            <span className="panel-meta">BTC DRAWDOWN SHOCK</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>MANAGER</th>
                  <th>LEV</th>
                  <th>MARGIN USED</th>
                  {BTC_SHOCKS.map(s => (
                    <th key={s} className="r" style={{ color: 'var(--text-orange)' }}>BTC {(s * 100).toFixed(0)}%</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MARGIN_DATA.map(md => {
                  const mgr = MANAGERS.find(m => m.id === md.managerId)!;
                  return (
                    <tr key={md.managerId}>
                      <td>
                        <span className="manager-dot" style={{ background: mgr.color }} />
                        {mgr.shortName}
                      </td>
                      <td className="orange">{fmtMult(md.leverageCurrent)}</td>
                      <td style={{ color: md.marginUsedPct > 0.75 ? 'var(--red)' : md.marginUsedPct > 0.5 ? 'var(--yellow)' : 'var(--green)' }}>
                        {(md.marginUsedPct * 100).toFixed(1)}%
                      </td>
                      {BTC_SHOCKS.map(shock => {
                        const margCallHit = -shock >= md.distanceToMarginCall;
                        const liqHit      = -shock >= md.distanceToLiquidation;
                        const label = liqHit ? '🔴 LIQ' : margCallHit ? '🟡 CALL' : '✅ OK';
                        return (
                          <td key={shock} className="r" style={{
                            color: liqHit ? 'var(--red)' : margCallHit ? 'var(--yellow)' : 'var(--green)',
                            fontWeight: liqHit || margCallHit ? 'bold' : 'normal',
                          }}>
                            {label}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Aggregated stats */}
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">PORTFOLIO MARGIN SUMMARY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0 }}>
            {[
              { label: 'AVG LEVERAGE',     value: fmtMult(MARGIN_DATA.reduce((s,m)=>s+m.leverageCurrent,0)/MARGIN_DATA.length), color: 'var(--orange)' },
              { label: 'MAX LEVERAGE',     value: fmtMult(Math.max(...MARGIN_DATA.map(m=>m.leverageCurrent))), color: 'var(--red)' },
              { label: 'AVG MARGIN USED',  value: `${(MARGIN_DATA.reduce((s,m)=>s+m.marginUsedPct,0)/MARGIN_DATA.length*100).toFixed(1)}%`, color: 'var(--yellow)' },
              { label: 'AT-RISK MANAGERS', value: `${MARGIN_DATA.filter(m=>m.marginUsedPct>0.7).length} / ${MARGIN_DATA.length}`, color: 'var(--red)' },
              { label: 'TOTAL COLLATERAL', value: fmtUSD(MARGIN_DATA.reduce((s,m)=>s+m.collateralUsd,0)), color: 'var(--text-bright)' },
            ].map(item => (
              <div key={item.label} className="metric-card">
                <span className="metric-label">{item.label}</span>
                <span className="metric-value" style={{ color: item.color, fontSize: 'var(--font-xl)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
