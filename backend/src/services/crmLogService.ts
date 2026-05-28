import { supabase } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';

export interface CrmLogInput {
  partnerId: string;
  complianceRunId?: string;
  updateType: string;
  payload: Record<string, any>;
  status?: string;
  externalRecordId?: string;
  errorMessage?: string;
  sentAt?: string;
}

function toDb(p: Partial<CrmLogInput>): Record<string, any> {
  const out: Record<string, any> = {};
  if (p.partnerId !== undefined) out.partner_id = p.partnerId;
  if (p.complianceRunId !== undefined) out.compliance_run_id = p.complianceRunId;
  if (p.updateType !== undefined) out.update_type = p.updateType;
  if (p.payload !== undefined) out.payload = p.payload;
  if (p.status !== undefined) out.status = p.status;
  if (p.externalRecordId !== undefined) out.external_record_id = p.externalRecordId;
  if (p.errorMessage !== undefined) out.error_message = p.errorMessage;
  if (p.sentAt !== undefined) out.sent_at = p.sentAt;
  return out;
}

export const crmLogService = {
  async list(params: { page: number; perPage: number; partnerId?: string; status?: string }) {
    const { page, perPage, partnerId, status } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = supabase.from('crm_update_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (partnerId) q = q.eq('partner_id', partnerId);
    if (status) q = q.eq('status', status);
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;
    return { items: data || [], total: count || 0, page, perPage };
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('crm_update_logs').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError(`CRM log ${id} not found`);
    return data;
  },

  async create(input: CrmLogInput) {
    const { data, error } = await supabase.from('crm_update_logs').insert(toDb(input)).select('*').single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<CrmLogInput>) {
    await this.getById(id);
    const payload = { ...toDb(input), updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('crm_update_logs')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    await this.getById(id);
    const { error } = await supabase.from('crm_update_logs').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};