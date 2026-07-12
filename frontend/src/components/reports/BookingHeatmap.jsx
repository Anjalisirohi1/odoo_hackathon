import { useState } from 'react'

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WEEKDAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' }

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${period}`
}

export default function BookingHeatmap({ data }) {
  const [hovered, setHovered] = useState(null)

  const hours = [...new Set(data.map((d) => d.start_hour))].sort((a, b) => a - b)
  const max = Math.max(...data.map((d) => d.booking_count))
  const lookup = new Map(data.map((d) => [`${d.weekday}-${d.start_hour}`, d.booking_count]))

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `48px repeat(${hours.length}, minmax(28px, 1fr))` }}>
          <div />
          {hours.map((hour) => (
            <div key={hour} className="pb-1 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {formatHour(hour)}
            </div>
          ))}

          {WEEKDAY_ORDER.map((day) => (
            <div key={day} className="contents">
              <div className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">{WEEKDAY_SHORT[day]}</div>
              {hours.map((hour) => {
                const count = lookup.get(`${day}-${hour}`) ?? 0
                const intensity = count / max
                const isHovered = hovered?.day === day && hovered?.hour === hour
                return (
                  <div
                    key={hour}
                    onMouseEnter={() => setHovered({ day, hour, count })}
                    onMouseLeave={() => setHovered(null)}
                    className={`aspect-square rounded-[4px] transition-transform ${isHovered ? 'scale-110 ring-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: `rgba(29, 78, 216, ${count === 0 ? 0.04 : 0.12 + intensity * 0.8})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>Fewer</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <span key={v} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: `rgba(29, 78, 216, ${0.12 + v * 0.8})` }} />
            ))}
          </div>
          <span>More bookings</span>
        </div>
        {hovered && (
          <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {WEEKDAY_SHORT[hovered.day]} {formatHour(hovered.hour)} — <span className="font-semibold text-blue-700 dark:text-blue-400">{hovered.count} bookings</span>
          </div>
        )}
      </div>
    </div>
  )
}
