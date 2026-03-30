export type ManagerType = 'CeFi' | 'DeFi'

export interface Manager {
  id: string
  name: string
  type: ManagerType
  strategy: string
  inceptionDate: string
}

export interface ExposureSnapshot {
  date: string // ISO date
  managerId: string | 'portfolio'
  lmv: number
  smv: number
  gmv: number
  nmv: number
  targetLmv: number
  targetSmv: number
  aum: number
}

export interface DistributionPoint {
  managerId: string | 'portfolio'
  metric: 'LMV' | 'SMV' | 'GMV' | 'NMV'
  percentile: number
  value: number
}

export interface BubblePoint {
  managerId: string
  managerName: string
  lmv: number
  smv: number
  gmv: number
  portfolioPct: number
  cagr: number
  volContribution: number
}

export interface TradeBlotterRow {
  id: string
  timestamp: string
  managerId: string
  pair: string
  direction: 'Long' | 'Short'
  sizeUsd: number
  pnlUsd: number
  feesUsd: number
  status: 'Open' | 'Closed'
}
