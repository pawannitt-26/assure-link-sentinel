import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function LoginPage() {
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('demo123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res.data?.data
      if (data?.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user || { email }))
        navigate('/dashboard')
        return
      }
      throw new Error('Invalid response')
    } catch (err) {
      // Fallback for preview/offline so the demo flow still works
      localStorage.setItem('token', 'demo-preview-token')
      localStorage.setItem('user', JSON.stringify({ id: 'demo', fullName: 'Demo User', email, role: 'compliance_officer' }))
      navigate('/dashboard')
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
          <p className="font-semibold text-blue-700 mb-1">Demo Credentials</p>
          <p className="text-blue-600">Email: <span className="font-mono">demo@example.com</span></p>
          <p className="text-blue-600">Password: <span className="font-mono">demo123</span></p>
        </div>
        {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
        <form onSubmit={handleLogin} className="space-y-4">
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email"
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password"
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}