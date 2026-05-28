import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../api/client'
import Modal from '../components/Modal'

type Schedule = {
  id: string
  name: string
  report_type: string
  frequency: string
  execution_hour: number
  day_of_week_or_month: string
  enabled: boolean
  next_execution_at: string | null
}

const EMPTY_FORM = {
  name: '',
  reportType: 'compliance_summary',
  frequency: 'daily',
  executionHour: 8,
  dayOfWeekOrMonth: '1',
  enabled: true,
}

function accentFor(enabled: boolean) {
  return enabled ? '#16a34a' : '#9ca3af'
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/scheduled-reports', { params: { page: 1, perPage: 100 } })
      .then(res => {
        const items = res.data?.data?.items
        if (Array.isArray(items)) setSchedules(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (id: string) => {
    const target = schedules.find(s => s.id === id)
    if (!target) return
    const next = !target.enabled
    setSchedules(prev => prev.map(s => (s.id === id ? { ...s, enabled: next } : s)))
    try {
      await api.patch('/scheduled-reports/' + id, { enabled: next })
    } catch (err) {
      setSchedules(prev => prev.map(s => (s.id === id ? { ...s, enabled: !next } : s)))
      alert(apiErrorMessage(err, 'Failed to update schedule'))
    }
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/scheduled-reports', form)
      setModalOpen(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to create schedule'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this schedule?')) return
    try {
      await api.delete('/scheduled-reports/' + id)
      load()
    } catch (err) {
      alert(apiErrorMessage(err, 'Delete failed'))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">Recurring compliance report delivery configurations</p>
        </div>
        <button onClick={() => { setModalOpen(true); setError('') }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">+ New Schedule</button>
      </div>
      {loading ? (
        <p className="text-center text-gray-500 text-sm py-8">Loading schedules…</p>
      ) : schedules.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-8">No schedules yet.</p>
      ) : (
        <div className="grid gap-3">
          {schedules.map(sch => (
            <div key={sch.id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-12 w-1 rounded-full shrink-0" style={{ backgroundColor: accentFor(sch.enabled) }} aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{sch.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {sch.report_type} · {sch.frequency} at {sch.execution_hour}:00 · Next: {sch.next_execution_at ? String(sch.next_execution_at).slice(0, 16) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (sch.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                  {sch.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button onClick={() => toggle(sch.id)} className="text-sm text-blue-600 hover:text-blue-700 font-bold">
                  {sch.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => remove(sch.id)} className="text-sm text-red-600 hover:text-red-700 font-bold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title="New Schedule" onClose={() => setModalOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Schedule name" className="w-full border rounded-lg px-3 py-2" />
          <select value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-white">
            <option value="compliance_summary">Compliance Summary</option>
            <option value="risk_assessment">Risk Assessment</option>
            <option value="finding_report">Finding Report</option>
            <option value="partner_audit">Partner Audit</option>
            <option value="full_assurance">Full Assurance</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="border rounded-lg px-3 py-2 bg-white">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input type="number" min={0} max={23} value={form.executionHour} onChange={e => setForm(f => ({ ...f, executionHour: Number(e.target.value) }))} placeholder="Hour (0-23)" className="border rounded-lg px-3 py-2" />
          </div>
          <input required value={form.dayOfWeekOrMonth} onChange={e => setForm(f => ({ ...f, dayOfWeekOrMonth: e.target.value }))} placeholder="Day (e.g. monday or 1)" className="w-full border rounded-lg px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
            Enabled
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border rounded-lg py-2 font-bold text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold disabled:opacity-60">{saving ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
