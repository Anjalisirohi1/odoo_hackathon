export default function FormField({ id, label, icon: Icon, rightSlot, endAdornment, error, ...inputProps }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" size={18} />
        <input
          id={id}
          className={`w-full rounded-lg border bg-white pl-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${
            endAdornment ? 'pr-10' : 'pr-3'
          } ${error ? 'border-red-400' : 'border-slate-300'}`}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{endAdornment}</div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
