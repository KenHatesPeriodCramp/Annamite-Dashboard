import { EXPOSURE_SERIES, fmtUSD } from '../data/mockData';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useMemo, useState } from 'react';

const RANGES: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '18M': 455 };

export default function Exposures() {
  const [range, setRange] = useState('6M');

  const chartData = useMemo(() => {
    const days = RANGES[range];
    return EXPOSURE_SERIES.slice(-days).map(p => ({
      ...p,
      date: p.date.slice(5),
    }));
  }, [range]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">EXPOSURES</div>
          <div className="page-subtitle">LMV / SMV / GMV / NMV time series &amp; snapshots</div>
        </div>
        <div className="btn-group">
          {Object.keys(RANGES).map(r => (
            <button key={r} className={`btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Time series */}
        <div className="panel" style={{ height: 280 }}>
          <div className="panel-hdr">
            <span className="panel-title">PORTFOLIO EXPOSURE — TIME SERIES</span>
            <span className="panel-meta">GMV | NMV | LMV | SMV</span>
          </div>
          <div className="panel-body" style={{ height: 240, padding: '8px 4px 4px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} interval={Math.floor(chartData.length / 6)} />
                <YAxis tickFormatter={(v: number) => fmtUSD(v, 0)} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
                <Tooltip formatter={(v: unknown) => fmtUSD(Number(v))} contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font)' }} />
                <Line type="monotone" dataKey="gmv"  stroke="var(--orange)"  dot={false} strokeWidth={2}   name="GMV" />
                <Line type="monotone" dataKey="lmv"  stroke="var(--green)"   dot={false} strokeWidth={1.5} name="LMV" />
                <Line type="monotone" dataKey="smv"  stroke="var(--red)"     dot={false} strokeWidth={1.5} name="SMV" />
                <Line type="monotone" dataKey="nmv"  stroke="var(--cyan)"    dot={false} strokeWidth={1.5} name="NMV" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coming soon sub-sections */}
        <div className="placeholder-grid">
          {[
            ['DIST', 'LMV / SMV Normal Distribution Bell Curves with σ markers'],
            ['BUBBLE', 'Manager Exposure Bubble Chart (SMV ↔ LMV, bubble = GMV)'],
            ['CEFI', 'CeFi Static Snapshot — Horizontal bars & pie by exchange / asset'],
            ['DEFI', 'DeFi Static Snapshot — Channels, LP positions, impermanent loss'],
            ['VOL', 'Volume Analysis — Exchange, manager & portfolio volumes'],
            ['TURN', 'Turnover Analysis — Daily account balance turnover per manager'],
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
