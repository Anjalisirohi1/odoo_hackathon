import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight, Info, Plus } from 'lucide-react'

const API_BASE = 'http://localhost:5000'

export default function AllocationTransfer() {
  const [assets, setAssets] = useState([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [asset, setAsset] = useState(null)
  const [holders, setHolders] = useState([])
  const [history, setHistory] = useState([])
  const [selectedHolderId, setSelectedHolderId] = useState('')
  const [reason, setReason] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadAssets() {
      try {
        const response = await fetch(`${API_BASE}/api/assets?status=ALLOCATED`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to load assets')
        setAssets(data)
        if (data.length > 0) {
          setSelectedAssetId(data[0].id)
        }
      } catch (error) {
        console.error(error)
        setStatusMessage('Unable to load assets. Please check the backend.')
      }
    }

    loadAssets()
  }, [])

  useEffect(() => {
    if (!selectedAssetId) {
      setAsset(null)
      setHolders([])
      setHistory([])
      return
    }

    async function loadTransferDetails() {
      try {
        const response = await fetch(`${API_BASE}/api/transfers/${selectedAssetId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Failed to load transfer data')

        const currentHolder = data.currentHolder
        setAsset({
          ...data.asset,
          current_holder_name: currentHolder?.name ?? 'Unassigned',
          current_holder_department: currentHolder?.department_id ? `Dept ${currentHolder.department_id}` : 'Department',
        })
        setHolders(data.eligibleHolders ?? [])
        setHistory(data.history ?? [])
        if ((data.eligibleHolders ?? []).length > 0) {
          setSelectedHolderId(data.eligibleHolders[0].id)
        } else {
          setSelectedHolderId('')
        }
      } catch (error) {
        console.error(error)
        setStatusMessage('Unable to load transfer details. Please check the backend.')
      }
    }

    loadTransferDetails()
  }, [selectedAssetId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE}/api/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          new_holder_id: selectedHolderId,
          reason,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not submit transfer request')
      setStatusMessage(data.message)
      setReason('')
    } catch (error) {
      console.error(error)
      setStatusMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Allocation & Transfer</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Submit transfer requests and review asset allocation history.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <label htmlFor="asset-selector" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Asset
            </label>
            <select
              id="asset-selector"
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900/40"
            >
              {assets.length === 0 ? (
                <option value="">No allocated assets found</option>
              ) : (
                assets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.asset_tag} — {item.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500">
            <Plus size={16} /> New transfer request
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Info size={14} /> Current Allocation
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Current Holder (From)</p>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{asset?.current_holder_name ?? 'Loading...'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{asset?.current_holder_department ?? 'Department'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Asset</p>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{asset?.asset_tag ?? 'AF-0000'}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{asset?.name ?? 'Asset Name'}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Serial: {asset?.serial_number ?? 'N/A'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Initiate Transfer Request</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label htmlFor="new-holder" className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Holder (To) *</label>
              <select
                id="new-holder"
                value={selectedHolderId}
                onChange={(e) => setSelectedHolderId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900/40"
              >
                {holders.map((holder) => (
                  <option key={holder.id} value={holder.id}>
                    {holder.name} — Dept {holder.department_id}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Transfer Reason *</label>
              <textarea
                id="reason"
                rows={5}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900/40"
                placeholder="Specify why this asset needs to be re-allocated (e.g., project change, department move)..."
              />
            </div>

            <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Request note</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This request will be sent to the current department head for approval.
              </p>
            </div>

            {statusMessage && (
              <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <ArrowRight size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Allocation History</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Recent transfers and allocation actions for this asset.</p>
          </div>
          <button className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">
            Export Log
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-300">
            <thead>
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Action</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Holder / Dept</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No allocation history available.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-4 py-4">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <ChevronRight size={16} className="text-blue-700" />
                      {item.action}
                    </td>
                    <td className="px-4 py-4">{item.holderName || 'Unknown'} / Dept {item.departmentId || '—'}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.condition ?? 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
