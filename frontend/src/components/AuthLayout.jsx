export default function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundColor: '#f5f6fb',
        backgroundImage: 'radial-gradient(#d8dcec 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <div className="h-14 w-14 rounded-2xl bg-blue-700 flex items-center justify-center text-white font-semibold text-lg shadow-sm">
          AF
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">
          AssetFlow
        </h1>

        <div className="mt-8 w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {children}
        </div>

        <footer className="mt-10 text-center text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} AssetFlow Enterprise Asset Management. All rights reserved.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Security</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
