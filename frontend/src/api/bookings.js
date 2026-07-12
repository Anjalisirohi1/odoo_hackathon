import { apiRequest } from './client'

export function listBookableResources(token) {
  return apiRequest('/api/bookings/resources', { token })
}

export function listBookingsByDate(assetId, date, token) {
  const query = new URLSearchParams({ assetId, date }).toString()
  return apiRequest(`/api/bookings?${query}`, { token })
}

export function listMyBookings(token) {
  return apiRequest('/api/bookings/mine', { token })
}

export function createBooking(payload, token) {
  return apiRequest('/api/bookings', { method: 'POST', body: payload, token })
}

export function cancelBooking(id, token) {
  return apiRequest(`/api/bookings/${id}/cancel`, { method: 'PATCH', token })
}

export function rescheduleBooking(id, payload, token) {
  return apiRequest(`/api/bookings/${id}`, { method: 'PATCH', body: payload, token })
}
