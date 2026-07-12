import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const navLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Assets', to: '/assets' },
  { label: 'Reporting', to: '/reports' },
]

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2)
  return initials.toUpperCase()
}

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-900">
      <Link to="/dashboard" className="text-xl font-bold text-blue-700 dark:text-blue-400">
        AssetFlow
      </Link>

      <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label="Search"
        >
          <Search size={19} />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Help
        </button>
        {user?.name && (
          <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-300 lg:inline">
            {user.name}
          </span>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="group flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white transition-colors hover:bg-red-600 dark:bg-blue-600 dark:hover:bg-red-600"
          aria-label="Sign out"
          title="Sign out"
        >
          <span className="group-hover:hidden">{getInitials(user?.name)}</span>
          <LogOut size={16} className="hidden group-hover:block" />
        </button>
      </div>
    </header>
  )
}
