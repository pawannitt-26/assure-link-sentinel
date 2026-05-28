import { useEffect, useState } from 'react'
import api from '../api/client'

const FALLBACK = [
  { id: 'd1', file_name: 'Q4_Audit_Report_Acme.pdf', file_type: 'audit_report', partner_id: 'Acme Financial', fileSizeBytes: '2516582', processing_status: 'processed', uploaded_at: '2024-11-18' },
  { id: 'd2', file_name: 'Compliance_Questionnaire_Globex.pdf', file_type: 'questionnaire', partner_id: 'Globex Holdings', fileSizeBytes: '913408', processing_status: 'pending', uploaded_at: '2024-11-17' },
  { id: 'd3', file_name: 'Transactions_Initech_Oct.xlsx', file_type: 'spreadsheet', partner_id: 'Initech LLC', fileSizeBytes: '5347737', processing_status: 'processed', uploaded_at: '2024-11-15' },
  { id: 'd4', file_name: 'Vendor_Risk_Assessment.pdf', file_type: 'pdf', partner_id: 'Stark Industries', fileSizeBytes: '1258291', processing_status: 'failed', uploaded_at: '2024-11-14' },
]

function accentFor(status) {
  if (status === 'processed') return '#16a34a'
  if (status === 'pending') return '#ca8a04'
  return '#dc2626'
}

function fmtSize(bytes) {
  const n = Number(bytes) || 0
  if (n > 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n > 1024) return (n / 1024).toFixed(0) + ' KB'
  return n + ' B'
}

export default function DocumentsPage() {
  const [filter, setFilter] = useState('all')
  const [docs, setDocs] = useState(FALLBACK)

  useEffect(() => {
    let alive = true
    api.get('/documents', { params: { page: 1, perPage: 50 } }).then(res => {
      if (!alive) return
      const items = res.data?.data?.items
      if (Array.isArray(items) && items.length) setDocs(items)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const filtered = docs.filter(d => filter === 'all' || d.file_type === filter)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Audit materials, questionnaires, PDFs and spreadsheets</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">+ Upload Document</button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'pdf', 'spreadsheet', 'questionnaire', 'audit_report'].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (filter === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50')}>{t}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="text-left px-4 py-3 font-medium">File</th>
              <th className="text-left px-4 py-3 font-medium">Partner</th>
              <th className="text-left px-4 py-3 font-medium">Size</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-1 rounded-full" style={{ backgroundColor: accentFor(doc.processing_status) }} aria-hidden />
                    <div>
                      <p className="font-semibold text-gray-900">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">{doc.file_type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{doc.partner_id}</td>
                <td className="px-4 py-3 text-gray-700">{fmtSize(doc.fileSizeBytes || doc.file_size_bytes)}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{doc.processing_status}</span></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{String(doc.uploaded_at).slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}