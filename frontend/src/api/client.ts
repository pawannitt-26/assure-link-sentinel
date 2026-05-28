import axios from 'axios'

// Preview-safe: never reference import.meta at the top level. The App Preview
// loads files as classic scripts in some sandbox modes, which makes the token
// `import.meta` a SyntaxError before React can mount.

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
  return ''
}

const API_URL = readEnv('VITE_API_URL') || '/api'

const api = axios.create({
  baseURL: API_URL,
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
    if (err && err.response && err.response.status === 401) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } catch {
        // ignore
      }
    }
    return Promise.reject(err)
  },
)

export default api