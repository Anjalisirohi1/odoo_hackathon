import { apiRequest } from './client'

export function getScreen9Analytics(token) {
  return apiRequest('/api/analytics/screen9', { token })
}
