import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../api/client'
import Modal from '../components/Modal'

type Finding = {
  id: string
  title: string
  description: string
  partner_id: string
  compliance_run_id: string
  severity: string
  risk_category: string
  status: string
  created_at: string
}

type Partner = { id: string; company: string }
type Run = { id: string; name: string }

const EMPTY_FORM = {
  title: '',
  description: '',
  partnerId: '',
  complianceRunId: '',
  severity: 'medium',
  riskCategory: 'documentation',
}

function accentFor(sev: string) {
  if (sev === 'critical') return '#dc2626'
  if (sev === 'high') return '#ea580c'
  if (sev === 'medium') return '#ca8a04'
  return '#16a34a'
}

export default function FindingsPage() {
  const [severity, setSeverity] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [findings, setFindings] = useState<Finding[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const partnerLabel = (id: string) => partners.find(p => p.id === id)?.company || id

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/findings', { params: { page: 1, perPage: 100 } }),
      api.get('/partners', { params: { page: 1, perPage: 100 } }),
      api.get('/compliance-runs', { params: { page: 1, perPage: 100 } }),
    ])
      .then(([fRes, pRes, rRes]) => {
        const items = fRes.data?.data?.items
        if (Array.isArray(items)) setFindings(items)
        const pItems = pRes.data?.data?.items
        if (Array.isArray(pItems)) setPartners(pItems)
        const rItems = rRes.data?.data?.items
        if (Array.isArray(rItems)) setRuns(rItems)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put('/findings/' + id, { status })
      setFindings(prev => prev.map(f => (f.id === id ? { ...f, status } : f)))
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to update finding'))
    }
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/findings', {
        title: form.title,
        description: form.description,
        partnerId: form.partnerId,
        complianceRunId: form.complianceRunId,
        severity: form.severity,
        riskCategory: form.riskCategory,
        status: 'open',
      })
      setModalOpen(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to create finding'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = findings.filter(f => {
    const sevOk = severity === 'all' || f.severity === severity
    const statusOk = statusFilter === 'all' || f.status === statusFilter
    return sevOk && statusOk
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Findings</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} findings · filter and triage anomalies</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="border rounded-lg px-3 py-2 bg-white text-sm">
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 bg-white text-sm">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <button onClick={() => { setModalOpen(true); setError('') }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">+ Add Finding</button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 text-sm py-8">Loading findings…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-8">No findings match your filters.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map(finding => {
            const accent = accentFor(finding.severity)
            return (
              <div key={finding.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="h-full w-1 rounded-full self-stretch shrink-0 min-h-[4rem]" style={{ backgroundColor: accent }} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{finding.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Partner: {partnerLabel(finding.partner_id)} · {finding.risk_category}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span className="px-2 py-1 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: accent + '20', color: accent }}>{finding.severity}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{finding.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{finding.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Detected {String(finding.created_at).slice(0, 10)}</p>
                    {finding.status !== 'resolved' && finding.status !== 'dismissed' && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {finding.status === 'open' && (
                          <button onClick={() => updateStatus(finding.id, 'in_progress')} className="text-xs font-bold text-blue-600 hover:text-blue-700">Start review</button>
                        )}
                        <button onClick={() => updateStatus(finding.id, 'resolved')} className="text-xs font-bold text-green-600 hover:text-green-700">Resolve</button>
                        <button onClick={() => updateStatus(finding.id, 'dismissed')} className="text-xs font-bold text-gray-500 hover:text-gray-700">Dismiss</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} title="Add Finding" onClose={() => setModalOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="w-full border rounded-lg px-3 py-2" />
          <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={3} className="w-full border rounded-lg px-3 py-2" />
          <select required value={form.partnerId} onChange={e => setForm(f => ({ ...f, partnerId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-white">
            <option value="">Select partner…</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.company}</option>)}
          </select>
          <select required value={form.complianceRunId} onChange={e => setForm(f => ({ ...f, complianceRunId: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-white">
            <option value="">Select compliance run…</option>
            {runs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="border rounded-lg px-3 py-2 bg-white">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={form.riskCategory} onChange={e => setForm(f => ({ ...f, riskCategory: e.target.value }))} className="border rounded-lg px-3 py-2 bg-white">
              <option value="financial">Financial</option>
              <option value="documentation">Documentation</option>
              <option value="transaction">Transaction</option>
              <option value="audit">Audit</option>
              <option value="data_integrity">Data Integrity</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border rounded-lg py-2 font-bold text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold disabled:opacity-60">{saving ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
