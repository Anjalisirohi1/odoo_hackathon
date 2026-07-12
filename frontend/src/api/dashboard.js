import { apiRequest } from './client'

export function getDashboardStats(token) {
  return apiRequest('/api/dashboard/stats', { token })
}
