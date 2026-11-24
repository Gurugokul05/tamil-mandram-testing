import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const unwrap = (promise) =>
  promise.then((response) => response.data?.data ?? response.data)
