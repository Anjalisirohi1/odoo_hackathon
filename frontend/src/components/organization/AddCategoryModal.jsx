import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { createAssetCategory } from '../../api/assets'
import { ApiError } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40'

export default function AddCategoryModal({ onClose, onCreated }) {
  const { token } = useAuth()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Category name is required.')
      return
    }
    setSubmitting(true)
    try {
      const { category } = await createAssetCategory({ name: name.trim() }, token)
      onCreated({ ...category, assetCount: 0 })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Category</h2>
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

          <label htmlFor="category-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Category Name
          </label>
          <input
            id="category-name"
            type="text"
            placeholder="e.g. Furniture"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />

          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500">
              {submitting ? 'Adding…' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
