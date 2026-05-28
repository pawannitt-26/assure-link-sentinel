import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { apiErrorMessage } from '../api/client'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('demo123')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res =
        mode === 'login'
          ? await api.post('/auth/login', { email, password })
          : await api.post('/auth/register', { email, password, fullName })
      const data = res.data?.data
      if (!data?.token) throw new Error('Invalid response from server')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user || { email }))
      navigate('/dashboard')
    } catch (err) {
      setError(apiErrorMessage(err, mode === 'login' ? 'Login failed' : 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">AG</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AssureLink Guardian</h1>
            <p className="text-xs text-gray-500">Compliance Monitoring Platform</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => { setMode('login'); setError('') }}
            className={'flex-1 py-2 rounded-md text-sm font-bold transition-colors ' + (mode === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600')}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError('') }}
            className={'flex-1 py-2 rounded-md text-sm font-bold transition-colors ' + (mode === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600')}
          >
            Sign Up
          </button>
        </div>

        {mode === 'login' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
            <p className="font-semibold text-blue-700 mb-1">Demo Credentials</p>
            <p className="text-blue-600">Email: <span className="font-mono">demo@example.com</span></p>
            <p className="text-blue-600">Password: <span className="font-mono">demo123</span></p>
          </div>
        )}

        {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              type="text"
              placeholder="Full name"
              required
              className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
            minLength={mode === 'register' ? 6 : 1}
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  )
}
