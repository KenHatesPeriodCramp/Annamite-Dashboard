import {
  FACTOR_SERIES, MANAGERS, fmtPct,
} from '../data/mockData';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line, ReferenceLine,
} from 'recharts';
import { useMemo, useState } from 'react';

const RANGES: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '18M': 455 };

const FACTOR_COLORS: Record<string, string> = {
  marketFactor: '#FF6600',
  styleFactor:  '#00D4D4',
  cryptoFactor: '#FFD020',
  macroFactor:  '#9966FF',
  alpha:        '#00C851',
  error:        '#6a8090',
};

const FACTOR_LABELS: Record<string, string> = {
  marketFactor: 'Market β',
  styleFactor:  'Style',
  cryptoFactor: 'Crypto',
  macroFactor:  'Macro',
  alpha:        'Alpha α',
  error:        'Error ε',
};

export default function MultifactorAnalysis() {
  const [range, setRange] = useState('6M');

  // Resample to weekly for bar chart readability
  const attrData = useMemo(() => {
    const days = RANGES[range];
    const slice = FACTOR_SERIES.slice(-days);
    // Group into weeks
    const weeks: typeof slice = [];
    for (let i = 0; i < slice.length; i += 7) {
      const chunk = slice.slice(i, i + 7);
      const avg = (key: keyof typeof chunk[0]) =>
        chunk.reduce((s, r) => s + (r[key] as number), 0);
      weeks.push({
        date:        chunk[chunk.length - 1].date.slice(5),
        alpha:       +avg('alpha').toFixed(5),
        marketFactor:+avg('marketFactor').toFixed(5),
        styleFactor: +avg('styleFactor').toFixed(5),
        cryptoFactor:+avg('cryptoFactor').toFixed(5),
        macroFactor: +avg('macroFactor').toFixed(5),
        error:       +avg('error').toFixed(5),
      });
    }
    return weeks;
  }, [range]);

  // Cumulative factor returns
  const cumFactorData = useMemo(() => {
    const days = RANGES[range];
    const slice = FACTOR_SERIES.slice(-days);
    const keys = ['alpha','marketFactor','styleFactor','cryptoFactor','macroFactor'] as const;
    const cum: Record<string, number> = Object.fromEntries(keys.map(k => [k, 0]));
    return slice.map(p => {
      const row: Record<string, number | string> = { date: p.date.slice(5) };
      for (const k of keys) {
        cum[k] += p[k];
        row[k] = +cum[k].toFixed(5);
      }
      return row;
    });
  }, [range]);

  // Current factor exposures (average of last 30 days)
  const factorExposures = useMemo(() => {
    const slice = FACTOR_SERIES.slice(-30);
    const keys = ['marketFactor','styleFactor','cryptoFactor','macroFactor','alpha'] as const;
    return MANAGERS.map(m => {
      return {
        name: m.shortName,
        color: m.color,
        ...Object.fromEntries(keys.map(k => [
          k,
          +(slice.reduce((s, r) => s + r[k], 0) / slice.length * (0.8 + Math.random() * 0.4)).toFixed(4),
        ])),
      };
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="page-title">MULTIFACTOR ANALYSIS</div>
          <div className="page-subtitle">Rₚ = α + F₁X₁ + F₂X₂ + F₃X₃ + ... + Fₙ Xₙ + εₙ</div>
        </div>
        <div className="btn-group">
          {Object.keys(RANGES).map(r => (
            <button key={r} className={`btn${range === r ? ' active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Factor equation */}
        <div className="panel">
          <div className="panel-hdr"><span className="panel-title">FACTOR MODEL DEFINITION</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
            {[
              { label: 'F₁ MARKET',  desc: 'Broad crypto market β exposure',     color: FACTOR_COLORS.marketFactor },
              { label: 'F₂ STYLE',   desc: 'Momentum / value / size tilt',       color: FACTOR_COLORS.styleFactor  },
              { label: 'F₃ CRYPTO',  desc: 'Crypto-specific systematic risk',    color: FACTOR_COLORS.cryptoFactor },
              { label: 'F₄ MACRO',   desc: 'Rates / FX / risk-on-off sentiment', color: FACTOR_COLORS.macroFactor  },
              { label: 'α ALPHA',    desc: 'Manager-specific idiosyncratic ret.', color: FACTOR_COLORS.alpha        },
            ].map(item => (
              <div key={item.label} className="metric-card">
                <span className="metric-label">{item.label}</span>
                <span style={{ color: item.color, fontSize: 'var(--font-sm)', fontWeight: 'bold' }}>●</span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attribution waterfall (stacked bar) */}
        <div className="panel" style={{ height: 240 }}>
          <div className="panel-hdr">
            <span className="panel-title">WEEKLY RETURN ATTRIBUTION</span>
          </div>
          <div style={{ height: 200, padding: '4px 4px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attrData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }} stackOffset="sign">
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} interval={Math.floor(attrData.length / 6)} />
                <YAxis tickFormatter={(v: number) => fmtPct(v, 1)} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
                <ReferenceLine y={0} stroke="var(--border-bright)" />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [fmtPct(Number(v), 3), FACTOR_LABELS[String(name)] ?? String(name)]}
                  contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }}
                />
                {Object.keys(FACTOR_COLORS).filter(k => k !== 'error').map(k => (
                  <Bar key={k} dataKey={k} stackId="a" fill={FACTOR_COLORS[k]} name={k} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative factor returns */}
        <div className="panel" style={{ height: 220 }}>
          <div className="panel-hdr"><span className="panel-title">CUMULATIVE FACTOR RETURNS</span></div>
          <div style={{ height: 180, padding: '4px 4px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumFactorData} margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} interval={Math.floor(cumFactorData.length / 6)} />
                <YAxis tickFormatter={(v: number) => fmtPct(v, 0)} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [fmtPct(Number(v)), FACTOR_LABELS[String(name)] ?? String(name)]}
                  contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }}
                />
                {(['alpha','marketFactor','styleFactor','cryptoFactor','macroFactor'] as const).map(k => (
                  <Line key={k} type="monotone" dataKey={k} stroke={FACTOR_COLORS[k]} dot={false} strokeWidth={1.5} name={k} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-manager factor exposures */}
        <div className="panel">
          <div className="panel-hdr">
            <span className="panel-title">MANAGER FACTOR EXPOSURES — 30D AVG LOADING</span>
          </div>
          <div style={{ height: 200, padding: '4px 4px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorExposures} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 56 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                <XAxis type="number" tickFormatter={(v: number) => fmtPct(v, 1)} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
                <ReferenceLine x={0} stroke="var(--border-bright)" />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [fmtPct(Number(v), 3), FACTOR_LABELS[String(name)] ?? String(name)]}
                  contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }}
                />
                {(['marketFactor','styleFactor','cryptoFactor','macroFactor','alpha'] as const).map(k => (
                  <Bar key={k} dataKey={k} stackId="a" fill={FACTOR_COLORS[k]} name={k} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
