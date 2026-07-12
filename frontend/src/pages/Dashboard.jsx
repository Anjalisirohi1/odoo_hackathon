import { useEffect, useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats } from '../api/dashboard'
import { ApiError } from '../api/client'
import {
  CheckCircle2,
  User,
  Hourglass,
  Bookmark,
  ArrowLeftRight,
  Undo2,
  ShieldAlert,
  AlertTriangle,
  Smartphone,
  MessageSquareWarning,
  ClipboardCheck,
  ChevronRight,
  Laptop,
  DoorClosed,
  Wrench,
  UserPlus,
  Package,
} from 'lucide-react'

const primaryStatConfig = [
  {
    key: 'availableAssets',
    icon: CheckCircle2,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-700 dark:text-blue-400',
    badge: 'Ready to allocate',
    badgeColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'AVAILABLE ASSETS',
  },
  {
    key: 'allocatedAssets',
    icon: User,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-500 dark:text-blue-400',
    badge: 'In active use',
    badgeColor: 'text-slate-500 dark:text-slate-400',
    label: 'ALLOCATED ASSETS',
  },
  {
    key: 'readyForDeployment',
    icon: Hourglass,
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
    iconColor: 'text-orange-500 dark:text-orange-400',
    badge: 'Awaiting setup',
    badgeColor: 'text-slate-500 dark:text-slate-400',
    label: 'READY FOR DEPLOYMENT',
  },
]

const secondaryStatConfig = [
  { key: 'activeBookings', icon: Bookmark, label: 'ACTIVE BOOKINGS' },
  { key: 'pendingTransfers', icon: ArrowLeftRight, label: 'PENDING TRANSFERS' },
  { key: 'upcomingReturns', icon: Undo2, label: 'UPCOMING RETURNS' },
  {
    key: 'assetsAtRisk',
    icon: ShieldAlert,
    label: 'ASSETS AT RISK',
    iconColor: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
]

const quickActions = [
  { icon: Smartphone, label: 'Book a Resource' },
  { icon: MessageSquareWarning, label: 'Raise Requests' },
  { icon: ClipboardCheck, label: 'Batch Audit' },
]

const activityIconByType = {
  asset: { icon: Laptop, iconBg: 'bg-blue-100 dark:bg-blue-950/60', iconColor: 'text-blue-600 dark:text-blue-400' },
  booking: { icon: DoorClosed, iconBg: 'bg-orange-100 dark:bg-orange-950/50', iconColor: 'text-orange-600 dark:text-orange-400' },
  maintenance: { icon: Wrench, iconBg: 'bg-emerald-100 dark:bg-emerald-950/50', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  admin: { icon: UserPlus, iconBg: 'bg-blue-700 dark:bg-blue-600', iconColor: 'text-white' },
}
const defaultActivityIcon = { icon: Package, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-500 dark:text-slate-400' }

function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function Dashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadStats = () => {
    setLoading(true)
    setError(null)
    getDashboardStats(token)
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadStats, [token])

  const kpis = stats?.kpis ?? {}
  const activity = stats?.recentActivity ?? []

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Today's Overview</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Welcome back. Here is what's happening with your assets today.
        </p>
      </div>

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
          {error}
          <button type="button" onClick={loadStats} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        {primaryStatConfig.map((stat) => (
          <div
            key={stat.key}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}>
                <stat.icon size={20} className={stat.iconColor} />
              </div>
              <span className={`text-sm font-medium ${stat.badgeColor}`}>{stat.badge}</span>
            </div>
            <p className="mt-5 text-4xl font-bold text-slate-900 dark:text-slate-100">
              {loading ? '—' : kpis[stat.key] ?? 0}
            </p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-slate-400 dark:text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {secondaryStatConfig.map((stat) => (
          <div
            key={stat.key}
            className={`rounded-2xl border border-slate-200 p-5 dark:border-slate-800 ${
              stat.bg ?? 'bg-indigo-50/60 dark:bg-slate-900'
            }`}
          >
            <div className={`flex items-center gap-2 ${stat.iconColor ?? 'text-slate-500 dark:text-slate-400'}`}>
              <stat.icon size={16} />
              <span className="text-xs font-semibold tracking-wide">{stat.label}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {loading ? '—' : kpis[stat.key] ?? 0}
            </p>
          </div>
        ))}

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/40">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle size={16} />
            <span className="text-xs font-semibold tracking-wide">URGENT ACTION</span>
          </div>
          <p className="mt-3 text-lg font-semibold leading-snug text-red-700 dark:text-red-400">
            {loading ? '—' : `${kpis.overdueReturns ?? 0} assets overdue for return`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            <div className="mt-4 flex flex-col gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-3">
                    <action.icon size={17} className="text-blue-700 dark:text-blue-400" />
                    {action.label}
                  </span>
                  <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 dark:bg-slate-800">
            <h3 className="text-lg font-bold text-white">Smart Tracking</h3>
            <p className="mt-2 text-sm text-slate-300">
              Leveraging AI to predict asset maintenance cycles.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Activity</h2>
            <a href="#" className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400">
              View all
            </a>
          </div>

          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <li className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading activity…</li>
            )}
            {!loading && activity.length === 0 && (
              <li className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">No recent activity yet.</li>
            )}
            {!loading && activity.map((item) => {
              const { icon: Icon, iconBg, iconColor } = activityIconByType[item.details?.type] ?? defaultActivityIcon
              return (
                <li key={item.id} className="flex items-start gap-4 py-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {item.details?.message ?? item.action}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(item.createdAt)}
                      {item.details?.location ? ` • ${item.details.location}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
