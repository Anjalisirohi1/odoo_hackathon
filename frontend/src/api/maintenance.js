import { apiRequest } from './client'

export function listMaintenanceRequests(token) {
  return apiRequest('/api/maintenance', { token })
}

export function createMaintenanceRequest(payload, token) {
  return apiRequest('/api/maintenance', { method: 'POST', body: payload, token })
}

export function updateMaintenanceRequest(id, payload, token) {
  return apiRequest(`/api/maintenance/${id}`, { method: 'PATCH', body: payload, token })
}
