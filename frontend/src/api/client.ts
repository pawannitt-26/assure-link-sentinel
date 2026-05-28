import axios from 'axios'

function readEnv(key: string): string {
  try {
    const g: any = typeof globalThis !== 'undefined' ? globalThis : {}
    if (g && g.__ENV__ && typeof g.__ENV__[key] === 'string') return g.__ENV__[key]
    if (typeof window !== 'undefined') {
      const w: any = window
      if (w.__ENV__ && typeof w.__ENV__[key] === 'string') return w.__ENV__[key]
    }
  } catch {
    // ignore
  }
  try {
    // Vite injects env at build time when available
    const meta = (import.meta as any)?.env
    if (meta && typeof meta[key] === 'string' && meta[key]) return meta[key]
  } catch {
    // ignore — preview sandbox
  }
  return ''
}

function resolveApiUrl(): string {
  const raw = readEnv('VITE_API_URL')
  if (!raw) return '/api'
  const trimmed = raw.replace(/\/$/, '')
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const api = axios.create({
  baseURL: resolveApiUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers = config.headers || {}
      ;(config.headers as any).Authorization = 'Bearer ' + token
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
