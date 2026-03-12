import { useCallback, useEffect, useMemo, useState } from 'react'
import { read, utils } from 'xlsx'
import workbookUrl from '../../Portfolio_Tracking_System.xlsx?url'
import { Panel, PanelHeader, KpiCard, Badge } from '../components/UI'

const REFRESH_INTERVAL_MS = 30000

function normalizeHexColor(value) {
  if (!value) return null

  const cleaned = `${value}`.replace(/[^0-9a-f]/gi, '')
  const hex = cleaned.length === 8 ? cleaned.slice(2) : cleaned.slice(-6)

  return hex.length === 6 ? `#${hex.toUpperCase()}` : null
}

function getContrastText(backgroundColor) {
  if (!backgroundColor) return '#334155'

  const hex = backgroundColor.replace('#', '')
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000

  return luminance < 150 ? '#FFFFFF' : '#334155'
}

function getCellView(cell) {
  const background = normalizeHexColor(cell?.s?.fgColor?.rgb) || normalizeHexColor(cell?.s?.bgColor?.rgb)
  const value = cell?.w ?? cell?.v ?? ''

  return {
    value: value === undefined || value === null ? '' : `${value}`,
    background,
    color: background ? getContrastText(background) : '#334155',
  }
}

function toSheetView(sheetName, worksheet) {
  const rangeRef = worksheet?.['!ref'] || 'A1:A1'
  const range = utils.decode_range(rangeRef)
  const columnCount = range.e.c - range.s.c + 1
  const rowCount = range.e.r - range.s.r + 1
  const mergeStarts = new Map()
  const mergedAway = new Set()

  for (const merge of worksheet?.['!merges'] || []) {
    const startKey = `${merge.s.r}:${merge.s.c}`
    mergeStarts.set(startKey, {
      rowSpan: merge.e.r - merge.s.r + 1,
      colSpan: merge.e.c - merge.s.c + 1,
    })

    for (let rowIndex = merge.s.r; rowIndex <= merge.e.r; rowIndex += 1) {
      for (let columnIndex = merge.s.c; columnIndex <= merge.e.c; columnIndex += 1) {
        if (rowIndex === merge.s.r && columnIndex === merge.s.c) continue
        mergedAway.add(`${rowIndex}:${columnIndex}`)
      }
    }
  }

  const rows = Array.from({ length: rowCount }, (_, rowOffset) => {
    const rowIndex = range.s.r + rowOffset

    return Array.from({ length: columnCount }, (_, columnOffset) => {
      const columnIndex = range.s.c + columnOffset
      const key = `${rowIndex}:${columnIndex}`
      const address = utils.encode_cell({ r: rowIndex, c: columnIndex })
      const cell = worksheet?.[address]
      const merge = mergeStarts.get(key)

      return {
        ...getCellView(cell),
        address,
        isMergedAway: mergedAway.has(key),
        rowSpan: merge?.rowSpan || 1,
        colSpan: merge?.colSpan || 1,
      }
    })
  })

  const nonEmptyRows = rows.filter(row => row.some(cell => cell.value.trim() !== ''))

  return {
    name: sheetName,
    rows,
    rowCount: nonEmptyRows.length,
    columnCount,
  }
}

function fmtTime(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(value)
}

export default function PortfolioTracking() {
  const [sheets, setSheets] = useState([])
  const [activeSheet, setActiveSheet] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastLoadedAt, setLastLoadedAt] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadWorkbook = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true)
    setIsRefreshing(true)
    setError('')

    try {
      const response = await fetch(`${workbookUrl}?ts=${Date.now()}`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Unable to load workbook (${response.status})`)

      const buffer = await response.arrayBuffer()
      const workbook = read(buffer, { cellStyles: true })
      const nextSheets = workbook.SheetNames.map(name => toSheetView(name, workbook.Sheets[name]))

      setSheets(nextSheets)
      setActiveSheet(current => (
        current && nextSheets.some(sheet => sheet.name === current)
          ? current
          : nextSheets[0]?.name || ''
      ))
      setLastLoadedAt(new Date())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load workbook')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadWorkbook()
  }, [loadWorkbook])

  useEffect(() => {
    const interval = setInterval(() => loadWorkbook({ silent: true }), REFRESH_INTERVAL_MS)
    const onFocus = () => loadWorkbook({ silent: true })

    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadWorkbook])

  const currentSheet = useMemo(
    () => sheets.find(sheet => sheet.name === activeSheet) || sheets[0],
    [activeSheet, sheets]
  )

  return (
    <div className="p-5 space-y-4 animate-slide-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[14px] font-semibold tracking-wide text-[#1e293b]">Portfolio Tracking Workbook</h1>
          <div className="text-[10px] text-[#64748b] mt-0.5 tracking-wide">
            Excel-backed portfolio tracker · Sheet tabs · Refreshable workbook preview
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadWorkbook()}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-[10px] font-semibold rounded-md border border-[#dbe3ef] bg-white text-[#334155] shadow-sm transition-colors hover:bg-[#f8fafc] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh workbook'}
          </button>
          <Badge color="#2563eb">{lastLoadedAt ? `Updated ${fmtTime(lastLoadedAt)}` : 'Waiting for load'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <KpiCard label="Workbook" value="Portfolio_Tracking_System" sub="Root Excel source" color="#2563eb" />
        <KpiCard label="Sheets" value={sheets.length} sub="Tabs available" color="#7c3aed" />
        <KpiCard label="Active Sheet" value={currentSheet?.name || '—'} sub="Current preview" color="#059669" />
        <KpiCard label="Rows / Cols" value={currentSheet ? `${currentSheet.rowCount} / ${currentSheet.columnCount}` : '—'} sub="Visible data footprint" color="#ea580c" />
      </div>

      <Panel>
        <PanelHeader
          title="Workbook Sheets"
          subtitle="Each workbook sheet opens in its own tab"
          right={lastLoadedAt ? `Last sync ${fmtTime(lastLoadedAt)}` : 'Loading workbook…'}
          accent="#2563eb"
        />
        <div className="p-3 border-b border-[#e2e8f0] flex flex-wrap gap-2">
          {sheets.map(sheet => {
            const isActive = sheet.name === currentSheet?.name

            return (
              <button
                key={sheet.name}
                type="button"
                onClick={() => setActiveSheet(sheet.name)}
                className="px-3 py-1.5 rounded-md border text-[10px] font-semibold tracking-wide transition-colors"
                style={{
                  borderColor: isActive ? '#2563eb' : '#dbe3ef',
                  background: isActive ? 'rgba(37,99,235,0.08)' : '#ffffff',
                  color: isActive ? '#2563eb' : '#64748b',
                }}
              >
                {sheet.name}
              </button>
            )
          })}
          {!sheets.length && !isLoading && (
            <span className="text-[10px] text-[#94a3b8]">No sheets found in workbook.</span>
          )}
        </div>

        <div className="p-3">
          {error && (
            <div className="mb-3 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c]">
              {error}
            </div>
          )}

          {isLoading && !currentSheet ? (
            <div className="h-[420px] flex items-center justify-center text-[11px] text-[#94a3b8]">
              Loading workbook…
            </div>
          ) : currentSheet ? (
            <div className="border border-[#e2e8f0] rounded-md overflow-hidden bg-white">
              <div className="overflow-auto max-h-[70vh]">
                <table className="w-full min-w-max border-collapse text-[11px]">
                  <thead className="sticky top-0 z-20 bg-[#f8fafc]">
                    <tr className="border-b border-[#e2e8f0]">
                      <th className="px-3 py-2 text-left text-[9px] font-semibold tracking-[0.16em] uppercase text-[#94a3b8] bg-[#f8fafc] sticky left-0 z-30 border-r border-[#e2e8f0]">
                        Row
                      </th>
                      {Array.from({ length: currentSheet.columnCount }, (_, index) => (
                        <th
                          key={`col-${index}`}
                          className="px-3 py-2 text-left text-[9px] font-semibold tracking-[0.16em] uppercase text-[#94a3b8] border-r border-[#e2e8f0] whitespace-nowrap"
                        >
                          {utils.encode_col(index)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentSheet.rows.length ? currentSheet.rows.map((row, rowIndex) => (
                      <tr key={`row-${rowIndex}`} className="border-b border-[#f1f5f9]">
                        <td className="px-3 py-2 font-mono text-[10px] text-[#94a3b8] bg-white sticky left-0 z-10 border-r border-[#e2e8f0] whitespace-nowrap align-top">
                          {rowIndex + 1}
                        </td>
                        {row.map((cell, columnIndex) => {
                          if (cell.isMergedAway) return null

                          return (
                            <td
                              key={cell.address || `cell-${rowIndex}-${columnIndex}`}
                              rowSpan={cell.rowSpan}
                              colSpan={cell.colSpan}
                              className="px-3 py-2 border-r border-[#f1f5f9] align-top whitespace-pre-wrap"
                              style={{
                                background: cell.background || '#FFFFFF',
                                color: cell.color,
                              }}
                            >
                              {cell.value || ' '}
                            </td>
                          )
                        })}
                      </tr>
                    )) : (
                      <tr>
                        <td
                          colSpan={Math.max(2, currentSheet.columnCount + 1)}
                          className="px-3 py-10 text-center text-[11px] text-[#94a3b8]"
                        >
                          This sheet is empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-[420px] flex items-center justify-center text-[11px] text-[#94a3b8]">
              No workbook preview available.
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
