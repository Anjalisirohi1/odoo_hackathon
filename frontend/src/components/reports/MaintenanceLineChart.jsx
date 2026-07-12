import { useState } from 'react'

const CHART_WIDTH = 600
const CHART_HEIGHT = 210
const TOP_Y = 20
const BASELINE_Y = 190

function buildSmoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cx1 = p0.x + (p1.x - p0.x) / 3
    const cx2 = p0.x + ((p1.x - p0.x) * 2) / 3
    d += ` C ${cx1} ${p0.y}, ${cx2} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
}

export default function MaintenanceLineChart({ data, labeledMonths }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(...data.map((d) => d.value)) * 1.15
  const step = CHART_WIDTH / (data.length - 1)
  const scaleY = (value) => BASELINE_Y - ((BASELINE_Y - TOP_Y) * value) / max

  const points = data.map((d, i) => ({ x: step * i, y: scaleY(d.value), ...d }))
  const linePath = buildSmoothPath(points)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${BASELINE_Y} L ${points[0].x} ${BASELINE_Y} Z`

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" role="img" aria-label="Maintenance frequency over the year">
        <line x1="0" y1={BASELINE_Y} x2={CHART_WIDTH} y2={BASELINE_Y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

        <defs>
          <linearGradient id="maintenanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#maintenanceFill)" className="text-blue-600 dark:text-blue-400" />
        <path d={linePath} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="stroke-blue-700 dark:stroke-blue-400" />

        {hovered !== null && (
          <line x1={points[hovered].x} y1={TOP_Y} x2={points[hovered].x} y2={BASELINE_Y} strokeWidth="1" className="stroke-slate-300 dark:stroke-slate-600" />
        )}

        {points.map((p, i) => (
          <g key={p.month}>
            {hovered === i && (
              <circle cx={p.x} cy={p.y} r="4.5" className="fill-blue-700 stroke-white dark:fill-blue-400 dark:stroke-slate-900" strokeWidth="2" />
            )}
            <rect
              x={p.x - step / 2}
              y={TOP_Y}
              width={step}
              height={BASELINE_Y - TOP_Y}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          </g>
        ))}
      </svg>

      <div className="mt-1 flex">
        {data.map((d, i) => (
          <div key={d.month} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400" style={{ width: `${100 / data.length}%` }}>
            {labeledMonths.includes(i) ? d.month.toUpperCase() : ''}
          </div>
        ))}
      </div>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-md dark:border-slate-700 dark:bg-slate-800"
          style={{ left: `${(points[hovered].x / CHART_WIDTH) * 100}%`, top: `${((points[hovered].y - 8) / CHART_HEIGHT) * 100}%` }}
        >
          <span className="font-semibold text-slate-800 dark:text-slate-100">{data[hovered].month}</span>{' '}
          <span className="text-slate-500 dark:text-slate-400">{data[hovered].value} tickets</span>
        </div>
      )}
    </div>
  )
}
