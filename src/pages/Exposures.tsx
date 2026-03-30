import { EXPOSURE_SERIES, MANAGERS, TRADES, fmtUSD } from '../data/mockData';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
  ScatterChart, Scatter, ZAxis,
  BarChart, Bar, Cell,
  PieChart, Pie,
} from 'recharts';
import { useMemo, useState } from 'react';

const RANGES: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '18M': 455 };

const TT = {
  background: 'var(--bg-panel-hdr)',
  border: '1px solid var(--border-bright)',
  color: 'var(--text)',
  fontFamily: 'var(--font)',
  fontSize: 11,
};

const TICK = { fill: 'var(--text-dim)', fontSize: 9 };

const LP_POSITIONS = [
  { pair: 'ETH/USDC', protocol: 'Uniswap v3', alloc: 35, il: 2.4 },
  { pair: 'BTC/USDT', protocol: 'Curve',       alloc: 25, il: 0.8 },
  { pair: 'SOL/USDC', protocol: 'Orca',         alloc: 20, il: 4.1 },
  { pair: 'ETH/BTC',  protocol: 'Uniswap v3',  alloc: 12, il: 1.8 },
  { pair: 'Other',    protocol: '—',             alloc:  8, il: 0.3 },
];

export default function Exposures() {
  const [range, setRange] = useState('6M');

  const chartData = useMemo(() => {
    const days = RANGES[range];
    return EXPOSURE_SERIES.slice(-days).map(p => ({ ...p, date: p.date.slice(5) }));
  }, [range]);

  // ── Bell-curve distribution data ─────────────────────────────────────────
  const { bellPts, lmvSt, smvSt } = useMemo(() => {
    const stat = (arr: number[]) => {
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      return { mean: m, std: Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) };
    };
    const lmvSt = stat(EXPOSURE_SERIES.map(p => p.lmv));
    const smvSt = stat(EXPOSURE_SERIES.map(p => Math.abs(p.smv)));
    const gauss = (x: number, m: number, s: number) =>
      Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
    const lmvPk = gauss(lmvSt.mean, lmvSt.mean, lmvSt.std);
    const smvPk = gauss(smvSt.mean, smvSt.mean, smvSt.std);
    const xMin = Math.min(lmvSt.mean - 3.5 * lmvSt.std, smvSt.mean - 3.5 * smvSt.std);
    const xMax = Math.max(lmvSt.mean + 3.5 * lmvSt.std, smvSt.mean + 3.5 * smvSt.std);
    const bellPts = Array.from({ length: 121 }, (_, i) => {
      const x = xMin + (xMax - xMin) * i / 120;
      return {
        x: +(x / 1e6).toFixed(2),
        lmv: +(gauss(x, lmvSt.mean, lmvSt.std) / lmvPk).toFixed(4),
        smv: +(gauss(x, smvSt.mean, smvSt.std) / smvPk).toFixed(4),
      };
    });
    return { bellPts, lmvSt, smvSt };
  }, []);

  // ── Volume & turnover data (trades-derived) ───────────────────────────────
  const { volByExch, volByMgr, turnData } = useMemo(() => {
    const em: Record<string, number> = {};
    const mm: Record<string, number> = {};
    for (const t of TRADES) {
      em[t.exchange] = (em[t.exchange] || 0) + t.sizeUsd;
      mm[t.managerId] = (mm[t.managerId] || 0) + t.sizeUsd;
    }
    return {
      volByExch: Object.entries(em)
        .map(([name, vol]) => ({ name, vol: +(vol / 1e6).toFixed(2) }))
        .sort((a, b) => b.vol - a.vol),
      volByMgr: MANAGERS
        .map(m => ({ name: m.shortName, vol: +((mm[m.id] || 0) / 1e6).toFixed(2), fill: m.color }))
        .sort((a, b) => b.vol - a.vol),
      turnData: MANAGERS
        .map(m => ({ name: m.shortName, turn: +((mm[m.id] || 0) / m.aum).toFixed(3), fill: m.color }))
        .sort((a, b) => b.turn - a.turn),
    };
  }, []);

  // ── CeFi / DeFi static data ───────────────────────────────────────────────
  const cefiMgrs = MANAGERS.filter(m => m.type === 'CeFi');
  const defiMgrs = MANAGERS.filter(m => m.type === 'DeFi');
  const cefiBar  = cefiMgrs.map(m => ({ name: m.shortName, LMV: +(m.lmv / 1e6).toFixed(1), SMV: +(Math.abs(m.smv) / 1e6).toFixed(1) }));
  const defiBar  = defiMgrs.map(m => ({ name: m.shortName, LMV: +(m.lmv / 1e6).toFixed(1), SMV: +(Math.abs(m.smv) / 1e6).toFixed(1) }));
  const cefiPie  = cefiMgrs.map(m => ({ name: m.shortName, value: +(m.aum / 1e6).toFixed(1), fill: m.color }));
  const defiPie  = defiMgrs.map(m => ({ name: m.shortName, value: +(m.aum / 1e6).toFixed(1), fill: m.color }));

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

        {/* ── Portfolio exposure time series ────────────────────────────── */}
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
                <Tooltip formatter={(v: unknown) => fmtUSD(Number(v))} contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font)' }} />
                <Line type="monotone" dataKey="gmv" stroke="var(--orange)" dot={false} strokeWidth={2}   name="GMV" />
                <Line type="monotone" dataKey="lmv" stroke="var(--green)"  dot={false} strokeWidth={1.5} name="LMV" />
                <Line type="monotone" dataKey="smv" stroke="var(--red)"    dot={false} strokeWidth={1.5} name="SMV" />
                <Line type="monotone" dataKey="nmv" stroke="var(--cyan)"   dot={false} strokeWidth={1.5} name="NMV" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Sub-chart grid (2 × 3) ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

          {/* DIST — Normal distribution bell curves */}
          <div className="panel" style={{ height: 260 }}>
            <div className="panel-hdr">
              <span className="panel-title">LMV / |SMV| — DISTRIBUTION</span>
              <span className="panel-meta">normalized PDF · σ markers</span>
            </div>
            <div className="panel-body" style={{ height: 220, padding: '8px 4px 4px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bellPts} margin={{ top: 4, right: 12, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} tickCount={6}
                    tickFormatter={(v: number) => `$${v}M`} tick={TICK} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={TT}
                    formatter={(v: unknown, name: unknown) => [
                      `${(Number(v) * 100).toFixed(1)}%`,
                      name === 'lmv' ? 'LMV density' : '|SMV| density',
                    ]}
                    labelFormatter={(l: unknown) => `$${l}M`}
                  />
                  {/* LMV σ markers */}
                  {[-1, 0, 1].map(n => (
                    <ReferenceLine key={`l${n}`}
                      x={+((lmvSt.mean + n * lmvSt.std) / 1e6).toFixed(2)}
                      stroke="var(--green)" strokeDasharray="3 3" strokeOpacity={0.7}
                      label={{ value: n === 0 ? 'μ_L' : `${n > 0 ? '+' : ''}${n}σL`, fill: 'var(--green)', fontSize: 8, position: 'insideTopLeft' }}
                    />
                  ))}
                  {/* |SMV| σ markers */}
                  {[-1, 0, 1].map(n => (
                    <ReferenceLine key={`s${n}`}
                      x={+((smvSt.mean + n * smvSt.std) / 1e6).toFixed(2)}
                      stroke="var(--red)" strokeDasharray="3 3" strokeOpacity={0.7}
                      label={{ value: n === 0 ? 'μ_S' : `${n > 0 ? '+' : ''}${n}σS`, fill: 'var(--red)', fontSize: 8, position: 'insideTopRight' }}
                    />
                  ))}
                  <Line type="monotone" dataKey="lmv" stroke="var(--green)" dot={false} strokeWidth={2} name="LMV" />
                  <Line type="monotone" dataKey="smv" stroke="var(--red)"   dot={false} strokeWidth={2} name="|SMV|" />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BUBBLE — Manager exposure scatter */}
          <div className="panel" style={{ height: 260 }}>
            <div className="panel-hdr">
              <span className="panel-title">MANAGER EXPOSURE BUBBLE</span>
              <span className="panel-meta">LMV vs |SMV| · bubble = GMV</span>
            </div>
            <div className="panel-body" style={{ height: 220, padding: '8px 4px 20px 8px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 4, right: 12, bottom: 20, left: 8 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                  <XAxis type="number" dataKey="lmv" name="LMV"
                    tickFormatter={(v: number) => `$${v}M`} tick={TICK} tickLine={false}
                    label={{ value: 'LMV ($M)', position: 'insideBottom', offset: -10, fill: 'var(--text-dim)', fontSize: 9 }} />
                  <YAxis type="number" dataKey="smv" name="|SMV|"
                    tickFormatter={(v: number) => `$${v}M`} tick={TICK} tickLine={false} axisLine={false} width={44}
                    label={{ value: '|SMV| ($M)', angle: -90, position: 'insideLeft', fill: 'var(--text-dim)', fontSize: 9 }} />
                  <ZAxis type="number" dataKey="gmv" range={[300, 2200]} name="GMV" />
                  <Tooltip contentStyle={TT} cursor={{ strokeDasharray: '3 3' }}
                    formatter={(v: unknown) => `$${Number(v).toFixed(1)}M`} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font)' }} />
                  {MANAGERS.map(m => (
                    <Scatter key={m.id} name={m.shortName}
                      data={[{
                        lmv: +(m.lmv / 1e6).toFixed(1),
                        smv: +(Math.abs(m.smv) / 1e6).toFixed(1),
                        gmv: +((m.lmv + Math.abs(m.smv)) / 1e6).toFixed(1),
                      }]}
                      fill={m.color} opacity={0.85}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CEFI — CeFi static snapshot */}
          <div className="panel" style={{ height: 260 }}>
            <div className="panel-hdr">
              <span className="panel-title">CeFi SNAPSHOT</span>
              <span className="panel-meta">LMV / |SMV| by manager · AUM allocation</span>
            </div>
            <div className="panel-body" style={{ height: 220, display: 'flex', gap: 4 }}>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cefiBar} margin={{ top: 4, right: 8, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={TICK} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => `$${v}M`} tick={TICK} tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={TT} formatter={(v: unknown) => `$${v}M`} />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'var(--font)' }} />
                    <Bar dataKey="LMV" fill="var(--green)" opacity={0.8} maxBarSize={20} />
                    <Bar dataKey="SMV" fill="var(--red)"   opacity={0.8} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ width: 110, paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cefiPie} dataKey="value" cx="50%" cy="45%" outerRadius={45} innerRadius={22} paddingAngle={2}>
                      {cefiPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v: unknown) => `$${v}M AUM`} />
                    <Legend wrapperStyle={{ fontSize: 8, fontFamily: 'var(--font)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* DEFI — DeFi static snapshot */}
          <div className="panel" style={{ height: 260 }}>
            <div className="panel-hdr">
              <span className="panel-title">DeFi SNAPSHOT</span>
              <span className="panel-meta">LP positions · impermanent loss</span>
            </div>
            <div className="panel-body" style={{ height: 220, display: 'flex', gap: 8, padding: '8px 8px 4px 8px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 80 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={defiBar} margin={{ top: 2, right: 8, bottom: 2, left: 0 }}>
                      <XAxis dataKey="name" tick={TICK} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => `$${v}M`} tick={TICK} tickLine={false} axisLine={false} width={36} />
                      <Tooltip contentStyle={TT} formatter={(v: unknown) => `$${v}M`} />
                      <Bar dataKey="LMV" fill="var(--green)" opacity={0.8} maxBarSize={24} />
                      <Bar dataKey="SMV" fill="var(--red)"   opacity={0.8} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 9, fontFamily: 'var(--font-data)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)' }}>
                        <th style={{ textAlign: 'left',  padding: '2px 4px' }}>PAIR</th>
                        <th style={{ textAlign: 'left',  padding: '2px 4px' }}>PROTOCOL</th>
                        <th style={{ textAlign: 'right', padding: '2px 4px' }}>ALLOC%</th>
                        <th style={{ textAlign: 'right', padding: '2px 4px' }}>IL%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LP_POSITIONS.map(p => (
                        <tr key={p.pair} style={{ color: 'var(--text)', borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '2px 4px' }}>{p.pair}</td>
                          <td style={{ padding: '2px 4px', color: 'var(--text-muted)' }}>{p.protocol}</td>
                          <td style={{ textAlign: 'right', padding: '2px 4px' }}>{p.alloc}%</td>
                          <td style={{ textAlign: 'right', padding: '2px 4px', color: p.il > 2 ? 'var(--red)' : 'var(--text-dim)' }}>{p.il}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ width: 90 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={defiPie} dataKey="value" cx="50%" cy="40%" outerRadius={35} innerRadius={18} paddingAngle={3}>
                      {defiPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={TT} formatter={(v: unknown) => `$${v}M AUM`} />
                    <Legend wrapperStyle={{ fontSize: 8, fontFamily: 'var(--font)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* VOL — Volume analysis */}
          <div className="panel" style={{ height: 260 }}>
            <div className="panel-hdr">
              <span className="panel-title">VOLUME ANALYSIS</span>
              <span className="panel-meta">by exchange &amp; manager · $M</span>
            </div>
            <div className="panel-body" style={{ height: 220, display: 'flex', gap: 4 }}>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-data)', paddingLeft: 8, paddingBottom: 2 }}>BY EXCHANGE</div>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={volByExch} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => `$${v}M`} tick={TICK} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={TICK} tickLine={false} width={50} />
                    <Tooltip contentStyle={TT} formatter={(v: unknown) => [`$${v}M`, 'Volume']} />
                    <Bar dataKey="vol" fill="var(--cyan)" opacity={0.8} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-data)', paddingLeft: 8, paddingBottom: 2 }}>BY MANAGER</div>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={volByMgr} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v: number) => `$${v}M`} tick={TICK} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={TICK} tickLine={false} width={50} />
                    <Tooltip contentStyle={TT} formatter={(v: unknown) => [`$${v}M`, 'Volume']} />
                    <Bar dataKey="vol" maxBarSize={16}>
                      {volByMgr.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TURN — Turnover analysis */}
          <div className="panel" style={{ height: 260 }}>
            <div className="panel-hdr">
              <span className="panel-title">TURNOVER ANALYSIS</span>
              <span className="panel-meta">traded volume / AUM per manager</span>
            </div>
            <div className="panel-body" style={{ height: 220, padding: '8px 4px 4px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnData} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} tick={TICK} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={TICK} tickLine={false} width={52} />
                  <Tooltip contentStyle={TT} formatter={(v: unknown) => [`${(Number(v) * 100).toFixed(1)}%`, 'Turnover']} />
                  <Bar dataKey="turn" maxBarSize={20}>
                    {turnData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
