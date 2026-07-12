import { useEffect, useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import RegisterAssetModal from '../components/assets/RegisterAssetModal'
import { useAuth } from '../context/AuthContext'
import { listAssets, getAssetSummary, listAssetCategories, listAssetDepartments } from '../api/assets'
import { ApiError } from '../api/client'
import {
  Plus,
  Search,
  Laptop,
  Armchair,
  DoorClosed,
  Package,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Banknote,
  UserCog,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

const ASSET_STATUSES = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']

const statusStyles = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  ALLOCATED: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  RESERVED: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  UNDER_MAINTENANCE: 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  RETIRED: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  DISPOSED: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

function formatStatusLabel(status) {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function getCategoryIcon(categoryName) {
  switch (categoryName) {
    case 'Furniture':
      return Armchair
    case 'Shared Spaces':
      return DoorClosed
    case 'Electronics':
      return Laptop
    default:
      return Package
  }
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const filtered = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result = []
  let prev = null
  for (const p of filtered) {
    if (prev !== null && p - prev > 1) result.push('…')
    result.push(p)
    prev = p
  }
  return result
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function Assets() {
  const { token } = useAuth()

  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [department, setDepartment] = useState('')
  const [page, setPage] = useState(1)

  const [assets, setAssets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [tableLoading, setTableLoading] = useState(true)
  const [tableError, setTableError] = useState(null)

  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [metaError, setMetaError] = useState(null)

  const loadMeta = () => {
    setMetaError(null)
    listAssetCategories(token)
      .then((data) => setCategories(data.categories))
      .catch((err) => setMetaError(err instanceof ApiError ? err.message : 'Failed to load categories/departments.'))
    listAssetDepartments(token)
      .then((data) => setDepartments(data.departments))
      .catch((err) => setMetaError(err instanceof ApiError ? err.message : 'Failed to load categories/departments.'))
  }

  useEffect(loadMeta, [token])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const refreshSummary = () => {
    setSummaryLoading(true)
    getAssetSummary(token)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false))
  }

  useEffect(refreshSummary, [token])

  useEffect(() => {
    setTableLoading(true)
    setTableError(null)
    listAssets({ search, category, status, department, page, limit: 20 }, token)
      .then((data) => {
        setAssets(data.assets)
        setPagination(data.pagination)
      })
      .catch((err) => {
        setTableError(err instanceof ApiError ? err.message : 'Failed to load assets.')
      })
      .finally(() => setTableLoading(false))
  }, [token, search, category, status, department, page])

  const handleClearFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategory('')
    setStatus('')
    setDepartment('')
    setPage(1)
  }

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const handleAssetCreated = () => {
    setShowModal(false)
    setPage(1)
    setTableLoading(true)
    listAssets({ search, category, status, department, page: 1, limit: 20 }, token)
      .then((data) => {
        setAssets(data.assets)
        setPagination(data.pagination)
      })
      .finally(() => setTableLoading(false))
    refreshSummary()
  }

  const hasActiveFilters = search || category || status || department

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Asset Directory</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage and track your organization's physical assets globally.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus size={16} />
          Register Asset
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by tag, serial, or QR code..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/40"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">FILTERS:</span>

          <select
            value={category}
            onChange={handleFilterChange(setCategory)}
            className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={handleFilterChange(setStatus)}
            className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <option value="">Status</option>
            {ASSET_STATUSES.map((s) => (
              <option key={s} value={s}>{formatStatusLabel(s)}</option>
            ))}
          </select>

          <select
            value={department}
            onChange={handleFilterChange(setDepartment)}
            className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {metaError && (
            <span className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle size={13} />
              {metaError}
              <button type="button" onClick={loadMeta} className="font-semibold underline">
                Retry
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <>
              <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-6 py-4">Tag</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    Loading assets…
                  </td>
                </tr>
              )}

              {!tableLoading && tableError && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-red-500">
                    <span className="inline-flex items-center gap-2">
                      <AlertCircle size={16} />
                      {tableError}
                    </span>
                  </td>
                </tr>
              )}

              {!tableLoading && !tableError && assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                    No assets match your filters.
                  </td>
                </tr>
              )}

              {!tableLoading && !tableError && assets.map((asset) => {
                const Icon = getCategoryIcon(asset.category)
                return (
                  <tr key={asset.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                        {asset.tag}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <Icon size={16} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{asset.category ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[asset.status] ?? statusStyles.ALLOCATED}`}>
                        {formatStatusLabel(asset.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{asset.location}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                        aria-label={`Actions for ${asset.tag}`}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {assets.length} of {pagination.total} assets
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={pagination.page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers(pagination.page, pagination.totalPages).map((p, index) =>
              p === '…' ? (
                <span key={`ellipsis-${index}`} className="px-1.5 text-sm text-slate-400 dark:text-slate-500">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === p
                      ? 'bg-blue-700 text-white dark:bg-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={pagination.page >= pagination.totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-500 dark:hover:bg-slate-800"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">TOTAL VALUATION</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60">
              <Banknote size={17} className="text-blue-700 dark:text-blue-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {summaryLoading ? '—' : formatCurrency(summary?.totalValuation ?? 0)}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Based on recorded acquisition cost</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">MAINTENANCE LOAD</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
              <UserCog size={17} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {summaryLoading ? '—' : `${summary?.maintenanceLoad?.openTickets ?? 0} Tickets`}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {summaryLoading ? ' ' : `${summary?.maintenanceLoad?.urgentTickets ?? 0} urgent interventions required`}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">ASSET HEALTH</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
              <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {summaryLoading ? '—' : `${summary?.assetHealth ?? 0}%`}
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${summary?.assetHealth ?? 0}%` }} />
          </div>
        </div>
      </div>

      {showModal && (
        <RegisterAssetModal
          categories={categories}
          categoriesError={metaError}
          onRetryCategories={loadMeta}
          onClose={() => setShowModal(false)}
          onCreated={handleAssetCreated}
        />
      )}
    </DashboardLayout>
  )
}
