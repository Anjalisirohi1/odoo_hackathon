import { apiRequest } from './client'

export function signup({ name, email, password }) {
  return apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password } })
}

export function login({ email, password }) {
  return apiRequest('/api/auth/login', { method: 'POST', body: { email, password } })
}

export function getMe(token) {
  return apiRequest('/api/auth/me', { token })
}
