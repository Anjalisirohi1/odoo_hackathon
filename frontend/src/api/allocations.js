import { apiRequest } from './client'

export function createAllocation(payload, token) {
  return apiRequest('/api/allocations', { method: 'POST', body: payload, token })
}
