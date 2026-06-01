import axios from 'axios'
import { apiUrl } from '../lib/api'

const api = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  if (config.url) {
    config.url = apiUrl(config.url)
  }
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers = config.headers || {}
      ;(config.headers as Record<string, string>).Authorization = 'Bearer ' + token
    }
  } catch {
    // ignore
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      } catch {
        // ignore
      }
    }
    return Promise.reject(err)
  },
)

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || err.response?.data?.message || err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

export default api
