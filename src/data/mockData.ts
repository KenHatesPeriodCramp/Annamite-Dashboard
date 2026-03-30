/* ============================================================
   ANNAMITE CAPITAL — Mock Data
   All values are illustrative. Replace with live API feeds.
   ============================================================ */

// ── Seeded PRNG (Mulberry32) ──────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Normal distribution (Box-Muller) ─────────────────────
function normal(rng: () => number, mean: number, std: number): number {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

// ── Date helpers ──────────────────────────────────────────
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Manager definitions ───────────────────────────────────
export type ManagerType = 'CeFi' | 'DeFi';

export interface Manager {
  id: string;
  name: string;
  shortName: string;
  type: ManagerType;
  strategy: string;
  color: string;
  aum: number;          // USD
  targetAlloc: number;  // fraction of portfolio
  // Simulated annual parameters
  annualMean: number;   // e.g. 0.20 = 20%
  annualVol: number;    // e.g. 0.15 = 15%
  // Current exposure
  lmv: number;
  smv: number;
  leverage: number;
  status: 'NORMAL' | 'WATCH' | 'ALERT';
}

export const MANAGERS: Manager[] = [
  {
    id: 'M1', name: 'Quantum Alpha',   shortName: 'QALPHA',
    type: 'CeFi', strategy: 'Market Neutral', color: '#FF9240',
    aum: 12_500_000, targetAlloc: 0.25,
    annualMean: 0.18, annualVol: 0.12,
    lmv: 11_200_000, smv: -9_100_000, leverage: 1.63,
    status: 'NORMAL',
  },
  {
    id: 'M2', name: 'Delta Sigma',     shortName: 'DSIGMA',
    type: 'CeFi', strategy: 'Long / Short', color: '#4488FF',
    aum: 10_000_000, targetAlloc: 0.20,
    annualMean: 0.24, annualVol: 0.18,
    lmv: 12_400_000, smv: -9_800_000, leverage: 2.22,
    status: 'WATCH',
  },
  {
    id: 'M3', name: 'Nexus DeFi',      shortName: 'NEXDEF',
    type: 'DeFi', strategy: 'Yield Arb', color: '#00C851',
    aum: 9_000_000, targetAlloc: 0.18,
    annualMean: 0.16, annualVol: 0.14,
    lmv: 8_200_000, smv: -4_100_000, leverage: 1.37,
    status: 'NORMAL',
  },
  {
    id: 'M4', name: 'Apex Capital',    shortName: 'APXCAP',
    type: 'CeFi', strategy: 'Momentum', color: '#FFD020',
    aum: 8_500_000, targetAlloc: 0.17,
    annualMean: 0.32, annualVol: 0.26,
    lmv: 10_500_000, smv: -5_200_000, leverage: 1.85,
    status: 'WATCH',
  },
  {
    id: 'M5', name: 'Chain Vest',      shortName: 'CHNVST',
    type: 'DeFi', strategy: 'LP Strategy', color: '#9966FF',
    aum: 6_000_000, targetAlloc: 0.12,
    annualMean: 0.12, annualVol: 0.10,
    lmv: 5_100_000, smv: -2_200_000, leverage: 1.22,
    status: 'NORMAL',
  },
  {
    id: 'M6', name: 'Aurora Fund',     shortName: 'AURORA',
    type: 'CeFi', strategy: 'Relative Value', color: '#FF33CC',
    aum: 4_000_000, targetAlloc: 0.08,
    annualMean: 0.20, annualVol: 0.16,
    lmv: 4_800_000, smv: -3_100_000, leverage: 1.98,
    status: 'ALERT',
  },
];

export const TOTAL_NAV = MANAGERS.reduce((s, m) => s + m.aum, 0); // 50_000_000

// ── Portfolio-level exposure snapshot ────────────────────
export const PORTFOLIO_EXPOSURE = {
  lmv:      MANAGERS.reduce((s, m) => s + m.lmv, 0),
  smv:      MANAGERS.reduce((s, m) => s + m.smv, 0),
  get gmv() { return this.lmv + Math.abs(this.smv); },
  get nmv() { return this.lmv + this.smv; },
  get leverage() { return this.gmv / TOTAL_NAV; },
};

// ── Time-series return generator ──────────────────────────
export interface ReturnPoint {
  date: string;
  portfolio: number;  // cumulative return as decimal
  M1: number;
  M2: number;
  M3: number;
  M4: number;
  M5: number;
  M6: number;
  BTC: number;
  ETH: number;
}

function generateReturnSeries(): ReturnPoint[] {
  const rng = mulberry32(20250101);
  const START = new Date('2025-01-01');
  const DAYS  = 455; // Jan 1, 2025 → Mar 31, 2026

  // daily drift & vol for each series (annualized → daily)
  const D = 252;
  const params: Record<string, [number, number]> = {
    M1:  [0.18 / D, 0.12 / Math.sqrt(D)],
    M2:  [0.24 / D, 0.18 / Math.sqrt(D)],
    M3:  [0.16 / D, 0.14 / Math.sqrt(D)],
    M4:  [0.32 / D, 0.26 / Math.sqrt(D)],
    M5:  [0.12 / D, 0.10 / Math.sqrt(D)],
    M6:  [0.20 / D, 0.16 / Math.sqrt(D)],
    BTC: [0.55 / D, 0.65 / Math.sqrt(D)],
    ETH: [0.42 / D, 0.75 / Math.sqrt(D)],
  };

  const cumRet: Record<string, number> = {
    M1: 1, M2: 1, M3: 1, M4: 1, M5: 1, M6: 1, BTC: 1, ETH: 1,
  };

  const weights = MANAGERS.reduce((acc, m) => {
    acc[m.id] = m.targetAlloc;
    return acc;
  }, {} as Record<string, number>);

  const result: ReturnPoint[] = [];

  for (let i = 0; i < DAYS; i++) {
    const date = fmtDate(addDays(START, i));

    for (const key of Object.keys(params)) {
      const [mu, sig] = params[key];
      const r = normal(rng, mu, sig);
      cumRet[key] *= (1 + r);
    }

    // portfolio = weighted sum of manager cumulative returns
    const portCum =
      weights.M1 * cumRet.M1 +
      weights.M2 * cumRet.M2 +
      weights.M3 * cumRet.M3 +
      weights.M4 * cumRet.M4 +
      weights.M5 * cumRet.M5 +
      weights.M6 * cumRet.M6;

    result.push({
      date,
      portfolio: +(portCum - 1).toFixed(5),
      M1: +(cumRet.M1 - 1).toFixed(5),
      M2: +(cumRet.M2 - 1).toFixed(5),
      M3: +(cumRet.M3 - 1).toFixed(5),
      M4: +(cumRet.M4 - 1).toFixed(5),
      M5: +(cumRet.M5 - 1).toFixed(5),
      M6: +(cumRet.M6 - 1).toFixed(5),
      BTC: +(cumRet.BTC - 1).toFixed(5),
      ETH: +(cumRet.ETH - 1).toFixed(5),
    });
  }
  return result;
}

export const RETURN_SERIES = generateReturnSeries();

// ── Current stats derived from series ────────────────────
const last  = RETURN_SERIES[RETURN_SERIES.length - 1];
const ytdIdx = RETURN_SERIES.findIndex(p => p.date >= '2026-01-01');
const ytdBase = ytdIdx > 0 ? RETURN_SERIES[ytdIdx - 1] : RETURN_SERIES[0];

function ytd(key: keyof ReturnPoint): number {
  const base = (ytdBase[key] as number) + 1;
  const curr = (last[key] as number) + 1;
  return +(curr / base - 1).toFixed(5);
}

function m1(key: keyof ReturnPoint): number {
  const idx30 = RETURN_SERIES.length - 31;
  const base  = (RETURN_SERIES[Math.max(0, idx30)][key] as number) + 1;
  const curr  = (last[key] as number) + 1;
  return +(curr / base - 1).toFixed(5);
}

// Max drawdown from series
function maxDD(key: keyof ReturnPoint): number {
  let peak = -Infinity;
  let dd   = 0;
  for (const p of RETURN_SERIES) {
    const v = (p[key] as number) + 1;
    if (v > peak) peak = v;
    const cur = (peak - v) / peak;
    if (cur > dd) dd = cur;
  }
  return +(-dd).toFixed(5);
}

// Annualised Sharpe (simple, rf=0)
function sharpe(key: keyof ReturnPoint): number {
  const rets: number[] = [];
  for (let i = 1; i < RETURN_SERIES.length; i++) {
    const prev = (RETURN_SERIES[i - 1][key] as number) + 1;
    const curr = (RETURN_SERIES[i][key] as number) + 1;
    rets.push(curr / prev - 1);
  }
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length;
  const annualRet = Math.pow(1 + mean, 252) - 1;
  const annualVol = Math.sqrt(variance * 252);
  return +(annualRet / annualVol).toFixed(2);
}

// Sortino Ratio (downside deviation denominator, rf=0)
function sortino(key: keyof ReturnPoint): number {
  const rets: number[] = [];
  for (let i = 1; i < RETURN_SERIES.length; i++) {
    const prev = (RETURN_SERIES[i - 1][key] as number) + 1;
    const curr = (RETURN_SERIES[i][key] as number) + 1;
    rets.push(curr / prev - 1);
  }
  const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
  const annualRet = Math.pow(1 + mean, 252) - 1;
  const downVarAnn = rets.filter(r => r < 0).reduce((s, r) => s + r ** 2, 0) / rets.length * 252;
  const downDev = Math.sqrt(downVarAnn);
  return downDev === 0 ? 0 : +(annualRet / downDev).toFixed(2);
}

// Calmar Ratio (CAGR / |Max Drawdown|)
function calmar(key: keyof ReturnPoint): number {
  const dd = Math.abs(maxDD(key));
  if (dd === 0) return 0;
  const totalR = (last[key] as number) + 1;
  const years = RETURN_SERIES.length / 252;
  const cagr = Math.pow(totalR, 1 / years) - 1;
  return +(cagr / dd).toFixed(2);
}

export interface ManagerStats {
  id: string;
  ytd: number;
  m1: number;
  totalReturn: number;
  maxDD: number;
  sharpe: number;
  sortino: number;
  calmar: number;
}

const STAT_KEYS: Record<string, keyof ReturnPoint> = {
  M1: 'M1', M2: 'M2', M3: 'M3', M4: 'M4', M5: 'M5', M6: 'M6',
  portfolio: 'portfolio', BTC: 'BTC', ETH: 'ETH',
};

export const MANAGER_STATS: Record<string, ManagerStats> = Object.fromEntries(
  ['M1','M2','M3','M4','M5','M6','portfolio','BTC','ETH'].map(id => {
    const k = STAT_KEYS[id];
    return [id, {
      id,
      ytd:         ytd(k),
      m1:          m1(k),
      totalReturn: last[k] as number,
      maxDD:       maxDD(k),
      sharpe:      sharpe(k),
      sortino:     sortino(k),
      calmar:      calmar(k),
    }];
  })
);

// ── Exposure time series ──────────────────────────────────
export interface ExposurePoint {
  date: string;
  lmv: number;
  smv: number;
  gmv: number;
  nmv: number;
}

function generateExposureSeries(): ExposurePoint[] {
  const rng  = mulberry32(99991);
  const START = new Date('2025-01-01');
  const BASE_LMV = 48_000_000;
  const BASE_SMV = -32_000_000;
  const result: ExposurePoint[] = [];
  let lmv = BASE_LMV, smv = BASE_SMV;
  for (let i = 0; i < 455; i++) {
    lmv = lmv * (1 + normal(rng, 0.0002, 0.01));
    smv = smv * (1 + normal(rng, 0.0001, 0.01));
    result.push({
      date: fmtDate(addDays(START, i)),
      lmv:  +lmv.toFixed(0),
      smv:  +smv.toFixed(0),
      gmv:  +(lmv + Math.abs(smv)).toFixed(0),
      nmv:  +(lmv + smv).toFixed(0),
    });
  }
  return result;
}

export const EXPOSURE_SERIES = generateExposureSeries();

// ── Trade blotter ─────────────────────────────────────────
export interface Trade {
  id: string;
  timestamp: string;
  managerId: string;
  pair: string;
  direction: 'Long' | 'Short';
  sizeUsd: number;
  pnlUsd: number;
  feesUsd: number;
  status: 'Open' | 'Closed';
  exchange: string;
}

const PAIRS   = ['BTC/USDT','ETH/USDT','SOL/USDT','BNB/USDT','ARB/USDT','OP/USDT','AVAX/USDT'];
const EXCHGS  = ['Binance','OKX','FalconX','DEX'];
const tradeRng = mulberry32(77777);

export const TRADES: Trade[] = Array.from({ length: 40 }, (_, i) => {
  const mgr  = MANAGERS[Math.floor(tradeRng() * MANAGERS.length)];
  const pair = PAIRS[Math.floor(tradeRng() * PAIRS.length)];
  const dir  = tradeRng() > 0.45 ? 'Long' : 'Short';
  const size = Math.round(tradeRng() * 2_000_000 + 100_000);
  const pnl  = Math.round((tradeRng() - 0.42) * 80_000);
  const fee  = Math.round(size * 0.001 * (0.5 + tradeRng()));
  const daysAgo = Math.floor(tradeRng() * 14);
  const d    = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(tradeRng() * 24), Math.floor(tradeRng() * 60), 0, 0);
  return {
    id:          `TRD-${1000 + i}`,
    timestamp:   d.toISOString(),
    managerId:   mgr.id,
    pair,
    direction:   dir as 'Long' | 'Short',
    sizeUsd:     size,
    pnlUsd:      pnl,
    feesUsd:     fee,
    status:      (tradeRng() > 0.35 ? 'Closed' : 'Open') as 'Open' | 'Closed',
    exchange:    EXCHGS[Math.floor(tradeRng() * EXCHGS.length)],
  };
}).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

// ── Trade statistics per manager ────────────────────────────
export interface ManagerTradeStats {
  managerId: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  payoffRatio: number;
  expectancy: number;
  profitFactor: number;
}

export const MANAGER_TRADE_STATS: Record<string, ManagerTradeStats> = Object.fromEntries(
  MANAGERS.map(m => {
    const trades = TRADES.filter(t => t.managerId === m.id);
    const wins   = trades.filter(t => t.pnlUsd > 0);
    const losses = trades.filter(t => t.pnlUsd < 0);
    const avgWin   = wins.length   > 0 ? wins.reduce((s, t) => s + t.pnlUsd, 0) / wins.length   : 0;
    const avgLoss  = losses.length > 0 ? losses.reduce((s, t) => s + t.pnlUsd, 0) / losses.length : 0;
    const winRate  = trades.length > 0 ? wins.length / trades.length : 0;
    const payoff   = Math.abs(avgLoss) > 0 ? Math.abs(avgWin) / Math.abs(avgLoss) : 0;
    const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;
    const grossWin  = wins.reduce((s, t) => s + t.pnlUsd, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlUsd, 0));
    const profitFactor = grossLoss > 0 ? grossWin / grossLoss : 0;
    return [m.id, {
      managerId:   m.id,
      totalTrades: trades.length,
      wins:        wins.length,
      losses:      losses.length,
      winRate:     +winRate.toFixed(3),
      avgWin:      +avgWin.toFixed(0),
      avgLoss:     +avgLoss.toFixed(0),
      payoffRatio: +payoff.toFixed(2),
      expectancy:  +expectancy.toFixed(0),
      profitFactor: +profitFactor.toFixed(2),
    }];
  })
);

// ── Margin / leverage per manager ─────────────────────────
export interface MarginData {
  managerId: string;
  leverageCurrent: number;
  leverageMax: number;
  marginUsedPct: number;       // 0-1
  distanceToMarginCall: number; // % drawdown
  distanceToLiquidation: number;
  exchange: string;
  collateralUsd: number;
  maintenanceMarginPct: number;
}

const marginRng = mulberry32(55555);

export const MARGIN_DATA: MarginData[] = MANAGERS.map(m => {
  const lev  = m.leverage;
  const mUpct = Math.min(0.95, lev / 4 + marginRng() * 0.15);
  return {
    managerId:              m.id,
    leverageCurrent:        +lev.toFixed(2),
    leverageMax:            4.0,
    marginUsedPct:          +mUpct.toFixed(3),
    distanceToMarginCall:   +(0.25 - mUpct * 0.2 + marginRng() * 0.05).toFixed(3),
    distanceToLiquidation:  +(0.12 - mUpct * 0.1 + marginRng() * 0.03).toFixed(3),
    exchange:               ['Binance','OKX','FalconX'][Math.floor(marginRng()*3)],
    collateralUsd:          +((m.aum * 0.6) * (1 - marginRng() * 0.1)).toFixed(0),
    maintenanceMarginPct:   0.05,
  };
});

// ── Correlation matrix ────────────────────────────────────
const IDS = ['M1','M2','M3','M4','M5','M6','portfolio','BTC','ETH','SPX','VIX'];

function calcCorrelation(a: number[], b: number[]): number {
  const n   = Math.min(a.length, b.length);
  const ma  = a.slice(0, n).reduce((s,v)=>s+v,0)/n;
  const mb  = b.slice(0, n).reduce((s,v)=>s+v,0)/n;
  let num=0, da=0, db=0;
  for (let i=0;i<n;i++){
    num += (a[i]-ma)*(b[i]-mb);
    da  += (a[i]-ma)**2;
    db  += (b[i]-mb)**2;
  }
  return da*db === 0 ? 0 : +(num / Math.sqrt(da*db)).toFixed(3);
}

function dailyReturns(key: keyof ReturnPoint): number[] {
  return RETURN_SERIES.slice(1).map((p, i) => {
    const prev = (RETURN_SERIES[i][key] as number) + 1;
    const curr = (p[key] as number) + 1;
    return curr / prev - 1;
  });
}

// Synthetic SPX & VIX daily returns
const synthRng = mulberry32(12321);
const SPX_RETS = RETURN_SERIES.slice(1).map(() => normal(synthRng, 0.0004, 0.008));
const VIX_RETS = RETURN_SERIES.slice(1).map(() => normal(synthRng, -0.0002, 0.05));

const DAILY_RETS: Record<string, number[]> = {
  M1: dailyReturns('M1'), M2: dailyReturns('M2'), M3: dailyReturns('M3'),
  M4: dailyReturns('M4'), M5: dailyReturns('M5'), M6: dailyReturns('M6'),
  portfolio: dailyReturns('portfolio'),
  BTC: dailyReturns('BTC'), ETH: dailyReturns('ETH'),
  SPX: SPX_RETS, VIX: VIX_RETS,
};

export function getCorrelationMatrix(days: number): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const a of IDS) {
    result[a] = {};
    for (const b of IDS) {
      if (a === b) { result[a][b] = 1; continue; }
      const ra = DAILY_RETS[a].slice(-days);
      const rb = DAILY_RETS[b].slice(-days);
      result[a][b] = calcCorrelation(ra, rb);
    }
  }
  return result;
}

export const CORRELATION_IDS = IDS;

// ── Stress scenarios ──────────────────────────────────────
export interface StressScenario {
  name: string;
  date: string;
  btcShock: number;    // e.g. -0.60
  ethShock: number;
  spxShock: number;
  vixLevel: number;
  portfolioImpact: number;
  maxDD: number;
  recoveryDays: number;
}

export const STRESS_SCENARIOS: StressScenario[] = [
  { name: 'FTX Collapse',        date: 'Nov 2022', btcShock: -0.25, ethShock: -0.30, spxShock: -0.05, vixLevel: 32, portfolioImpact: -0.11, maxDD: -0.18, recoveryDays: 95  },
  { name: '2008 Financial Crisis',date: 'Sep 2008', btcShock: -0.50, ethShock: -0.55, spxShock: -0.38, vixLevel: 80, portfolioImpact: -0.22, maxDD: -0.34, recoveryDays: 420 },
  { name: 'COVID-19 Crash',       date: 'Mar 2020', btcShock: -0.50, ethShock: -0.55, spxShock: -0.34, vixLevel: 65, portfolioImpact: -0.19, maxDD: -0.27, recoveryDays: 85  },
  { name: 'Mt. Gox Hack',         date: 'Feb 2014', btcShock: -0.80, ethShock:  0.00, spxShock: -0.02, vixLevel: 18, portfolioImpact: -0.31, maxDD: -0.45, recoveryDays: 730 },
  { name: '2018 Crypto Bear',     date: 'Jan 2018', btcShock: -0.84, ethShock: -0.92, spxShock: -0.10, vixLevel: 24, portfolioImpact: -0.38, maxDD: -0.55, recoveryDays: 690 },
  { name: 'Luna/UST Collapse',    date: 'May 2022', btcShock: -0.30, ethShock: -0.35, spxShock: -0.06, vixLevel: 35, portfolioImpact: -0.14, maxDD: -0.22, recoveryDays: 110 },
];

// ── Multi-factor model ────────────────────────────────────
export interface FactorAttribution {
  date: string;
  alpha: number;
  marketFactor: number;
  styleFactor: number;
  cryptoFactor: number;
  macroFactor: number;
  error: number;
}

const factorRng = mulberry32(31415);

export const FACTOR_SERIES: FactorAttribution[] = RETURN_SERIES.slice(1).map((p, i) => {
  const total = ((p.portfolio as number) + 1) / ((RETURN_SERIES[i].portfolio as number) + 1) - 1;
  const market = total * (0.35 + normal(factorRng, 0, 0.05));
  const style  = total * (0.20 + normal(factorRng, 0, 0.04));
  const crypto = total * (0.25 + normal(factorRng, 0, 0.06));
  const macro  = total * (0.08 + normal(factorRng, 0, 0.03));
  const alpha  = total * (0.15 + normal(factorRng, 0, 0.04));
  const error  = total - (market + style + crypto + macro + alpha);
  return {
    date: p.date,
    alpha:        +alpha.toFixed(6),
    marketFactor: +market.toFixed(6),
    styleFactor:  +style.toFixed(6),
    cryptoFactor: +crypto.toFixed(6),
    macroFactor:  +macro.toFixed(6),
    error:        +error.toFixed(6),
  };
});

// ── Utility: format helpers ───────────────────────────────
export function fmtUSD(n: number, decimals = 1): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(decimals)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function fmtPct(n: number, decimals = 2): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(decimals)}%`;
}

export function fmtMult(n: number): string {
  return `${n.toFixed(2)}×`;
}
