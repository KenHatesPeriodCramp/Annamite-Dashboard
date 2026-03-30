import {
  FACTOR_SERIES, MANAGERS, fmtPct,
} from '../data/mockData';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line, ReferenceLine,
  PieChart, Pie, Cell,
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

  // Systematic vs Idiosyncratic risk decomposition
  const riskDecomp = useMemo(() => {
    const d = RANGES[range];
    const slice = FACTOR_SERIES.slice(-d);
    if (slice.length === 0) return [];
    const keys = ['marketFactor', 'styleFactor', 'cryptoFactor', 'macroFactor', 'alpha', 'error'] as const;
    const labels = ['Market β', 'Style', 'Crypto', 'Macro', 'Alpha α', 'Residual ε'];
    const fills  = [FACTOR_COLORS.marketFactor, FACTOR_COLORS.styleFactor, FACTOR_COLORS.cryptoFactor, FACTOR_COLORS.macroFactor, FACTOR_COLORS.alpha, FACTOR_COLORS.error];
    const variances = keys.map(k => {
      const arr = slice.map(p => p[k]);
      const m = arr.reduce((s, v) => s + v, 0) / arr.length;
      return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
    });
    const totalVar = variances.reduce((s, v) => s + v, 0);
    return keys.map((_, i) => ({
      name:  labels[i],
      value: +(variances[i] / totalVar * 100).toFixed(1),
      fill:  fills[i],
    }));
  }, [range]);

  // Factor period-total contribution (waterfall summary)
  const factorSummary = useMemo(() => {
    const d = RANGES[range];
    const slice = FACTOR_SERIES.slice(-d);
    const keys = ['marketFactor', 'styleFactor', 'cryptoFactor', 'macroFactor', 'alpha'] as const;
    return keys
      .map(k => ({
        name:  FACTOR_LABELS[k] ?? k,
        value: +(slice.reduce((s, p) => s + p[k], 0) * 100).toFixed(2),
        fill:  FACTOR_COLORS[k],
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [range]);

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

        {/* Systematic vs Idiosyncratic risk decomposition + Factor period summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 8 }}>

          {/* Risk decomposition donut */}
          <div className="panel">
            <div className="panel-hdr">
              <span className="panel-title">RISK DECOMPOSITION</span>
              <span className="panel-meta">variance attribution</span>
            </div>
            <div style={{ height: 200, display: 'flex', alignItems: 'center' }}>
              <ResponsiveContainer width="52%" height="100%">
                <PieChart>
                  <Pie data={riskDecomp} dataKey="value" cx="50%" cy="50%" outerRadius={72} innerRadius={36} paddingAngle={2}>
                    {riskDecomp.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }}
                    formatter={(v: unknown) => [`${v}%`]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, paddingRight: 8 }}>
                {riskDecomp.map(item => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-data)', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: item.fill, marginRight: 5 }} />
                      {item.name}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-data)', color: item.fill, fontWeight: 'bold' }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Factor period-total contribution */}
          <div className="panel">
            <div className="panel-hdr">
              <span className="panel-title">FACTOR CONTRIBUTION — PERIOD TOTAL</span>
              <span className="panel-meta">cumulative P&amp;L by factor</span>
            </div>
            <div style={{ height: 200, padding: '8px 4px 4px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorSummary} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => `${v.toFixed(1)}%`} tick={{ fill: 'var(--text-dim)', fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} width={68} />
                  <ReferenceLine x={0} stroke="var(--border-bright)" />
                  <Tooltip contentStyle={{ background: 'var(--bg-panel-hdr)', border: '1px solid var(--border-bright)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 11 }}
                    formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`, 'Contribution']} />
                  <Bar dataKey="value" maxBarSize={20}>
                    {factorSummary.map((entry, i) => <Cell key={i} fill={entry.value >= 0 ? entry.fill : `${entry.fill}99`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

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
