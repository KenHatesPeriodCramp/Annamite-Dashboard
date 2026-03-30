import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TOTAL_NAV, PORTFOLIO_EXPOSURE, MANAGER_STATS, fmtUSD, fmtPct, fmtMult } from '../data/mockData';

const NAV_ITEMS = [
  { to: '/',           code: 'OVR', label: 'Overview'     },
  { to: '/exposures',  code: 'EXP', label: 'Exposures'    },
  { to: '/managers',   code: 'MGR', label: 'Mgr Analysis' },
  { to: '/risk',       code: 'RSK', label: 'Risk & Margin'},
  { to: '/blotter',    code: 'TRD', label: 'Trade Blotter'},
  { to: '/correlation',code: 'COR', label: 'Correlation'  },
  { to: '/stress',     code: 'STR', label: 'Stress Test'  },
  { to: '/multifactor',code: 'MFA', label: 'Multifactor'  },
];

export default function Layout() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const exp = PORTFOLIO_EXPOSURE;
  const ps  = MANAGER_STATS.portfolio;

  return (
    <>
      {/* ── Top status bar ── */}
      <div className="topbar">
        <div className="topbar-brand">ANNAMITE</div>
        <div className="topbar-sub">MULTI-MANAGER CRYPTO FUND</div>

        <div className="topbar-metrics">
          <div className="topbar-metric">
            <span className="topbar-metric-label">NAV</span>
            <span className="topbar-metric-value">{fmtUSD(TOTAL_NAV)}</span>
          </div>
          <div className="topbar-metric">
            <span className="topbar-metric-label">GMV</span>
            <span className="topbar-metric-value">{fmtUSD(exp.gmv)}</span>
          </div>
          <div className="topbar-metric">
            <span className="topbar-metric-label">NMV</span>
            <span className="topbar-metric-value">{fmtUSD(exp.nmv)}</span>
          </div>
          <div className="topbar-metric">
            <span className="topbar-metric-label">LEVERAGE</span>
            <span className="topbar-metric-value">{fmtMult(exp.leverage)}</span>
          </div>
          <div className="topbar-metric">
            <span className="topbar-metric-label">YTD RETURN</span>
            <span className="topbar-metric-value" style={{ color: ps.ytd >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {fmtPct(ps.ytd)}
            </span>
          </div>
          <div className="topbar-metric">
            <span className="topbar-metric-label">SHARPE (1Y)</span>
            <span className="topbar-metric-value">{ps.sharpe.toFixed(2)}</span>
          </div>
          <div className="topbar-metric">
            <span className="topbar-metric-label">MAX DD</span>
            <span className="topbar-metric-value" style={{ color: 'var(--red)' }}>
              {fmtPct(ps.maxDD)}
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="live-badge">
            <span className="live-dot" />
            LIVE
          </div>
          <span className="topbar-clock">
            {time.toISOString().slice(0, 10)}&nbsp;
            {time.toTimeString().slice(0, 8)} UTC
          </span>
        </div>
      </div>

      {/* ── Shell ── */}
      <div className="app-shell">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-section-label">MODULES</div>

          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-code">{item.code}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}

          <div className="sidebar-footer">
            <div className="sidebar-footer-row">
              <span>MANAGERS</span>
              <span style={{ color: 'var(--text-bright)' }}>6</span>
            </div>
            <div className="sidebar-footer-row">
              <span>EXCHANGES</span>
              <span style={{ color: 'var(--text-bright)' }}>3</span>
            </div>
            <div className="sidebar-footer-row" style={{ marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 4 }}>
              <span style={{ color: 'var(--green)', fontSize: 'var(--font-xs)' }}>● DEMO PURPOSE</span>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
