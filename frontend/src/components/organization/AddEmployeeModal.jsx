import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { signup } from '../../api/auth'
import { ApiError } from '../../api/client'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40'

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

const initialForm = { name: '', email: '', password: '' }

export default function AddEmployeeModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email, and a temporary password are all required.')
      return
    }
    setSubmitting(true)
    try {
      const { user } = await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      onCreated(user)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Employee</h2>
          <button type="button" onClick={onClose} className="text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="emp-name" className={labelClass}>Full Name</label>
              <input id="emp-name" name="name" type="text" placeholder="e.g. Priya Shah" value={form.name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="emp-email" className={labelClass}>Corporate Email</label>
              <input id="emp-email" name="email" type="email" placeholder="name@company.com" value={form.email} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="emp-password" className={labelClass}>Temporary Password</label>
              <input id="emp-password" name="password" type="text" placeholder="Shared with the employee to sign in" value={form.password} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            New accounts start with the Employee role. Assign a role or department from the table after creation.
          </p>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500">
              {submitting ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
