import { getDb } from '../config/postgres.js';

const db = getDb();
import { NotFoundError } from '../utils/errors.js';

export interface DocumentInput {
  partnerId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSizeBytes: number | string;
  mimeType: string;
  processingStatus?: string;
  extractedContent?: string;
  notes?: string;
}

function toDb(p: Partial<DocumentInput>): Record<string, any> {
  const out: Record<string, any> = {};
  if (p.partnerId !== undefined) out.partner_id = p.partnerId;
  if (p.fileName !== undefined) out.file_name = p.fileName;
  if (p.fileType !== undefined) out.file_type = p.fileType;
  if (p.filePath !== undefined) out.file_path = p.filePath;
  if (p.fileSizeBytes !== undefined) out.file_size_bytes = p.fileSizeBytes;
  if (p.mimeType !== undefined) out.mime_type = p.mimeType;
  if (p.processingStatus !== undefined) out.processing_status = p.processingStatus;
  if (p.extractedContent !== undefined) out.extracted_content = p.extractedContent;
  if (p.notes !== undefined) out.notes = p.notes;
  return out;
}

function normalize(d: any) {
  if (!d) return d;
  return { ...d, fileSizeBytes: d.file_size_bytes !== undefined ? String(d.file_size_bytes) : undefined };
}

export const documentService = {
  async list(params: { page: number; perPage: number; partnerId?: string }) {
    const { page, perPage, partnerId } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = db.from('documents').select('*', { count: 'exact' }).order('uploaded_at', { ascending: false });
    if (partnerId) q = q.eq('partner_id', partnerId);
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;
    return { items: (Array.isArray(data) ? data : []).map(normalize), total: count || 0, page, perPage };
  },

  async getById(id: string) {
    const { data, error } = await db.from('documents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError(`Document ${id} not found`);
    return normalize(data);
  },

  async create(input: DocumentInput) {
    const { data, error } = await db.from('documents').insert(toDb(input)).select('*').single();
    if (error) throw error;
    return normalize(data);
  },

  async update(id: string, input: Partial<DocumentInput>) {
    await this.getById(id);
    const payload = { ...toDb(input), updated_at: new Date().toISOString() };
    const { data, error } = await db.from('documents').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return normalize(data);
  },

  async remove(id: string) {
    await this.getById(id);
    const { error } = await db.from('documents').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};