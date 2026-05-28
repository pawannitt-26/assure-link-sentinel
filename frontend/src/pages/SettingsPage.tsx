import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const INTEGRATIONS = [
  { id: 'zoho', name: 'Zoho CRM', desc: 'Partner records, contacts, custom fields', status: 'connected', accent: '#16a34a' },
  { id: 'agenty', name: 'Agenty', desc: 'Usage reports and analytics', status: 'connected', accent: '#16a34a' },
  { id: 'dialpad', name: 'Dialpad', desc: 'Scheduled report delivery endpoints', status: 'connected', accent: '#16a34a' },
  { id: 'gemini', name: 'GeminiAI', desc: 'Compliance anomaly analysis & report generation', status: 'connected', accent: '#16a34a' },
]

const THRESHOLD_KEY = 'compliance_threshold'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ fullName?: string; name?: string; email?: string; role?: string }>({})
  const [threshold, setThreshold] = useState('standard')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'))
      setThreshold(localStorage.getItem(THRESHOLD_KEY) || 'standard')
    } catch {
      // ignore
    }
    api.get('/auth/me').then(res => {
      const data = res.data?.data
      if (data) {
        setUser(data)
        localStorage.setItem('user', JSON.stringify(data))
      }
    }).catch(() => {})
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const saveThreshold = () => {
    localStorage.setItem(THRESHOLD_KEY, threshold)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Account, integrations, and compliance preferences</p>
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Account</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-500 text-xs">Name</p><p className="font-semibold text-gray-900">{user.fullName || user.name || '—'}</p></div>
          <div><p className="text-gray-500 text-xs">Email</p><p className="font-semibold text-gray-900">{user.email || '—'}</p></div>
        </div>
        <button onClick={logout} className="mt-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 font-bold text-sm">Sign Out</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Integrations</h2>
        <div className="grid gap-3">
          {INTEGRATIONS.map(int => (
            <div key={int.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="h-8 w-1 rounded-full" style={{ backgroundColor: int.accent }} aria-hidden />
                <div>
                  <p className="font-semibold text-gray-900">{int.name}</p>
                  <p className="text-xs text-gray-500">{int.desc}</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{int.status}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Integration connections are configured server-side.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-bold text-gray-900 mb-3">Default Compliance Threshold</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <select value={threshold} onChange={e => setThreshold(e.target.value)} className="border rounded-lg px-3 py-2 bg-white flex-1 min-w-[200px]">
            <option value="strict">Strict — flag all minor deviations</option>
            <option value="standard">Standard — flag moderate and above</option>
            <option value="relaxed">Relaxed — flag only critical deviations</option>
          </select>
          <button onClick={saveThreshold} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Used as the default when starting new compliance runs.</p>
      </div>
    </div>
  )
}
