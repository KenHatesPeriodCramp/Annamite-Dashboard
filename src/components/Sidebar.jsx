import { useState, useEffect } from 'react'
import { LiveDot } from './UI'

const NAV = [
  { id: 'overview',    label: 'Fund Overview',        group: 'PERFORMANCE' },
  { id: 'strategies',  label: 'Strategy Breakdown',   group: 'PERFORMANCE' },
  { id: 'returns',     label: 'Return Decomposition', group: 'PERFORMANCE' },
  { id: 'factors',     label: 'Factor Exposure',      group: 'RISK' },
  { id: 'barra',       label: 'Barra Risk Model',     group: 'RISK' },
  { id: 'correlation', label: 'Correlation & VaR',    group: 'RISK' },
  { id: 'macro',       label: 'Macro Monitor',        group: 'MACRO' },
  { id: 'regime',      label: 'Regime Analysis',      group: 'MACRO' },
  { id: 'retail',      label: 'Retail Participation', group: 'ALPHA' },
  { id: 'portfolioTracking', label: 'Portfolio Workbook', group: 'OPERATIONS' },
]

const GROUPS = ['PERFORMANCE', 'RISK', 'MACRO', 'ALPHA', 'OPERATIONS']

export default function Sidebar({ active, onNav }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    const zoneFormatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
    })
    const fmt = () => {
      const now = new Date()
      const zone = zoneFormatter.formatToParts(now).find(part => part.type === 'timeZoneName')?.value ?? 'Local'
      return `${timeFormatter.format(now)} ${zone}`
    }
    setTime(fmt())
    const t = setInterval(() => setTime(fmt()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="w-[210px] min-w-[210px] h-screen bg-white border-r border-[#e2e8f0] flex flex-col">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#e2e8f0]">
        <div className="text-[13px] font-semibold tracking-[0.08em] text-[#1e293b]">
          ANNAMITE
        </div>
        <div className="text-[10px] text-[#94a3b8] mt-0.5 tracking-wide">Capital · PM Terminal</div>
        <div className="flex items-center gap-2 mt-2.5">
          <LiveDot />
          <span className="text-[10px] text-[#94a3b8] font-mono">{time}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {GROUPS.map(group => {
          const items = NAV.filter(n => n.group === group)
          return (
            <div key={group} className="mb-5">
              <div className="px-5 py-1 text-[9px] tracking-[0.2em] text-[#cbd5e1] font-semibold uppercase">
                {group}
              </div>
              {items.map(item => {
                const isActive = active === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onNav(item.id)}
                    className="w-full flex items-center px-5 py-2 text-left transition-colors duration-100 group"
                    style={{
                      background: isActive ? 'rgba(37,99,235,0.06)' : 'transparent',
                      borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                    }}
                  >
                    <span className={`text-[11px] transition-colors ${
                      isActive
                        ? 'text-[#1e293b] font-medium'
                        : 'text-[#94a3b8] group-hover:text-[#475569]'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#e2e8f0]">
        <div className="text-[9px] text-[#cbd5e1] tracking-wide uppercase">Systematic Crypto Fund</div>
        <div className="text-[9px] text-[#cbd5e1] mt-0.5 font-mono">AUM $247.3M · 6 Strategies</div>
      </div>
    </div>
  )
}
