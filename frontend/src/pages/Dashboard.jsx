// Page content only — layout provided by route wrapper
import {
  Plus,
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
} from 'lucide-react'

const primaryStats = [
  {
    icon: CheckCircle2,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-700 dark:text-blue-400',
    badge: '+12% from last week',
    badgeColor: 'text-emerald-600 dark:text-emerald-400',
    value: 128,
    label: 'AVAILABLE ASSETS',
  },
  {
    icon: User,
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-500 dark:text-blue-400',
    badge: 'In active use',
    badgeColor: 'text-slate-500 dark:text-slate-400',
    value: 76,
    label: 'ALLOCATED ASSETS',
  },
  {
    icon: Hourglass,
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
    iconColor: 'text-orange-500 dark:text-orange-400',
    badge: 'Awaiting setup',
    badgeColor: 'text-slate-500 dark:text-slate-400',
    value: 4,
    label: 'READY FOR DEPLOYMENT',
  },
]

const secondaryStats = [
  { icon: Bookmark, label: 'ACTIVE BOOKINGS', value: 4 },
  { icon: ArrowLeftRight, label: 'PENDING TRANSFERS', value: 3 },
  { icon: Undo2, label: 'UPCOMING RETURNS', value: 12 },
  {
    icon: ShieldAlert,
    label: 'ASSETS AT RISK',
    value: 5,
    iconColor: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
]

const quickActions = [
  { icon: Smartphone, label: 'Book a Resource' },
  { icon: MessageSquareWarning, label: 'Raise Requests' },
  { icon: ClipboardCheck, label: 'Batch Audit' },
]

const activity = [
  {
    icon: Laptop,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    content: (
      <>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Laptop AF-0114</span> was
        allocated to{' '}
        <span className="font-semibold text-blue-700 dark:text-blue-400">Priya Shah</span>{' '}
        <span className="text-slate-500 dark:text-slate-400">(Engineering dept)</span>
      </>
    ),
    time: '2 minutes ago',
    place: 'Bangalore Office',
  },
  {
    icon: DoorClosed,
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
    content: (
      <>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Room B2</span> booking
        confirmed: 2:00 PM to 3:00 PM
      </>
    ),
    time: '45 minutes ago',
    place: 'Conference Center',
  },
  {
    icon: Wrench,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    content: (
      <>
        <span className="font-semibold text-slate-900 dark:text-slate-100">Projector AF-0062</span>{' '}
        maintenance resolved
      </>
    ),
    time: '2 hours ago',
    place: 'HQ Floor 2',
  },
  {
    icon: UserPlus,
    iconBg: 'bg-blue-700 dark:bg-blue-600',
    iconColor: 'text-white',
    content: (
      <>
        <span className="font-semibold text-slate-900 dark:text-slate-100">New Employee</span>{' '}
        onboarding: John Doe added to Engineering
      </>
    ),
    time: '5 hours ago',
    place: 'System Admin',
  },
]

export default function Dashboard() {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Today's Overview</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Welcome back. Here is what's happening with your assets today.
          </p>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus size={16} />
          Register Asset
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        {primaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}>
                <stat.icon size={20} className={stat.iconColor} />
              </div>
              <span className={`text-sm font-medium ${stat.badgeColor}`}>{stat.badge}</span>
            </div>
            <p className="mt-5 text-4xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold tracking-wide text-slate-400 dark:text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {secondaryStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-slate-200 p-5 dark:border-slate-800 ${
              stat.bg ?? 'bg-indigo-50/60 dark:bg-slate-900'
            }`}
          >
            <div className={`flex items-center gap-2 ${stat.iconColor ?? 'text-slate-500 dark:text-slate-400'}`}>
              <stat.icon size={16} />
              <span className="text-xs font-semibold tracking-wide">{stat.label}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
          </div>
        ))}

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/40">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle size={16} />
            <span className="text-xs font-semibold tracking-wide">URGENT ACTION</span>
          </div>
          <p className="mt-3 text-lg font-semibold leading-snug text-red-700 dark:text-red-400">
            3 assets overdue for return
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
            {activity.map((item, index) => (
              <li key={index} className="flex items-start gap-4 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}>
                  <item.icon size={18} className={item.iconColor} />
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{item.content}</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {item.time} &bull; {item.place}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
