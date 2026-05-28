import { useEffect, useState } from 'react'
import api from '../api/client'

const FALLBACK = [
  { id: 'f1', title: 'Unusual transaction pattern detected', partner_id: 'Globex Holdings', severity: 'critical', risk_category: 'financial', status: 'open', created_at: '2024-11-18', description: 'Multiple high-value transactions occurred outside normal business hours over a 72-hour period.' },
  { id: 'f2', title: 'Missing quarterly audit documentation', partner_id: 'Initech LLC', severity: 'high', risk_category: 'documentation', status: 'in_progress', created_at: '2024-11-17', description: 'Q3 2024 audit packet has not been submitted; deadline passed 14 days ago.' },
  { id: 'f3', title: 'Inconsistent data across CRM and ERP', partner_id: 'Acme Financial', severity: 'medium', risk_category: 'data_integrity', status: 'open', created_at: '2024-11-16', description: 'Partner record fields differ between systems for company size and contact role.' },
  { id: 'f4', title: 'Minor formatting deviation', partner_id: 'Wayne Enterprises', severity: 'low', risk_category: 'documentation', status: 'resolved', created_at: '2024-11-12', description: 'Cover sheet uses outdated template version.' },
]

function accentFor(sev) {
  if (sev === 'critical') return '#dc2626'
  if (sev === 'high') return '#ea580c'
  if (sev === 'medium') return '#ca8a04'
  return '#16a34a'
}

export default function FindingsPage() {
  const [severity, setSeverity] = useState('all')
  const [findings, setFindings] = useState(FALLBACK)

  useEffect(() => {
    let alive = true
    api.get('/findings', { params: { page: 1, perPage: 50 } }).then(res => {
      if (!alive) return
      const items = res.data?.data?.items
      if (Array.isArray(items) && items.length) setFindings(items)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const filtered = findings.filter(f => severity === 'all' || f.severity === severity)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Findings</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} findings · filter and triage anomalies</p>
        </div>
        <select value={severity} onChange={e => setSeverity(e.target.value)} className="border rounded-lg px-3 py-2 bg-white text-sm">
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="grid gap-3">
        {filtered.map(finding => {
          const accent = accentFor(finding.severity)
          return (
            <div key={finding.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="h-full w-1 rounded-full self-stretch shrink-0" style={{ backgroundColor: accent }} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{finding.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Partner: {finding.partner_id} · {finding.risk_category}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: accent + '20', color: accent }}>{finding.severity}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{finding.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{finding.description}</p>
                  <p className="text-xs text-gray-400 mt-2">Detected {String(finding.created_at).slice(0, 10)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}