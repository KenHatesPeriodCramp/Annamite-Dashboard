import { STRESS_SCENARIOS, MANAGERS, MARGIN_DATA, fmtPct, fmtUSD } from '../data/mockData';
import { useState } from 'react';

const BTC_LEVELS = [-0.10, -0.20, -0.30, -0.40, -0.50, -0.60, -0.70];

export default function StressTesting() {
  const [selected, setSelected] = useState<number | null>(null);
  const scenario = selected !== null ? STRESS_SCENARIOS[selected] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">STRESS TESTING</div>
          <div className="page-subtitle">Historical event analysis &amp; scenario simulation</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', gap: 8 }}>
        {/* Scenario list */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="panel-hdr" style={{ marginBottom: 4 }}>
            <span className="panel-title">HISTORICAL SCENARIOS</span>
          </div>
          {STRESS_SCENARIOS.map((s, i) => (
            <div
              key={i}
              className="panel"
              onClick={() => setSelected(i === selected ? null : i)}
              style={{
                cursor: 'pointer',
                borderColor: i === selected ? 'var(--orange)' : 'var(--border)',
                background: i === selected ? 'var(--bg-active)' : 'var(--bg-panel)',
              }}
            >
              <div style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: i === selected ? 'var(--orange)' : 'var(--text-bright)', fontWeight: 'bold', fontSize: 'var(--font-sm)' }}>
                    {s.name}
                  </span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-dim)' }}>{s.date}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 'var(--font-xs)' }}>
                  <span>BTC: <span style={{ color: 'var(--red)' }}>{fmtPct(s.btcShock)}</span></span>
                  <span>Portfolio: <span style={{ color: s.portfolioImpact < 0 ? 'var(--red)' : 'var(--green)' }}>{fmtPct(s.portfolioImpact)}</span></span>
                  <span>MaxDD: <span style={{ color: 'var(--red)' }}>{fmtPct(s.maxDD)}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scenario detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scenario ? (
            <>
              <div className="panel">
                <div className="panel-hdr">
                  <span className="panel-title">SCENARIO: {scenario.name.toUpperCase()}</span>
                  <span className="panel-meta">{scenario.date}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)' }}>
                  {[
                    { label: 'BTC SHOCK',       value: fmtPct(scenario.btcShock),         color: 'var(--red)'  },
                    { label: 'ETH SHOCK',        value: fmtPct(scenario.ethShock),         color: 'var(--red)'  },
                    { label: 'SPX SHOCK',        value: fmtPct(scenario.spxShock),         color: 'var(--red)'  },
                    { label: 'VIX LEVEL',        value: String(scenario.vixLevel),         color: 'var(--yellow)'},
                    { label: 'PORTFOLIO IMPACT', value: fmtPct(scenario.portfolioImpact),  color: scenario.portfolioImpact < 0 ? 'var(--red)' : 'var(--green)' },
                    { label: 'MAX DRAWDOWN',     value: fmtPct(scenario.maxDD),            color: 'var(--red)'  },
                  ].map(item => (
                    <div key={item.label} className="metric-card">
                      <span className="metric-label">{item.label}</span>
                      <span className="metric-value" style={{ color: item.color, fontSize: 'var(--font-xl)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager impact */}
              <div className="panel">
                <div className="panel-hdr"><span className="panel-title">MANAGER IMPACT ESTIMATE</span></div>
                <table className="bb-table">
                  <thead>
                    <tr>
                      <th>MANAGER</th>
                      <th className="r">AUM</th>
                      <th className="r">LEVERAGE</th>
                      <th className="r">EST. LOSS (USD)</th>
                      <th className="r">EST. RETURN</th>
                      <th>MARGIN STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MANAGERS.map(m => {
                      const md    = MARGIN_DATA.find(d => d.managerId === m.id)!;
                      const estR  = scenario.portfolioImpact * (1 + (md.leverageCurrent - 1) * 0.5);
                      const loss  = estR * m.aum;
                      const margCall = -estR >= md.distanceToMarginCall;
                      const liq      = -estR >= md.distanceToLiquidation;
                      return (
                        <tr key={m.id}>
                          <td><span className="manager-dot" style={{ background: m.color }} />{m.shortName}</td>
                          <td className="r bright">{fmtUSD(m.aum)}</td>
                          <td className="r orange">{md.leverageCurrent.toFixed(2)}×</td>
                          <td className="r neg" style={{ fontWeight: 'bold' }}>{fmtUSD(loss)}</td>
                          <td className={`r ${estR >= 0 ? 'pos' : 'neg'}`}>{fmtPct(estR)}</td>
                          <td>
                            {liq      ? <span className="badge badge-red">LIQUIDATION</span> :
                             margCall ? <span className="badge badge-yellow">MARGIN CALL</span> :
                                        <span className="badge badge-green">SAFE</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Recovery info */}
              <div className="panel">
                <div className="panel-hdr"><span className="panel-title">RECOVERY OUTLOOK</span></div>
                <div style={{ padding: 12, display: 'flex', gap: 24, fontSize: 'var(--font-sm)' }}>
                  <div>
                    <div style={{ color: 'var(--text-dim)', fontSize: 'var(--font-xs)' }}>EST. RECOVERY TIME</div>
                    <div style={{ color: 'var(--yellow)', fontSize: 'var(--font-xl)', fontWeight: 'bold' }}>
                      {scenario.recoveryDays} DAYS
                    </div>
                  </div>
                  <div style={{ flex: 1, color: 'var(--text-muted)', fontSize: 'var(--font-xs)', lineHeight: 1.6 }}>
                    Based on historical precedent. Recovery time is from the trough to prior peak NAV.
                    Actual recovery will depend on manager positioning, market conditions, and rebalancing speed.
                    Cascade/contagion effects not modelled in this simulation.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* BTC shock table (always visible) */}
              <div className="panel">
                <div className="panel-hdr">
                  <span className="panel-title">PORTFOLIO SENSITIVITY — BTC SHOCK LEVELS</span>
                  <span className="panel-meta">SELECT A SCENARIO FOR DETAIL</span>
                </div>
                <table className="bb-table">
                  <thead>
                    <tr>
                      <th>MANAGER</th>
                      <th className="r">AUM</th>
                      {BTC_LEVELS.map(l => (
                        <th key={l} className="r" style={{ color: 'var(--orange)' }}>BTC {(l*100).toFixed(0)}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MANAGERS.map(m => {
                      const md = MARGIN_DATA.find(d => d.managerId === m.id)!;
                      return (
                        <tr key={m.id}>
                          <td><span className="manager-dot" style={{ background: m.color }} />{m.shortName}</td>
                          <td className="r bright">{fmtUSD(m.aum)}</td>
                          {BTC_LEVELS.map(l => {
                            const estR = l * 0.6 * md.leverageCurrent;
                            const loss = estR * m.aum;
                            return (
                              <td key={l} className="r neg" style={{ fontSize: 'var(--font-xs)' }}>
                                {fmtUSD(loss, 0)}
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
          )}
        </div>
      </div>
    </div>
  );
}
