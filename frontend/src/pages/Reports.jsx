import { useEffect, useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import UtilizationBarChart from '../components/reports/UtilizationBarChart'
import BookingHeatmap from '../components/reports/BookingHeatmap'
import { useAuth } from '../context/AuthContext'
import { getScreen9Analytics } from '../api/analytics'
import { ApiError } from '../api/client'
import {
  Download,
  TrendingUp,
  Pause,
  Bell,
  Package,
  MoreVertical,
  ChevronDown,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

function dueScoreStyle(score) {
  if (score >= 70) return 'text-red-600 dark:text-red-400'
  if (score >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-slate-700 dark:text-slate-300'
}

export default function Reports() {
  const { token } = useAuth()
  const [department, setDepartment] = useState('All Departments')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAnalytics = () => {
    setLoading(true)
    setError(null)
    getScreen9Analytics(token)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof ApiError
            ? err.message
            : 'Analytics service is unavailable. Is the ML API running on port 8000?'
        )
      )
      .finally(() => setLoading(false))
  }

  useEffect(loadAnalytics, [token])

  const departmentChartData = (data?.department_utilization ?? []).map((d) => ({
    label: d.department_name,
    value: d.allocation_count,
  }))

  const mostUsedAssets = [...(data?.most_used_assets ?? [])]
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 3)

  const idleAssets = [...(data?.idle_assets ?? [])]
    .sort((a, b) => b.days_since_last_activity - a.days_since_last_activity)
    .slice(0, 3)

  const retirementAlerts = [...(data?.retirement_candidates ?? [])]
    .sort((a, b) => b.retirement_score - a.retirement_score)
    .slice(0, 3)

  const maintenanceDue = [...(data?.predictive_maintenance?.assets ?? [])]
    .sort((a, b) => b.maintenance_risk_score - a.maintenance_risk_score)
    .slice(0, 5)

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Reports &amp; Analytics</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Detailed insights into asset utilization and lifecycle management.
          </p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </span>
          <button type="button" onClick={loadAnalytics} className="shrink-0 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 py-20 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Loading analytics…
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Utilization by Department</h3>
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-700 dark:bg-blue-500" /> High
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-300 dark:bg-blue-300/70" /> Low
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <UtilizationBarChart
                  data={departmentChartData}
                  formatValue={(v) => v}
                  tooltipSuffix="allocations"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Booking Heatmap</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">Weekly demand by day and hour</p>
              <div className="mt-4">
                <BookingHeatmap data={data.booking_heatmap} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <TrendingUp size={17} className="text-blue-700 dark:text-blue-400" />
                Most used assets
              </h3>
              <ul className="mt-4 flex flex-col gap-4">
                {mostUsedAssets.map((asset) => (
                  <li key={asset.asset_tag} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60">
                      <Package size={16} className="text-blue-700 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{asset.asset_name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{asset.category_name}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-blue-700 dark:text-blue-400">{Math.round(asset.usage_count)} uses</span>
                  </li>
                ))}
                {mostUsedAssets.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No usage data yet.</p>}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <Pause size={17} className="text-slate-500 dark:text-slate-400" />
                Idle assets
              </h3>
              <ul className="mt-4 flex flex-col gap-4">
                {idleAssets.map((asset) => (
                  <li key={asset.asset_tag} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{asset.asset_name}</p>
                      <p className="text-xs font-medium text-red-500 dark:text-red-400">
                        Unused {Math.round(asset.days_since_last_activity)} days
                      </p>
                    </div>
                    <button type="button" className="shrink-0 text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200" aria-label={`Actions for ${asset.asset_name}`}>
                      <MoreVertical size={18} />
                    </button>
                  </li>
                ))}
                {idleAssets.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No idle assets detected.</p>}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                <Bell size={17} className="text-red-500 dark:text-red-400" />
                Retirement Alerts
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                {retirementAlerts.map((asset) => {
                  const isCritical = asset.retirement_score >= 75
                  return (
                    <div key={asset.asset_tag} className={`rounded-lg p-3 ${isCritical ? 'bg-red-50 dark:bg-red-950/40' : 'bg-indigo-50 dark:bg-indigo-950/30'}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${isCritical ? 'text-red-700 dark:text-red-400' : 'text-indigo-700 dark:text-indigo-300'}`}>
                          {asset.asset_name} <span className="font-normal opacity-70">({asset.asset_tag})</span>
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${isCritical ? 'bg-red-600 text-white' : 'bg-indigo-200 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'}`}>
                          {isCritical ? 'Critical' : 'Info'}
                        </span>
                      </div>
                      <p className={`mt-1 text-xs ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-300'}`}>
                        {asset.condition} condition · {asset.age_years.toFixed(1)}y old · Score {Math.round(asset.retirement_score)}
                      </p>
                    </div>
                  )
                })}
                {retirementAlerts.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No retirement candidates right now.</p>}
              </div>
              <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">
                View full schedule
                <ArrowRight size={14} />
              </a>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assets due for maintenance</h3>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-900/40"
                >
                  <option>All Departments</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="px-6 py-3">Asset Name</th>
                    <th className="px-6 py-3">Tag ID</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Maintenance Count</th>
                    <th className="px-6 py-3">Risk Score</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {maintenanceDue.map((item) => (
                    <tr key={item.asset_tag} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.asset_name}</td>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-500">{item.asset_tag}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.category_name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{Math.round(item.maintenance_count)}</td>
                      <td className={`px-6 py-4 font-semibold ${dueScoreStyle(item.maintenance_risk_score)}`}>{item.maintenance_risk_score.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right">
                        <a href="#" className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">Schedule</a>
                      </td>
                    </tr>
                  ))}
                  {maintenanceDue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">No maintenance predictions available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 text-center dark:border-slate-800">
              <span className="text-sm text-slate-400 dark:text-slate-500">
                Showing top {maintenanceDue.length} of {data.predictive_maintenance?.assets?.length ?? 0} scored assets
              </span>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
