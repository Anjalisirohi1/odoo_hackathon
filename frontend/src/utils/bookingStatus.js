export function getEffectiveStatus(booking) {
  if (booking.status === 'CANCELLED') return 'CANCELLED'
  const now = new Date()
  const start = new Date(booking.start_time)
  const end = new Date(booking.end_time)
  if (now < start) return 'UPCOMING'
  if (now >= start && now <= end) return 'ONGOING'
  return 'COMPLETED'
}

export const statusLabels = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const statusStyles = {
  UPCOMING: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  ONGOING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  COMPLETED: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-red-100 text-red-600 line-through dark:bg-red-950/50 dark:text-red-400',
}

export function minutesUntil(startTime) {
  return Math.round((new Date(startTime).getTime() - Date.now()) / 60000)
}
