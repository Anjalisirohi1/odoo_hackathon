import { useState } from 'react'
// Page content only — layout provided by route wrapper
import { Search, ArrowLeftRight, UserCheck, CalendarCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'alert', label: 'Alerts' },
  { key: 'approval', label: 'Approvals' },
  { key: 'booking', label: 'Bookings' },
]

const notifications = [
  {
    id: 1,
    category: 'alert',
    unread: true,
    icon: ArrowLeftRight,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: (
      <>
        Laptop <span className="font-semibold">AF-0114</span> assigned to{' '}
        <span className="font-semibold">Priya Shah</span>
      </>
    ),
    description: (
      <>
        Asset status updated to:{' '}
        <span className="font-semibold text-blue-700 dark:text-blue-400">Active</span>
      </>
    ),
    time: '2m ago',
    action: { label: 'View Details', variant: 'button' },
    searchText: 'laptop af-0114 priya shah active',
  },
  {
    id: 2,
    category: 'approval',
    unread: true,
    icon: UserCheck,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: (
      <>
        Maintenance request <span className="font-semibold">AF-0055</span> approved
      </>
    ),
    description: (
      <>
        Scheduled for execution by <span className="font-semibold">TechOps Team</span> on Friday.
      </>
    ),
    time: '18m ago',
    action: { label: 'Approved', variant: 'badge' },
    searchText: 'maintenance af-0055 approved techops team',
  },
  {
    id: 3,
    category: 'booking',
    unread: false,
    icon: CalendarCheck,
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
    title: (
      <>
        Booking confirmed: <span className="font-semibold">Room B2</span>
      </>
    ),
    description: 'Schedule: 2:00 PM to 3:00 PM today.',
    time: '1h ago',
    searchText: 'booking confirmed room b2',
  },
  {
    id: 4,
    category: 'approval',
    unread: false,
    icon: ArrowLeftRight,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    title: (
      <>
        Transfer approved: <span className="font-semibold">AF-0033</span> to facilities dept
      </>
    ),
    description: 'Request initiated by Maya T. has been approved.',
    time: '3h ago',
    searchText: 'transfer approved af-0033 facilities maya',
  },
  {
    id: 5,
    category: 'alert',
    unread: true,
    icon: AlertTriangle,
    iconBg: 'bg-red-100 dark:bg-red-950/50',
    iconColor: 'text-red-600 dark:text-red-400',
    title: '3 assets overdue for return',
    description: 'Review the assets awaiting return in the Asset Directory.',
    time: '5h ago',
    action: { label: 'Review Now', variant: 'button' },
    searchText: '3 assets overdue return',
  },
  {
    id: 6,
    category: 'booking',
    unread: false,
    icon: CalendarCheck,
    iconBg: 'bg-orange-100 dark:bg-orange-950/50',
    iconColor: 'text-orange-600 dark:text-orange-400',
    title: (
      <>
        Resource booking request: <span className="font-semibold">Projector P-12</span>
      </>
    ),
    description: 'Pending approval from Facilities.',
    time: '6h ago',
    searchText: 'resource booking projector p-12 facilities',
  },
]

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = notifications.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab
    const matchesQuery = item.searchText.includes(query.trim().toLowerCase())
    return matchesTab && matchesQuery
  })

  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Stay updated on asset transfers, maintenance requests, and audit alerts.
        </p>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notifications, assets, or tasks..."
          className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40"
        />
      </div>

      <div className="mt-6 flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-blue-700 text-blue-700 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}>
                <item.icon size={19} className={item.iconColor} />
              </div>
              <div>
                <p className="text-[15px] font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>

                {item.action?.variant === 'button' && (
                  <button
                    type="button"
                    className="mt-3 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {item.action.label}
                  </button>
                )}
                {item.action?.variant === 'badge' && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    {item.action.label}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">{item.time}</span>
              {item.unread && <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
            No notifications match your search.
          </div>
        )}
      </div>
    </div>
  )
}
