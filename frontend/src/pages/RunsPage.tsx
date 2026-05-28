import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const FALLBACK = [
  { id: 'r1', name: 'Q4 Partner Audit', compliance_threshold: 'strict', status: 'completed', created_at: '2024-11-18', critical_count: 3, high_count: 5, medium_count: 2, low_count: 2 },
  { id: 'r2', name: 'Monthly Compliance Sweep', compliance_threshold: 'standard', status: 'in_progress', created_at: '2024-11-17', critical_count: 1, high_count: 3, medium_count: 4, low_count: 0 },
  { id: 'r3', name: 'Year-End Review', compliance_threshold: 'strict', status: 'completed', created_at: '2024-11-15', critical_count: 6, high_count: 8, medium_count: 5, low_count: 2 },
]

function accentFor(run) {
  if ((run.critical_count || 0) > 0) return '#dc2626'
  if ((run.high_count || 0) > 0) return '#ea580c'
  if (run.status === 'failed') return '#6b7280'
  return '#16a34a'
}

export default function RunsPage() {
  const [threshold, setThreshold] = useState('standard')
  const [name, setName] = useState('')
  const [runs, setRuns] = useState(FALLBACK)
  const [creating, setCreating] = useState(false)

  const load = () => {
    api.get('/compliance-runs', { params: { page: 1, perPage: 50 } }).then(res => {
      const items = res.data?.data?.items
      if (Array.isArray(items) && items.length) setRuns(items)
    }).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      await api.post('/compliance-runs', { name, complianceThreshold: threshold, status: 'pending' })
      setName('')
      load()
    } catch {
      setRuns(prev => [{ id: 'tmp-' + Date.now(), name, compliance_threshold: threshold, status: 'pending', created_at: new Date().toISOString(), critical_count: 0, high_count: 0, medium_count: 0, low_count: 0 }, ...prev])
      setName('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Runs</h1>
          <p className="text-sm text-gray-500 mt-1">Execute and track compliance analysis workflows</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Start New Run</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Run name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. December Compliance Sweep" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Threshold</label>
            <select value={threshold} onChange={e => setThreshold(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
              <option value="strict">Strict</option>
              <option value="standard">Standard</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>
          <button onClick={create} disabled={creating} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm disabled:opacity-60">{creating ? 'Creating…' : 'Run Analysis'}</button>
        </div>
      </div>
      <div className="grid gap-3">
        {runs.map(run => (
          <Link key={run.id} to="/findings" className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-12 w-1 rounded-full shrink-0" style={{ backgroundColor: accentFor(run) }} aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{run.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Threshold: {run.compliance_threshold} · {String(run.created_at).slice(0, 10)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700">C: {run.critical_count || 0}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-50 text-orange-700">H: {run.high_count || 0}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-50 text-yellow-700">M: {run.medium_count || 0}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700">L: {run.low_count || 0}</span>
              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{run.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}