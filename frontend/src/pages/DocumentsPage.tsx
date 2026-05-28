import { useCallback, useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../api/client'
import Modal from '../components/Modal'

type DocumentRow = {
  id: string
  file_name: string
  file_type: string
  partner_id: string
  fileSizeBytes?: string | number
  file_size_bytes?: string | number
  processing_status: string
  uploaded_at: string
}

type Partner = { id: string; company: string; first_name: string; last_name: string }

function accentFor(status: string) {
  if (status === 'processed') return '#16a34a'
  if (status === 'pending') return '#ca8a04'
  return '#dc2626'
}

function fmtSize(bytes: string | number) {
  const n = Number(bytes) || 0
  if (n > 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB'
  if (n > 1024) return (n / 1024).toFixed(0) + ' KB'
  return n + ' B'
}

function inferFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return 'pdf'
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'spreadsheet'
  if (name.toLowerCase().includes('questionnaire')) return 'questionnaire'
  if (name.toLowerCase().includes('audit')) return 'audit_report'
  return 'other'
}

export default function DocumentsPage() {
  const [filter, setFilter] = useState('all')
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [partnerId, setPartnerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const partnerLabel = (id: string) => {
    const p = partners.find(x => x.id === id)
    return p ? p.company : id
  }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/documents', { params: { page: 1, perPage: 100 } }),
      api.get('/partners', { params: { page: 1, perPage: 100 } }),
    ])
      .then(([docRes, partnerRes]) => {
        const items = docRes.data?.data?.items
        if (Array.isArray(items)) setDocs(items)
        const pItems = partnerRes.data?.data?.items
        if (Array.isArray(pItems)) setPartners(pItems)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const upload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !partnerId) return
    setSaving(true)
    setError('')
    try {
      await api.post('/documents', {
        partnerId,
        fileName: uploadFile.name,
        fileType: inferFileType(uploadFile.name),
        filePath: '/uploads/' + uploadFile.name,
        fileSizeBytes: uploadFile.size,
        mimeType: uploadFile.type || 'application/octet-stream',
        processingStatus: 'pending',
      })
      setModalOpen(false)
      setUploadFile(null)
      setPartnerId('')
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Upload failed'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this document record?')) return
    try {
      await api.delete('/documents/' + id)
      load()
    } catch (err) {
      alert(apiErrorMessage(err, 'Delete failed'))
    }
  }

  const filtered = docs.filter(d => filter === 'all' || d.file_type === filter)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Audit materials, questionnaires, PDFs and spreadsheets</p>
        </div>
        <button onClick={() => { setModalOpen(true); setError('') }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm">+ Upload Document</button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'pdf', 'spreadsheet', 'questionnaire', 'audit_report'].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={'px-3 py-1.5 rounded-lg text-xs font-bold ' + (filter === t ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50')}>{t}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500 text-sm">Loading documents…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">No documents yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3 font-medium">File</th>
                <th className="text-left px-4 py-3 font-medium">Partner</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Uploaded</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
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
                  <td className="px-4 py-3 text-gray-700">{partnerLabel(doc.partner_id)}</td>
                  <td className="px-4 py-3 text-gray-700">{fmtSize(doc.fileSizeBytes ?? doc.file_size_bytes ?? 0)}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{doc.processing_status}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{String(doc.uploaded_at).slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(doc.id)} className="text-red-600 hover:text-red-700 font-bold text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} title="Upload Document" onClose={() => setModalOpen(false)}>
        <form onSubmit={upload} className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Partner</label>
            <select required value={partnerId} onChange={e => setPartnerId(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white">
              <option value="">Select partner…</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.company} — {p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">File</label>
            <input
              required
              type="file"
              accept=".pdf,.xlsx,.xls,.csv,.doc,.docx"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Registers document metadata; file content is not stored in this demo.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border rounded-lg py-2 font-bold text-gray-700">Cancel</button>
            <button type="submit" disabled={saving || !uploadFile} className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-bold disabled:opacity-60">{saving ? 'Uploading…' : 'Upload'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
