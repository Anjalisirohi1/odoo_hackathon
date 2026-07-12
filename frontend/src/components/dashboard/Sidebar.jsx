import { NavLink } from 'react-router-dom'
import {
  LayoutGrid,
  Building2,
  Package,
  ArrowLeftRight,
  BookMarked,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutGrid, to: '/dashboard' },
  { label: 'Organization setup', icon: Building2, to: '/organization-setup' },
  { label: 'Assets', icon: Package, to: '/assets' },
  { label: 'Allocation & Transfer', icon: ArrowLeftRight, to: '/allocation-transfer' },
  { label: 'Resource Booking', icon: BookMarked, to: '/resource-booking' },
  { label: 'Maintenance', icon: Wrench, to: '/maintenance' },
  { label: 'Audit', icon: ClipboardCheck, to: '/audit' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
]

export default function Sidebar({ storageUsedPercent = 62 }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900">
      <nav className="flex flex-col gap-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-700 text-white dark:bg-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Storage Used</p>
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-1.5 rounded-full bg-blue-700 dark:bg-blue-500"
            style={{ width: `${storageUsedPercent}%` }}
          />
        </div>
        <a
          href="#"
          className="mt-2 inline-block text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          Upgrade for more capacity
        </a>
      </div>
    </aside>
  )
}
