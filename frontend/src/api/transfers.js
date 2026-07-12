import { apiRequest } from './client'

export function getTransferDetails(assetId, token) {
  return apiRequest(`/api/transfers/${assetId}`, { token })
}

export function createTransferRequest(payload, token) {
  return apiRequest('/api/transfers', { method: 'POST', body: payload, token })
}
