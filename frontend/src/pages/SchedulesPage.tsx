import { useEffect, useState } from 'react'
import api from '../api/client'

const FALLBACK = [
  { id: 's1', name: 'Daily Compliance Summary', report_type: 'compliance_summary', frequency: 'daily', execution_hour: 8, enabled: true, next_execution_at: '2024-11-19 08:00' },
  { id: 's2', name: 'Weekly Risk Assessment', report_type: 'risk_assessment', frequency: 'weekly', execution_hour: 9, enabled: true, next_execution_at: '2024-11-25 09:00' },
  { id: 's3', name: 'Monthly Full Assurance', report_type: 'full_assurance', frequency: 'monthly', execution_hour: 6, enabled: true, next_execution_at: '2024-12-01 06:00' },
  { id: 's4', name: 'Partner Audit Digest', report_type: 'partner_audit', frequency: 'weekly', execution_hour: 17, enabled: false, next_execution_at: null },
]

function accentFor(enabled) {
  return enabled ? '#16a34a' : '#9ca3af'
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState(FALLBACK)

  useEffect(() => {
    let alive = true
    api.get('/scheduled-reports', { params: { page: 1, perPage: 50 } }).then(res => {
      if (!alive) return
      const items = res.data?.data?.items
      if (Array.isArray(items) && items.length) setSchedules(items)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const toggle = async (id) => {
    const target = schedules.find(s => s.id === id)
    if (!target) return
    const next = !target.enabled
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled: next } : s))
    try {
      await api.put('/scheduled-reports/' + id, { enabled: next })
    } catch {
      // keep optimistic update for preview
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">Recurring compliance report delivery configurations</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">+ New Schedule</button>
      </div>
      <div className="grid gap-3">
        {schedules.map(sch => (
          <div key={sch.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-12 w-1 rounded-full shrink-0" style={{ backgroundColor: accentFor(sch.enabled) }} aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{sch.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sch.report_type} · {sch.frequency} at {sch.execution_hour}:00 · Next: {sch.next_execution_at || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (sch.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                {sch.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button onClick={() => toggle(sch.id)} className="text-sm text-blue-600 hover:text-blue-700 font-bold">
                {sch.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}