export default function FormField({ id, label, icon: Icon, rightSlot, endAdornment, error, ...inputProps }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" size={18} />
        <input
          id={id}
          className={`w-full rounded-lg border bg-white dark:bg-slate-800 pl-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 ${
            endAdornment ? 'pr-10' : 'pr-3'
          } ${error ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{endAdornment}</div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
