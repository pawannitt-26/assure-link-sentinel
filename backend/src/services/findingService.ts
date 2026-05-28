import { supabase } from '../config/postgres.js';
import { NotFoundError } from '../utils/errors.js';

export interface FindingInput {
  complianceRunId: string;
  partnerId: string;
  title: string;
  description: string;
  severity: string;
  riskCategory: string;
  affectedRecord?: string;
  recommendedAction?: string;
  status?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

function toDb(p: Partial<FindingInput>): Record<string, any> {
  const out: Record<string, any> = {};
  if (p.complianceRunId !== undefined) out.compliance_run_id = p.complianceRunId;
  if (p.partnerId !== undefined) out.partner_id = p.partnerId;
  if (p.title !== undefined) out.title = p.title;
  if (p.description !== undefined) out.description = p.description;
  if (p.severity !== undefined) out.severity = p.severity;
  if (p.riskCategory !== undefined) out.risk_category = p.riskCategory;
  if (p.affectedRecord !== undefined) out.affected_record = p.affectedRecord;
  if (p.recommendedAction !== undefined) out.recommended_action = p.recommendedAction;
  if (p.status !== undefined) out.status = p.status;
  if (p.resolutionNotes !== undefined) out.resolution_notes = p.resolutionNotes;
  if (p.resolvedAt !== undefined) out.resolved_at = p.resolvedAt;
  return out;
}

export const findingService = {
  async list(params: {
    page: number;
    perPage: number;
    severity?: string;
    status?: string;
    partnerId?: string;
    complianceRunId?: string;
  }) {
    const { page, perPage, severity, status, partnerId, complianceRunId } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = supabase.from('compliance_findings').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (severity) q = q.eq('severity', severity);
    if (status) q = q.eq('status', status);
    if (partnerId) q = q.eq('partner_id', partnerId);
    if (complianceRunId) q = q.eq('compliance_run_id', complianceRunId);
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;
    return { items: data || [], total: count || 0, page, perPage };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('compliance_findings').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError(`Finding ${id} not found`);
    return data;
  },

  async create(input: FindingInput) {
    const { data, error } = await supabase.from('compliance_findings').insert(toDb(input)).select('*').single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<FindingInput>) {
    await this.getById(id);
    const payload = { ...toDb(input), updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('compliance_findings')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    await this.getById(id);
    const { error } = await supabase.from('compliance_findings').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};