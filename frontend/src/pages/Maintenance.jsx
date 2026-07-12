import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { listAssets } from '../api/assets'
import { listMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest } from '../api/maintenance'
import { ApiError } from '../api/client'
import { Search, Plus, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react'

const priorities = ['LOW', 'MEDIUM', 'HIGH']
const statusOptions = ['ALL', 'PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']
const managedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED']
const canManageRoles = ['ADMIN', 'ASSET_MANAGER']

const statusBadge = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  TECHNICIAN_ASSIGNED: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  IN_PROGRESS: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
}

const Maintenance = () => {
  const { token, user } = useAuth()
  const [requests, setRequests] = useState([])
  const [assets, setAssets] = useState([])
  const [formData, setFormData] = useState({ asset_id: '', issue_description: '', priority: 'MEDIUM' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  const canManage = canManageRoles.includes(user?.role)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [assetsData, requestsData] = await Promise.all([
          listAssets({ limit: 100 }, token),
          listMaintenanceRequests(token),
        ])
        setAssets(assetsData.assets)
        setRequests(requestsData)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load maintenance data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [token])

  const summary = useMemo(() => {
    const pending = requests.filter((request) => request.status === 'PENDING').length
    const inProgress = requests.filter((request) => ['TECHNICIAN_ASSIGNED', 'IN_PROGRESS'].includes(request.status)).length
    const resolved = requests.filter((request) => request.status === 'RESOLVED').length
    return { total: requests.length, pending, inProgress, resolved }
  }, [requests])

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        search.trim() === '' ||
        `${request.asset_name ?? request.asset_tag ?? ''} ${request.issue_description} ${request.raised_by_name ?? ''}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [requests, search, statusFilter])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatusMessage('')
    setIsSubmitting(true)

    try {
      const data = await createMaintenanceRequest(formData, token)
      setRequests((prev) => [data.request, ...prev])
      setFormData({ asset_id: '', issue_description: '', priority: 'MEDIUM' })
      setStatusMessage('Maintenance request created successfully.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (requestId, status) => {
    const previous = requests
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)))
    try {
      await updateMaintenanceRequest(requestId, { status }, token)
    } catch (err) {
      setRequests(previous)
      setError(err instanceof ApiError ? err.message : 'Failed to update status.')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Maintenance</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Monitor maintenance requests and raise new service tickets for asset repairs with full team visibility.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Wrench size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Open maintenance requests</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track status and next action for active tickets.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total requests</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending review</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{summary.pending}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">In progress</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{summary.inProgress}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">Resolved</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{summary.resolved}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick filters</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Refine requests by status or search term.</p>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Search requests</label>
                <div className="relative mt-2">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by asset, issue, or requester"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      statusFilter === status
                        ? 'bg-blue-700 text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredRequests.length}</span> of{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{requests.length}</span> requests
              </div>
            </div>
          </div>
        </div>
      </div>

      {(error || statusMessage) && (
        <div className="mt-5 flex flex-col gap-3">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              {statusMessage}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create request</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Raise a new maintenance ticket for the selected asset.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Asset</label>
              <select
                name="asset_id"
                value={formData.asset_id}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
              >
                <option value="">Choose an asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.tag} — {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Issue description</label>
              <textarea
                name="issue_description"
                rows="5"
                value={formData.issue_description}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                placeholder="Describe the fault, error, or repair action needed"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">Request guidance</p>
              <p className="mt-1">Requests are routed to admins and asset managers for scheduling and approval.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Plus size={16} />
              {isSubmitting ? 'Creating request…' : 'Create maintenance request'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Request queue</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review the latest maintenance tickets and their current statuses.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {filteredRequests.length} results
            </div>
          </div>

          <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading requests…</div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">No maintenance requests match the current filter.</div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadge[request.status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{request.asset_name ?? request.asset_tag ?? 'Unknown asset'}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{request.issue_description}</p>
                    {request.technician_name && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">Technician: {request.technician_name}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-3 text-sm text-slate-500 dark:text-slate-400 sm:items-end sm:text-right">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Raised by</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{request.raised_by_name ?? 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Priority</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{request.priority}</p>
                    </div>
                    {canManage && (
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request.id, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-900/40"
                      >
                        {managedStatuses.map((status) => (
                          <option key={status} value={status}>{status.replace('_', ' ')}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default Maintenance
