// ─── SHARED UI PRIMITIVES — Light Theme ─────────────────────────────────────

export function Panel({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-md shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, subtitle, right, accent = '#2563eb' }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
      <div className="flex items-center gap-3">
        <div className="w-[3px] h-4 rounded-full flex-shrink-0" style={{ background: accent }} />
        <div>
          <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#334155]">
            {title}
          </div>
          {subtitle && (
            <div className="text-[10px] text-[#94a3b8] mt-0.5 font-normal">{subtitle}</div>
          )}
        </div>
      </div>
      {right && <div className="text-[10px] text-[#94a3b8] flex items-center gap-1.5">{right}</div>}
    </div>
  )
}

export function KpiCard({ label, value, sub, color = '#2563eb', prefix = '', suffix = '', trend }) {
  const isPos = trend > 0
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-md p-3 flex flex-col gap-1.5 shadow-sm">
      <div className="text-[10px] tracking-[0.06em] uppercase text-[#94a3b8] font-semibold">{label}</div>
      <div className="text-[20px] font-semibold leading-tight font-mono" style={{ color }}>
        {prefix}{value}{suffix}
      </div>
      {(sub !== undefined || trend !== undefined) && (
        <div className="flex items-center gap-2 text-[10px]">
          {trend !== undefined && (
            <span className="font-mono font-medium" style={{ color: isPos ? '#059669' : '#dc2626' }}>
              {isPos ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}%
            </span>
          )}
          {sub && <span className="text-[#94a3b8]">{sub}</span>}
        </div>
      )}
    </div>
  )
}

export function Badge({ children, color = '#2563eb' }) {
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase"
      style={{ background: color + '12', color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  )
}

export function Tag({ val, thresholds = [0] }) {
  const color = val > (thresholds[1] || 0) ? '#059669' : val < (thresholds[0] || 0) ? '#dc2626' : '#d97706'
  return (
    <span style={{ color }} className="font-mono text-[11px] font-medium">
      {val > 0 ? '+' : ''}{val}
    </span>
  )
}

export function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[#e2e8f0]" />
      <span className="text-[9px] tracking-[0.18em] uppercase text-[#94a3b8] font-semibold">{label}</span>
      <div className="flex-1 h-px bg-[#e2e8f0]" />
    </div>
  )
}

export function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
        style={{ background: '#059669' }} />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#059669' }} />
    </span>
  )
}

export function HeatCell({ value, min = -1, max = 1 }) {
  const t = (value - min) / (max - min)
  let bg, text
  if (value > 0.1) {
    bg = `rgba(5,150,105,${Math.min(0.18, t * 0.22)})`
    text = '#059669'
  } else if (value < -0.1) {
    bg = `rgba(220,38,38,${Math.min(0.18, (1 - t) * 0.22)})`
    text = '#dc2626'
  } else {
    bg = '#f8fafd'
    text = '#94a3b8'
  }
  return (
    <td className="p-0">
      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono py-1.5"
        style={{ background: bg, color: text, fontWeight: 500 }}>
        {value > 0 ? '+' : ''}{value}
      </div>
    </td>
  )
}

export function ReturnCell({ value }) {
  if (value === null) return <td className="text-center text-[10px] text-[#cbd5e1] py-1.5 px-2">—</td>
  const color = value > 0 ? '#059669' : value < 0 ? '#dc2626' : '#94a3b8'
  const bg = value > 0 ? 'rgba(5,150,105,0.06)' : value < 0 ? 'rgba(220,38,38,0.06)' : 'transparent'
  return (
    <td className="text-center text-[10px] font-mono font-medium py-1.5 px-2" style={{ color, background: bg }}>
      {value > 0 ? '+' : ''}{value?.toFixed(2)}%
    </td>
  )
}

export function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-md p-2.5 text-[11px] shadow-lg"
      style={{ fontFamily: 'Inter, sans-serif' }}>
      {label && <div className="text-[#94a3b8] mb-1.5 text-[10px]">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[#64748b]">{p.name}:</span>
          <span style={{ color: p.color }} className="font-mono font-medium ml-auto pl-3">
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
