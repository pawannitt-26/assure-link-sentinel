import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { apiErrorMessage } from '../api/client'

type Run = {
  id: string
  name: string
  compliance_threshold: string
  status: string
  created_at: string
  critical_count?: number
  high_count?: number
  medium_count?: number
  low_count?: number
}

function accentFor(run: { critical_count?: number; high_count?: number; status?: string }) {
  if ((run.critical_count || 0) > 0) return '#dc2626'
  if ((run.high_count || 0) > 0) return '#ea580c'
  if (run.status === 'failed') return '#6b7280'
  return '#16a34a'
}

export default function RunsPage() {
  const [threshold, setThreshold] = useState(() => localStorage.getItem('compliance_threshold') || 'standard')
  const [name, setName] = useState('')
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/compliance-runs', { params: { page: 1, perPage: 100 } })
      .then(res => {
        const items = res.data?.data?.items
        if (Array.isArray(items)) setRuns(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError('')
    try {
      await api.post('/compliance-runs', { name, complianceThreshold: threshold, status: 'pending' })
      setName('')
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to create run'))
    } finally {
      setCreating(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put('/compliance-runs/' + id, { status })
      setRuns(prev => prev.map(r => (r.id === id ? { ...r, status } : r)))
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to update run'))
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this compliance run?')) return
    try {
      await api.delete('/compliance-runs/' + id)
      load()
    } catch (err) {
      alert(apiErrorMessage(err, 'Delete failed'))
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
        {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}
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
          <button onClick={create} disabled={creating || !name.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm disabled:opacity-60">{creating ? 'Creating…' : 'Run Analysis'}</button>
        </div>
      </div>
      {loading ? (
        <p className="text-center text-gray-500 text-sm py-8">Loading runs…</p>
      ) : runs.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-8">No compliance runs yet.</p>
      ) : (
        <div className="grid gap-3">
          {runs.map(run => (
            <div key={run.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between gap-4 flex-wrap">
              <Link to="/findings" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80">
                <span className="h-12 w-1 rounded-full shrink-0" style={{ backgroundColor: accentFor(run) }} aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{run.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Threshold: {run.compliance_threshold} · {String(run.created_at).slice(0, 10)}</p>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700">C: {run.critical_count || 0}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-50 text-orange-700">H: {run.high_count || 0}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-50 text-yellow-700">M: {run.medium_count || 0}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700">L: {run.low_count || 0}</span>
                <select
                  value={run.status}
                  onChange={e => updateStatus(run.id, e.target.value)}
                  className="ml-2 border rounded-lg px-2 py-1 text-xs bg-white"
                >
                  <option value="pending">pending</option>
                  <option value="in_progress">in_progress</option>
                  <option value="completed">completed</option>
                  <option value="failed">failed</option>
                </select>
                <button onClick={() => remove(run.id)} className="text-xs font-bold text-red-600 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
