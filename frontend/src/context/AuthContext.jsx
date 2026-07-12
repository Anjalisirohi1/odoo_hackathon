import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)
const TOKEN_KEY = 'assetflow-token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .getMe(token)
      .then((data) => setUser(data?.user ?? data))
      .catch(() => {
        setToken(null)
        window.localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => setLoading(false))
  }, [token])

  const persistToken = (nextToken) => {
    setToken(nextToken)
    if (nextToken) window.localStorage.setItem(TOKEN_KEY, nextToken)
    else window.localStorage.removeItem(TOKEN_KEY)
  }

  const login = async (email, password) => {
    const data = await authApi.login({ email, password })
    persistToken(data.token)
    setUser(data.user ?? null)
    return data
  }

  const signup = async (name, email, password) => {
    const data = await authApi.signup({ name, email, password })
    if (data?.token) {
      persistToken(data.token)
      setUser(data.user ?? null)
    }
    return data
  }

  const logout = () => {
    persistToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, isAuthenticated: Boolean(token), login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
