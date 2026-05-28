import { useEffect, useState } from 'react'
import api from '../api/client'

const FALLBACK = [
  { id: 'p1', first_name: 'Alice', last_name: 'Chen', company: 'Acme Financial', email: 'alice@acme.com', compliance_status: 'compliant', risk_score: 12 },
  { id: 'p2', first_name: 'Robert', last_name: 'Singh', company: 'Globex Holdings', email: 'r.singh@globex.com', compliance_status: 'under_review', risk_score: 58 },
  { id: 'p3', first_name: 'Maria', last_name: 'Lopez', company: 'Initech LLC', email: 'maria@initech.io', compliance_status: 'non_compliant', risk_score: 84 },
  { id: 'p4', first_name: 'Priya', last_name: 'Patel', company: 'Stark Industries', email: 'priya@stark.com', compliance_status: 'pending', risk_score: 45 },
]

function accentFor(status) {
  if (status === 'compliant') return '#16a34a'
  if (status === 'under_review') return '#ca8a04'
  if (status === 'non_compliant') return '#dc2626'
  return '#6366f1'
}

export default function PartnersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [partners, setPartners] = useState(FALLBACK)

  useEffect(() => {
    let alive = true
    api.get('/partners', { params: { page: 1, perPage: 50 } }).then(res => {
      if (!alive) return
      const items = res.data?.data?.items
      if (Array.isArray(items) && items.length) setPartners(items)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const filtered = partners.filter(p => {
    const name = (p.first_name || '') + ' ' + (p.last_name || '') + ' ' + (p.company || '') + ' ' + (p.email || '')
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
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">+ Add Partner</button>
      </div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners or companies..."
          className="flex-1 min-w-[200px] border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
          <option value="all">All statuses</option>
          <option value="compliant">Compliant</option>
          <option value="under_review">Under Review</option>
          <option value="non_compliant">Non-Compliant</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Partner</th>
              <th className="text-left px-4 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Risk Score</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}