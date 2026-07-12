import DashboardLayout from '../components/dashboard/DashboardLayout'

export default function ComingSoon({ title }) {
  return (
    <DashboardLayout>
      <div className="flex h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">This section is coming soon.</p>
      </div>
    </DashboardLayout>
  )
}
