import { useState } from 'react'

const HIGH_THRESHOLD = 70
const CHART_WIDTH = 600
const CHART_HEIGHT = 220
const BASELINE_Y = 190
const TOP_Y = 20
const BAR_WIDTH = 28

export default function UtilizationBarChart({ data }) {
  const [hovered, setHovered] = useState(null)
  const step = CHART_WIDTH / data.length
  const scale = (value) => BASELINE_Y - ((BASELINE_Y - TOP_Y) * value) / 100

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_WIDTH} 210`} className="w-full" role="img" aria-label="Utilization by department bar chart">
        <line x1="0" y1={BASELINE_Y} x2={CHART_WIDTH} y2={BASELINE_Y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

        {data.map((d, i) => {
          const cx = step * i + step / 2
          const barX = cx - BAR_WIDTH / 2
          const barY = scale(d.value)
          const barHeight = BASELINE_Y - barY
          const isHigh = d.value >= HIGH_THRESHOLD
          const fill = isHigh ? 'fill-blue-700 dark:fill-blue-500' : 'fill-blue-300 dark:fill-blue-300/70'

          return (
            <g key={d.label} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <rect x={barX} y={barY} width={BAR_WIDTH} height={Math.max(barHeight, 2)} rx="4" className={`${fill} transition-opacity ${hovered === i ? 'opacity-80' : ''}`} />
              <text x={cx} y={barY - 8} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[11px] font-medium">
                {d.value}%
              </text>
              <rect x={barX - 6} y={TOP_Y} width={BAR_WIDTH + 12} height={BASELINE_Y - TOP_Y} fill="transparent" className="cursor-pointer" />
            </g>
          )
        })}
      </svg>

      <div className="mt-1 flex" style={{ paddingLeft: 0 }}>
        {data.map((d, i) => (
          <div key={d.label} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400" style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </div>
        ))}
      </div>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium shadow-md dark:border-slate-700 dark:bg-slate-800"
          style={{ left: `${((hovered + 0.5) / data.length) * 100}%`, top: `${(scale(data[hovered].value) / 210) * 100 - 2}%` }}
        >
          <span className="font-semibold text-slate-800 dark:text-slate-100">{data[hovered].label}</span>{' '}
          <span className="text-slate-500 dark:text-slate-400">{data[hovered].value}% utilized</span>
        </div>
      )}
    </div>
  )
}
