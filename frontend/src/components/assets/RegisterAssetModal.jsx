import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { createAsset } from '../../api/assets'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const CONDITIONS = ['New', 'Excellent', 'Good', 'Fair', 'Damaged']

const initialForm = {
  name: '',
  category_id: '',
  serial_number: '',
  acquisition_date: new Date().toISOString().slice(0, 10),
  acquisition_cost: '',
  condition: 'New',
  location: '',
  is_bookable: false,
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40'

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300'

export default function RegisterAssetModal({ categories, categoriesError, onRetryCategories, onClose, onCreated }) {
  const { token } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.acquisition_date || !form.condition || !form.location.trim()) {
      setError('Name, acquisition date, condition, and location are required.')
      return
    }

    setSubmitting(true)
    try {
      const { asset } = await createAsset(
        {
          name: form.name.trim(),
          category_id: form.category_id ? Number(form.category_id) : null,
          serial_number: form.serial_number.trim() || null,
          acquisition_date: form.acquisition_date,
          acquisition_cost: form.acquisition_cost ? Number(form.acquisition_cost) : null,
          condition: form.condition,
          location: form.location.trim(),
          is_bookable: form.is_bookable,
        },
        token
      )
      onCreated(asset)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Register Asset</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="name" className={labelClass}>Asset Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="MacBook Pro"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category_id" className={labelClass}>Category</label>
                <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange} className={inputClass}>
                  <option value="">{categoriesError ? 'Unavailable' : 'Select category'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {categoriesError && (
                  <p className="mt-1 text-xs text-red-500">
                    Couldn't load categories.{' '}
                    <button type="button" onClick={onRetryCategories} className="font-semibold underline">
                      Retry
                    </button>
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="condition" className={labelClass}>Condition</label>
                <select id="condition" name="condition" value={form.condition} onChange={handleChange} className={inputClass}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="serial_number" className={labelClass}>Serial Number</label>
                <input
                  id="serial_number"
                  name="serial_number"
                  type="text"
                  placeholder="SN-MAC-1234"
                  value={form.serial_number}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="acquisition_cost" className={labelClass}>Acquisition Cost</label>
                <input
                  id="acquisition_cost"
                  name="acquisition_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2400.00"
                  value={form.acquisition_cost}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="acquisition_date" className={labelClass}>Acquisition Date</label>
                <input
                  id="acquisition_date"
                  name="acquisition_date"
                  type="date"
                  value={form.acquisition_date}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Bangalore Office"
                  value={form.location}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                name="is_bookable"
                checked={form.is_bookable}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
              />
              Bookable resource
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {submitting ? 'Registering…' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
