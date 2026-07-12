import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import RescheduleBookingModal from '../components/bookings/RescheduleBookingModal'
import { useAuth } from '../context/AuthContext'
import { listBookableResources, listBookingsByDate, listMyBookings, createBooking, cancelBooking } from '../api/bookings'
import { ApiError } from '../api/client'
import { getEffectiveStatus, statusLabels, statusStyles, minutesUntil } from '../utils/bookingStatus'
import { AlertCircle, CheckCircle2, Plus, Bell, BellRing, X } from 'lucide-react'

const todayIso = () => new Date().toISOString().slice(0, 10)
const REMINDER_WINDOW_MINUTES = 15

export default function ResourceBooking() {
    const { token, user } = useAuth()
    const [resources, setResources] = useState([])
    const [selectedResourceId, setSelectedResourceId] = useState('')
    const [selectedDate, setSelectedDate] = useState(todayIso())
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resourcesError, setResourcesError] = useState('')

    const [myBookings, setMyBookings] = useState([])
    const [myBookingsLoading, setMyBookingsLoading] = useState(true)
    const [rescheduleTarget, setRescheduleTarget] = useState(null)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')
    const [bookingError, setBookingError] = useState('')
    const [bookingSuccess, setBookingSuccess] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Live clock so statuses/reminders stay accurate while the page is open
    const [, setTick] = useState(0)
    const notifiedRef = useRef(new Set())
    const [notifyPermission, setNotifyPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    )

    const hours = [
        { label: '8:00 AM', value: 8 },
        { label: '9:00 AM', value: 9 },
        { label: '10:00 AM', value: 10 },
        { label: '11:00 AM', value: 11 },
        { label: '12:00 PM', value: 12 },
        { label: '1:00 PM', value: 13 },
        { label: '2:00 PM', value: 14 },
        { label: '3:00 PM', value: 15 },
        { label: '4:00 PM', value: 16 },
    ]

    const loadMyBookings = () => {
        setMyBookingsLoading(true)
        listMyBookings(token)
            .then((data) => setMyBookings(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setMyBookingsLoading(false))
    }

    useEffect(() => {
        listBookableResources(token)
            .then((data) => {
                if (Array.isArray(data)) {
                    setResources(data)
                    if (data.length > 0) setSelectedResourceId(String(data[0].id))
                }
            })
            .catch((err) => setResourcesError(err instanceof ApiError ? err.message : 'Failed to load resources.'))
        loadMyBookings()
    }, [token])

    useEffect(() => {
        if (!selectedResourceId || !selectedDate) return
        setLoading(true)
        setError('')

        listBookingsByDate(selectedResourceId, selectedDate, token)
            .then((data) => setBookings(Array.isArray(data) ? data : []))
            .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to retrieve daily schedule.'))
            .finally(() => setLoading(false))
    }, [selectedResourceId, selectedDate, token])

    // Tick every 30s: refreshes computed statuses/countdowns and fires reminder notifications
    useEffect(() => {
        const interval = setInterval(() => {
            setTick((t) => t + 1)
            if (notifyPermission === 'granted') {
                myBookings.forEach((b) => {
                    if (getEffectiveStatus(b) !== 'UPCOMING') return
                    const mins = minutesUntil(b.start_time)
                    if (mins >= 0 && mins <= REMINDER_WINDOW_MINUTES && !notifiedRef.current.has(b.id)) {
                        notifiedRef.current.add(b.id)
                        new Notification('Upcoming booking', {
                            body: `${b.asset_name} starts in ${mins} minute${mins === 1 ? '' : 's'}.`,
                        })
                    }
                })
            }
        }, 30000)
        return () => clearInterval(interval)
    }, [myBookings, notifyPermission])

    const activeResource = resources.find((r) => r.id === parseInt(selectedResourceId, 10))

    const getBookingStyle = (startStr, endStr) => {
        const start = new Date(startStr)
        const end = new Date(endStr)
        const startHour = start.getHours() + start.getMinutes() / 60
        const endHour = end.getHours() + end.getMinutes() / 60
        const timelineStartHour = 8
        const timelineTotalHours = 8
        const top = ((startHour - timelineStartHour) / timelineTotalHours) * 100
        const height = ((endHour - startHour) / timelineTotalHours) * 100
        return { top: `${Math.max(0, top)}%`, height: `${Math.max(8, height)}%` }
    }

    const handleCreateBooking = async (e) => {
        e.preventDefault()
        setBookingError('')
        setBookingSuccess('')

        const startDateTime = `${selectedDate}T${startTime}:00`
        const endDateTime = `${selectedDate}T${endTime}:00`

        setSubmitting(true)
        try {
            const data = await createBooking(
                { asset_id: selectedResourceId, start_time: startDateTime, end_time: endDateTime },
                token
            )
            setBookingSuccess('Booking confirmed!')
            setBookings((prev) => [...prev, data.booking])
            loadMyBookings()
            setTimeout(() => {
                setIsModalOpen(false)
                setBookingSuccess('')
            }, 1500)
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                setBookingError(err.body?.conflictDetails?.message ?? err.message)
            } else {
                setBookingError(err instanceof ApiError ? err.message : 'Server connection lost.')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const handleCancel = async (booking) => {
        if (!window.confirm('Cancel this booking?')) return
        try {
            await cancelBooking(booking.id, token)
            setMyBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLED' } : b)))
            setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'CANCELLED' } : b)))
        } catch {
            // surfaced implicitly via unchanged state; row keeps its previous status
        }
    }

    const handleRescheduled = (updated) => {
        setMyBookings((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)))
        setBookings((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)))
        setRescheduleTarget(null)
    }

    const requestNotifyPermission = async () => {
        if (typeof Notification === 'undefined') return
        const result = await Notification.requestPermission()
        setNotifyPermission(result)
    }

    const activeMyBookings = myBookings.filter((b) => getEffectiveStatus(b) !== 'COMPLETED')
    const dueSoon = activeMyBookings.find(
        (b) => getEffectiveStatus(b) === 'UPCOMING' && minutesUntil(b.start_time) >= 0 && minutesUntil(b.start_time) <= REMINDER_WINDOW_MINUTES
    )

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Resource Booking</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                        Manage schedules and reservations for shared enterprise assets.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {notifyPermission === 'default' && (
                        <button
                            type="button"
                            onClick={requestNotifyPermission}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            <Bell size={15} />
                            Enable reminders
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={!selectedResourceId}
                        className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        <Plus size={16} />
                        Book a slot
                    </button>
                </div>
            </div>

            {dueSoon && (
                <div className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                    <BellRing size={16} className="shrink-0" />
                    Reminder: your booking for <span className="font-semibold">{dueSoon.asset_name}</span> starts in{' '}
                    <span className="font-semibold">{minutesUntil(dueSoon.start_time)} minute{minutesUntil(dueSoon.start_time) === 1 ? '' : 's'}</span>.
                </div>
            )}

            {resourcesError && (
                <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
                    <AlertCircle size={16} />
                    {resourcesError}
                </div>
            )}

            {!resourcesError && resources.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    No bookable resources are configured yet.
                </div>
            )}

            {resources.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-5">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                    Select Resource
                                </label>
                                <select
                                    value={selectedResourceId}
                                    onChange={(e) => setSelectedResourceId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                                >
                                    {resources.map((res) => (
                                        <option key={res.id} value={res.id}>{res.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                    Date Selector
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                    <span>Location</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeResource?.location ?? '—'}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                    <span>Tag</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeResource?.asset_tag ?? '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* My Bookings panel */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h4 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">My Bookings</h4>
                            {myBookingsLoading && <p className="text-xs text-slate-400 dark:text-slate-500">Loading…</p>}
                            {!myBookingsLoading && activeMyBookings.length === 0 && (
                                <p className="text-xs text-slate-400 dark:text-slate-500">No upcoming bookings.</p>
                            )}
                            <ul className="flex flex-col gap-3">
                                {activeMyBookings.map((b) => {
                                    const status = getEffectiveStatus(b)
                                    const canManage = status === 'UPCOMING' || status === 'ONGOING'
                                    return (
                                        <li key={b.id} className="rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{b.asset_name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {new Date(b.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} –{' '}
                                                        {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[status]}`}>
                                                    {statusLabels[status]}
                                                </span>
                                            </div>
                                            {canManage && (
                                                <div className="mt-2 flex gap-3 text-xs font-semibold">
                                                    <button type="button" onClick={() => setRescheduleTarget(b)} className="text-blue-700 hover:underline dark:text-blue-400">
                                                        Reschedule
                                                    </button>
                                                    <button type="button" onClick={() => handleCancel(b)} className="text-red-600 hover:underline dark:text-red-400">
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Timeline View</h3>
                                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                                    <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                                        <span className="h-3 w-3 rounded-full border border-blue-400 bg-blue-100 dark:bg-blue-950" /> Upcoming
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                        <span className="h-3 w-3 rounded-full border border-emerald-400 bg-emerald-100 dark:bg-emerald-950" /> Ongoing
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                        <span className="h-3 w-3 rounded-full border border-slate-300 bg-slate-100 dark:bg-slate-800" /> Completed
                                    </span>
                                </div>
                            </div>

                            {loading && <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading schedule…</p>}
                            {!loading && error && <p className="py-10 text-center text-sm text-red-500">{error}</p>}

                            {!loading && !error && (
                                <div className="relative space-y-12 border-l border-slate-100 py-2 pl-4 dark:border-slate-800">
                                    {hours.map((hour) => (
                                        <div key={hour.value} className="flex items-start border-b border-slate-50 pb-2 text-sm dark:border-slate-800/60">
                                            <span className="w-16 select-none font-medium text-slate-400 dark:text-slate-500">{hour.label}</span>
                                            <div className="min-h-[48px] flex-1" />
                                        </div>
                                    ))}

                                    <div className="pointer-events-none absolute bottom-12 left-20 right-4 top-4">
                                        {bookings.filter((b) => getEffectiveStatus(b) !== 'CANCELLED').map((booking) => {
                                            const style = getBookingStyle(booking.start_time, booking.end_time)
                                            const status = getEffectiveStatus(booking)
                                            const isMine = user && booking.user_id === user.id
                                            const cardTone =
                                                status === 'ONGOING'
                                                    ? 'border-emerald-600 bg-emerald-100/90 hover:bg-emerald-200/95 dark:border-emerald-500 dark:bg-emerald-950/60'
                                                    : status === 'COMPLETED'
                                                    ? 'border-slate-400 bg-slate-100/90 hover:bg-slate-200/90 dark:border-slate-600 dark:bg-slate-800/70'
                                                    : 'border-blue-600 bg-blue-100/90 hover:bg-blue-200/95 dark:border-blue-500 dark:bg-blue-950/60'
                                            const textTone =
                                                status === 'ONGOING'
                                                    ? 'text-emerald-900 dark:text-emerald-300'
                                                    : status === 'COMPLETED'
                                                    ? 'text-slate-700 dark:text-slate-300'
                                                    : 'text-blue-900 dark:text-blue-300'
                                            return (
                                                <div
                                                    key={booking.id}
                                                    style={style}
                                                    className={`pointer-events-auto absolute left-0 right-0 rounded-r-lg border-l-4 p-3 shadow-sm transition ${cardTone}`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h4 className={`text-sm font-bold ${textTone}`}>
                                                                {statusLabels[status]} - {booking.booked_by || 'Staff'}
                                                            </h4>
                                                            <p className={`mt-0.5 text-xs ${textTone}`}>
                                                                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                                                {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        {isMine && (status === 'UPCOMING' || status === 'ONGOING') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCancel(booking)}
                                                                aria-label="Cancel booking"
                                                                className={`shrink-0 ${textTone} opacity-70 hover:opacity-100`}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="bg-blue-700 p-6 text-white dark:bg-blue-600">
                            <h3 className="text-lg font-bold">Reserve Resource</h3>
                            <p className="mt-1 text-xs text-blue-100">
                                Currently reserving for {activeResource?.name || 'Asset'}
                            </p>
                        </div>

                        <form onSubmit={handleCreateBooking} className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Start Time</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-900/40"
                                        required
                                    />
                                </div>
                            </div>

                            {bookingError && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium leading-relaxed text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                    <span><span className="font-bold">Conflict identified:</span> {bookingError}</span>
                                </div>
                            )}

                            {bookingSuccess && (
                                <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    <CheckCircle2 size={14} />
                                    {bookingSuccess}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        setBookingError('')
                                    }}
                                    className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
                                >
                                    {submitting ? 'Confirming…' : 'Confirm Slot'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {rescheduleTarget && (
                <RescheduleBookingModal
                    booking={rescheduleTarget}
                    onClose={() => setRescheduleTarget(null)}
                    onRescheduled={handleRescheduled}
                />
            )}
        </DashboardLayout>
    )
}
