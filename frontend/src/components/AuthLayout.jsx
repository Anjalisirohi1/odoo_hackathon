import { useTheme } from '../context/ThemeContext'

export default function AuthLayout({ children }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundColor: isDark ? '#020617' : '#f5f6fb',
        backgroundImage: `radial-gradient(${isDark ? '#1e293b' : '#d8dcec'} 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      }}
    >
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <div className="h-14 w-14 rounded-2xl bg-blue-700 dark:bg-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
          AF
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          AssetFlow
        </h1>

        <div className="mt-8 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {children}
        </div>

        <footer className="mt-10 text-center text-sm text-slate-400 dark:text-slate-500">
          <p>&copy; {new Date().getFullYear()} AssetFlow Enterprise Asset Management. All rights reserved.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Security</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
