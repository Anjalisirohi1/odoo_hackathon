import { useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import UtilizationBarChart from '../components/reports/UtilizationBarChart'
import MaintenanceLineChart from '../components/reports/MaintenanceLineChart'
import {
  Download,
  TrendingUp,
  Pause,
  Bell,
  Camera,
  Truck,
  DoorClosed,
  MoreVertical,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'

const departmentUtilization = [
  { label: 'Eng', value: 92 },
  { label: 'Ops', value: 58 },
  { label: 'Dev', value: 81 },
  { label: 'Sales', value: 45 },
  { label: 'Design', value: 67 },
  { label: 'Legal', value: 38 },
]

const maintenanceFrequency = [
  { month: 'Jan', value: 8 },
  { month: 'Feb', value: 14 },
  { month: 'Mar', value: 22 },
  { month: 'Apr', value: 30 },
  { month: 'May', value: 34 },
  { month: 'Jun', value: 29 },
  { month: 'Jul', value: 21 },
  { month: 'Aug', value: 15 },
  { month: 'Sep', value: 12 },
  { month: 'Oct', value: 18 },
  { month: 'Nov', value: 30 },
  { month: 'Dec', value: 42 },
]
const labeledMonths = [0, 2, 4, 6, 8, 10] // Jan, Mar, May, Jul, Sep, Nov

const mostUsedAssets = [
  { icon: 'laptop', name: 'MacBook Pro B2', sub: 'Procurement Team', stat: '34 bookings' },
  { icon: 'room', name: 'Conf Room B2', sub: 'Shared Resource', stat: '21 bookings' },
  { icon: 'van', name: 'Van AF-343', sub: 'Logistics', stat: '18 trips' },
]

const idleAssets = [
  { name: 'Camera AF-0301', status: 'Unused 60+ days' },
  { name: 'Ergo Chair AF-0410', status: 'Unused 45 days' },
]

const retirementAlerts = [
  { severity: 'critical', name: 'Forklift AF-0087', messagePrefix: 'Major service due in ', highlight: '5 days' },
  { severity: 'info', name: 'Laptop AF-0020', message: 'Approaching EOL (4 years old). Schedule replacement.' },
]

const maintenanceDue = [
  { name: 'Precision Drill 500', tag: 'AF-1092', category: 'Machinery', lastCheck: 'Jan 12, 2024', dueDays: 2 },
  { name: 'Generator Unit X', tag: 'AF-0045', category: 'Facilities', lastCheck: 'Dec 05, 2023', dueDays: 12 },
  { name: 'Fleet Truck #09', tag: 'AF-7721', category: 'Logistics', lastCheck: 'Mar 20, 2024', dueDays: 28 },
]

function dueDaysStyle(days) {
  if (days <= 3) return 'text-red-600 dark:text-red-400'
  if (days <= 14) return 'text-amber-600 dark:text-amber-400'
  return 'text-slate-700 dark:text-slate-300'
}

function AssetIcon({ type }) {
  const Icon = type === 'room' ? DoorClosed : type === 'van' ? Truck : Camera
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60">
      <Icon size={16} className="text-blue-700 dark:text-blue-400" />
    </div>
  )
}

export default function Reports() {
  const [department, setDepartment] = useState('All Departments')

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
            <UtilizationBarChart data={departmentUtilization} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Maintenance Frequency</h3>
          <div className="mt-4">
            <MaintenanceLineChart data={maintenanceFrequency} labeledMonths={labeledMonths} />
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
              <li key={asset.name} className="flex items-center gap-3">
                <AssetIcon type={asset.icon} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{asset.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{asset.sub}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-blue-700 dark:text-blue-400">{asset.stat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <Pause size={17} className="text-slate-500 dark:text-slate-400" />
            Idle assets
          </h3>
          <ul className="mt-4 flex flex-col gap-4">
            {idleAssets.map((asset) => (
              <li key={asset.name} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{asset.name}</p>
                  <p className="text-xs font-medium text-red-500 dark:text-red-400">{asset.status}</p>
                </div>
                <button type="button" className="shrink-0 text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200" aria-label={`Actions for ${asset.name}`}>
                  <MoreVertical size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
            <Bell size={17} className="text-red-500 dark:text-red-400" />
            Retirement Alerts
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {retirementAlerts.map((alert) =>
              alert.severity === 'critical' ? (
                <div key={alert.name} className="rounded-lg bg-red-50 p-3 dark:bg-red-950/40">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">{alert.name}</p>
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Critical</span>
                  </div>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {alert.messagePrefix}
                    <span className="font-semibold">{alert.highlight}</span>
                  </p>
                </div>
              ) : (
                <div key={alert.name} className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{alert.name}</p>
                    <span className="rounded-full bg-indigo-200 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">Info</span>
                  </div>
                  <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-300">{alert.message}</p>
                </div>
              )
            )}
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
              <option>Machinery</option>
              <option>Facilities</option>
              <option>Logistics</option>
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
                <th className="px-6 py-3">Last Check</th>
                <th className="px-6 py-3">Due In</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {maintenanceDue.map((item) => (
                <tr key={item.tag} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="px-6 py-4 text-slate-400 dark:text-slate-500">{item.tag}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.category}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{item.lastCheck}</td>
                  <td className={`px-6 py-4 font-semibold ${dueDaysStyle(item.dueDays)}`}>{item.dueDays} days</td>
                  <td className="px-6 py-4 text-right">
                    <a href="#" className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">Schedule</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-6 py-4 text-center dark:border-slate-800">
          <a href="#" className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">View all 24 upcoming tasks</a>
        </div>
      </div>
    </DashboardLayout>
  )
}
