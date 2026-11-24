import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tm_token')
    if (!token) return setLoading(false)
    api.get('/auth/me')
      .then(({ data }) => setUser(data.data))
      .catch(() => localStorage.removeItem('tm_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('tm_token', data.data.token)
    setUser(data.data.user)
    return data
  }
  const register = async (values) => {
    const { data } = await api.post('/auth/register', values)
    localStorage.setItem('tm_token', data.data.token)
    setUser(data.data.user)
    return data
  }
  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    localStorage.removeItem('tm_token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
