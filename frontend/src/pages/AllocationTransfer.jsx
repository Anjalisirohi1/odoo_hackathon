import { useEffect, useState } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { listAssets } from '../api/assets'
import { getTransferDetails, createTransferRequest } from '../api/transfers'
import { createAllocation } from '../api/allocations'
import { ApiError } from '../api/client'
import { downloadCsv } from '../utils/csv'
import { ArrowRight, ChevronRight, Info, AlertCircle, CheckCircle2, UserPlus, ArrowLeftRight } from 'lucide-react'

export default function AllocationTransfer() {
  const { token } = useAuth()
  const [assets, setAssets] = useState([])
  const [assetsError, setAssetsError] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [asset, setAsset] = useState(null)
  const [hasHolder, setHasHolder] = useState(false)
  const [holders, setHolders] = useState([])
  const [history, setHistory] = useState([])
  const [selectedHolderId, setSelectedHolderId] = useState('')
  const [reason, setReason] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [statusMessage, setStatusMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadAssets = () => {
    Promise.all([
      listAssets({ status: 'AVAILABLE', limit: 100 }, token),
      listAssets({ status: 'ALLOCATED', limit: 100 }, token),
    ])
      .then(([available, allocated]) => {
        const combined = [
          ...allocated.assets.map((a) => ({ ...a, group: 'Allocated (transfer)' })),
          ...available.assets.map((a) => ({ ...a, group: 'Available (allocate)' })),
        ]
        setAssets(combined)
        if (combined.length > 0) setSelectedAssetId((prev) => prev || String(combined[0].id))
      })
      .catch((err) => setAssetsError(err instanceof ApiError ? err.message : 'Unable to load assets.'))
  }

  useEffect(loadAssets, [token])

  const loadDetails = () => {
    if (!selectedAssetId) {
      setAsset(null)
      setHolders([])
      setHistory([])
      return
    }

    setDetailsError('')
    getTransferDetails(selectedAssetId, token)
      .then((data) => {
        const currentHolder = data.currentHolder
        setHasHolder(Boolean(currentHolder))
        setAsset({
          ...data.asset,
          current_holder_name: currentHolder?.name ?? 'Unassigned',
          current_holder_department: currentHolder?.department_name ?? 'No department on file',
        })
        setHolders(data.eligibleHolders ?? [])
        setHistory(data.history ?? [])
        setSelectedHolderId(data.eligibleHolders?.[0]?.id ? String(data.eligibleHolders[0].id) : '')
        setReason('')
        setExpectedReturnDate('')
      })
      .catch((err) => setDetailsError(err instanceof ApiError ? err.message : 'Unable to load allocation details.'))
  }

  useEffect(loadDetails, [selectedAssetId, token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMessage(null)
    setIsSubmitting(true)

    try {
      if (hasHolder) {
        const data = await createTransferRequest(
          { asset_id: selectedAssetId, new_holder_id: selectedHolderId, reason },
          token
        )
        setStatusMessage({ type: 'success', text: data.message })
      } else {
        const data = await createAllocation(
          { asset_id: selectedAssetId, employee_id: selectedHolderId, expected_return_at: expectedReturnDate || null },
          token
        )
        setStatusMessage({ type: 'success', text: data.message })
        loadDetails()
        loadAssets()
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof ApiError ? err.message : 'Could not submit request.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportLog = () => {
    downloadCsv(`transfer-history-${asset?.asset_tag ?? 'asset'}.csv`, history, [
      { label: 'Date', value: (r) => new Date(r.date).toLocaleDateString() },
      { label: 'From', value: (r) => r.fromName ?? '' },
      { label: 'To', value: (r) => r.toName ?? '' },
      { label: 'Requested By', value: (r) => r.requestedByName ?? '' },
      { label: 'Status', value: (r) => r.status },
    ])
  }

  const availableAssets = assets.filter((a) => a.group === 'Available (allocate)')
  const allocatedAssets = assets.filter((a) => a.group === 'Allocated (transfer)')

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Allocation & Transfer</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Allocate available assets to employees, or transfer already-allocated ones.
          </p>
        </div>
        <div>
          <label htmlFor="asset-selector" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Select Asset
          </label>
          <select
            id="asset-selector"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="mt-2 w-full min-w-[280px] rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
          >
            {assets.length === 0 && <option value="">No assets found</option>}
            {allocatedAssets.length > 0 && (
              <optgroup label="Allocated — transfer to someone else">
                {allocatedAssets.map((item) => (
                  <option key={item.id} value={item.id}>{item.tag} — {item.name}</option>
                ))}
              </optgroup>
            )}
            {availableAssets.length > 0 && (
              <optgroup label="Available — allocate to an employee">
                {availableAssets.map((item) => (
                  <option key={item.id} value={item.id}>{item.tag} — {item.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {assetsError && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle size={16} />
          {assetsError}
        </div>
      )}

      {!assetsError && assets.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          No assets available to allocate or transfer right now.
        </div>
      )}

      {detailsError && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle size={16} />
          {detailsError}
        </div>
      )}

      {assets.length > 0 && !detailsError && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
            {hasHolder ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <Info size={14} /> Current Allocation
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Info size={14} /> Available for Allocation
              </span>
            )}

            {hasHolder && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">Current Holder (From)</p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{asset?.current_holder_name ?? 'Loading…'}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{asset?.current_holder_department ?? 'Department'}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">Asset</p>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{asset?.asset_tag ?? 'AF-0000'}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{asset?.name ?? 'Asset Name'}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Serial: {asset?.serial_number ?? 'N/A'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {hasHolder ? <ArrowLeftRight size={18} className="text-blue-700 dark:text-blue-400" /> : <UserPlus size={18} className="text-emerald-600 dark:text-emerald-400" />}
              {hasHolder ? 'Initiate Transfer Request' : 'Allocate to Employee'}
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="new-holder" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {hasHolder ? 'New Holder (To) *' : 'Assign To *'}
                </label>
                <select
                  id="new-holder"
                  value={selectedHolderId}
                  onChange={(e) => setSelectedHolderId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                >
                  <option value="">Select a person</option>
                  {holders.map((holder) => (
                    <option key={holder.id} value={holder.id}>
                      {holder.name}{holder.department_id ? ` — Dept ${holder.department_id}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {hasHolder ? (
                <div className="space-y-2">
                  <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Transfer Reason *</label>
                  <textarea
                    id="reason"
                    rows={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                    placeholder="Specify why this asset needs to be re-allocated (e.g., project change, department move)..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="expected-return" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Expected Return Date</label>
                  <input
                    id="expected-return"
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500">Optional — leave blank for an open-ended allocation.</p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Request note</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {hasHolder
                    ? 'This request will be recorded as pending until an admin or department head approves it.'
                    : 'The asset will be marked Allocated immediately once assigned.'}
                </p>
              </div>

              {statusMessage && (
                <div
                  className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                    statusMessage.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400'
                  }`}
                >
                  {statusMessage.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                  {statusMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedHolderId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <ArrowRight size={16} />
                {isSubmitting ? 'Submitting…' : hasHolder ? 'Submit Request' : 'Allocate Asset'}
              </button>
            </form>
          </section>
        </div>
      )}

      {asset && (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Allocation History</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent transfer requests for this asset.</p>
            </div>
            <button
              type="button"
              onClick={handleExportLog}
              disabled={history.length === 0}
              className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50 disabled:no-underline dark:text-blue-400"
            >
              Export Log
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">From → To</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Requested By</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                      No transfer requests yet for this asset.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-4">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <span className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                          {item.fromName ?? 'Unassigned'}
                          <ChevronRight size={14} className="text-slate-400" />
                          {item.toName ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-4">{item.requestedByName ?? '—'}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardLayout>
  )
}
