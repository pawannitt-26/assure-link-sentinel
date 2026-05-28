import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

type Stats = { critical: number; high: number; medium: number; low: number }
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

const ACCENTS = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a' }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ critical: 0, high: 0, medium: 0, low: 0 })
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api
      .get('/dashboard/stats')
      .then(res => {
        if (!alive) return
        const d = res.data?.data
        if (d?.stats) setStats(d.stats)
        if (Array.isArray(d?.recentRuns)) setRuns(d.recentRuns)
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const statCards = [
    { id: 'critical', label: 'Critical Findings', value: stats.critical, accent: ACCENTS.critical },
    { id: 'high', label: 'High Risk', value: stats.high, accent: ACCENTS.high },
    { id: 'medium', label: 'Medium Risk', value: stats.medium, accent: ACCENTS.medium },
    { id: 'low', label: 'Low Risk', value: stats.low, accent: ACCENTS.low },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time overview of partner compliance posture</p>
        </div>
        <Link to="/runs" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">New Compliance Run</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: card.accent }} aria-hidden />
              <span className="text-xs font-medium text-gray-500 uppercase">{card.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? '…' : card.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Compliance Runs</h2>
          <Link to="/runs" className="text-sm text-blue-600 hover:text-blue-700 font-bold">View all →</Link>
        </div>
        {loading ? (
          <p className="p-8 text-center text-gray-500 text-sm">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">No runs yet. <Link to="/runs" className="text-blue-600 font-bold">Start one</Link></p>
        ) : (
          <div className="divide-y">
            {runs.map(run => (
              <div key={run.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{run.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Threshold: {run.compliance_threshold} · C:{run.critical_count} H:{run.high_count} M:{run.medium_count} L:{run.low_count}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400">{String(run.created_at).slice(0, 10)}</span>
                  <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (run.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{run.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
