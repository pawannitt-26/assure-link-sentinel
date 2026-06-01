import { getDb } from '../config/postgres.js';

const db = getDb();
import { NotFoundError } from '../utils/errors.js';

export interface RunInput {
  name: string;
  complianceThreshold?: string;
  status?: string;
  executiveSummary?: string;
  additionalNotes?: string;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  startedAt?: string;
  completedAt?: string;
}

function toDb(p: Partial<RunInput>): Record<string, any> {
  const out: Record<string, any> = {};
  if (p.name !== undefined) out.name = p.name;
  if (p.complianceThreshold !== undefined) out.compliance_threshold = p.complianceThreshold;
  if (p.status !== undefined) out.status = p.status;
  if (p.executiveSummary !== undefined) out.executive_summary = p.executiveSummary;
  if (p.additionalNotes !== undefined) out.additional_notes = p.additionalNotes;
  if (p.criticalCount !== undefined) out.critical_count = p.criticalCount;
  if (p.highCount !== undefined) out.high_count = p.highCount;
  if (p.mediumCount !== undefined) out.medium_count = p.mediumCount;
  if (p.lowCount !== undefined) out.low_count = p.lowCount;
  if (p.startedAt !== undefined) out.started_at = p.startedAt;
  if (p.completedAt !== undefined) out.completed_at = p.completedAt;
  return out;
}

export const complianceRunService = {
  async list(params: { page: number; perPage: number; status?: string }) {
    const { page, perPage, status } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = db.from('compliance_runs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;
    return { items: data || [], total: count || 0, page, perPage };
  },

  async getById(id: string) {
    const { data, error } = await db.from('compliance_runs').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError(`Compliance run ${id} not found`);
    return data;
  },

  async create(input: RunInput) {
    const { data, error } = await db.from('compliance_runs').insert(toDb(input)).select('*').single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<RunInput>) {
    await this.getById(id);
    const payload = { ...toDb(input), updated_at: new Date().toISOString() };
    const { data, error } = await db.from('compliance_runs').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    await this.getById(id);
    const { error } = await db.from('compliance_runs').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};