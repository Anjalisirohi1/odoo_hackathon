import { apiRequest } from './client'

export function listAssets(params, token) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ).toString()
  return apiRequest(`/api/assets${query ? `?${query}` : ''}`, { token })
}

export function getAssetSummary(token) {
  return apiRequest('/api/assets/summary', { token })
}

export function listAssetCategories(token) {
  return apiRequest('/api/assets/categories', { token })
}

export function listAssetDepartments(token) {
  return apiRequest('/api/assets/departments', { token })
}

export function createAsset(payload, token) {
  return apiRequest('/api/assets', { method: 'POST', body: payload, token })
}
