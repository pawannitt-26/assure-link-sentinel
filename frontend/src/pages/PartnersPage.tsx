import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../api/client'
import Modal from '../components/Modal'

type Partner = {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company: string
  compliance_status: string
  risk_score: number
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  complianceStatus: 'pending',
  riskScore: 0,
}

function accentFor(status: string) {
  if (status === 'compliant') return '#16a34a'
  if (status === 'under_review') return '#ca8a04'
  if (status === 'non_compliant') return '#dc2626'
  return '#6366f1'
}

export default function PartnersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/partners', { params: { page: 1, perPage: 100 } })
      .then(res => {
        const items = res.data?.data?.items
        if (Array.isArray(items)) setPartners(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p: Partner) => {
    setEditing(p)
    setForm({
      firstName: p.first_name,
      lastName: p.last_name,
      email: p.email || '',
      phone: p.phone || '',
      company: p.company,
      complianceStatus: p.compliance_status,
      riskScore: p.risk_score,
    })
    setError('')
    setModalOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        company: form.company,
        complianceStatus: form.complianceStatus,
        riskScore: Number(form.riskScore),
      }
      if (editing) {
        await api.put('/partners/' + editing.id, payload)
      } else {
        await api.post('/partners', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save partner'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this partner?')) return
    try {
      await api.delete('/partners/' + id)
      load()
    } catch (err) {
      alert(apiErrorMessage(err, 'Failed to delete partner'))
    }
  }

  const filtered = partners.filter(p => {
    const name = `${p.first_name} ${p.last_name} ${p.company} ${p.email || ''}`
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || p.compliance_status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500 mt-1">{partners.length} partner records under monitoring</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">+ Add Partner</button>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search partners or companies..."
          className="flex-1 min-w-[200px] border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
          <option value="all">All statuses</option>
          <option value="compliant">Compliant</option>
          <option value="under_review">Under Review</option>
          <option value="non_compliant">Non-Compliant</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500 text-sm">Loading partners…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">No partners found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Partner</th>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Risk Score</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-1 rounded-full" style={{ backgroundColor: accentFor(p.compliance_status) }} aria-hidden />
                      <div>
                        <p className="font-semibold text-gray-900">{p.first_name} {p.last_name}</p>
                        <p className="text-xs text-gray-500">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.company}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{p.compliance_status}</span></td>
                  <td className="px-4 py-3 font-bold text-gray-900">{p.risk_score}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-700 font-bold text-xs">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-red-600 hover:text-red-700 font-bold text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Partner' : 'Add Partner'} onClose={() => setModalOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First name" className="border rounded-lg px-3 py-2" />
            <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last name" className="border rounded-lg px-3 py-2" />
          </div>
          <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="Email" className="w-full border rounded-lg px-3 py-2" />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="w-full border rounded-lg px-3 py-2" />
          <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company" className="w-full border rounded-lg px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.complianceStatus} onChange={e => setForm(f => ({ ...f, complianceStatus: e.target.value }))} className="border rounded-lg px-3 py-2 bg-white">
              <option value="pending">Pending</option>
              <option value="compliant">Compliant</option>
              <option value="under_review">Under Review</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
            <input type="number" min={0} max={100} value={form.riskScore} onChange={e => setForm(f => ({ ...f, riskScore: Number(e.target.value) }))} placeholder="Risk score" className="border rounded-lg px-3 py-2" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border rounded-lg py-2 font-bold text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
