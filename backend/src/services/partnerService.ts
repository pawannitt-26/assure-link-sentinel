import { getDb } from '../config/postgres.js';

const db = getDb();
import { NotFoundError } from '../utils/errors.js';

export interface PartnerInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company: string;
  complianceStatus?: string;
  riskScore?: number;
  auditStatus?: string;
  externalCrmId?: string;
  notes?: string;
  lastAuditDate?: string;
}

function toDb(p: Partial<PartnerInput>): Record<string, any> {
  const out: Record<string, any> = {};
  if (p.firstName !== undefined) out.first_name = p.firstName;
  if (p.lastName !== undefined) out.last_name = p.lastName;
  if (p.email !== undefined) out.email = p.email;
  if (p.phone !== undefined) out.phone = p.phone;
  if (p.company !== undefined) out.company = p.company;
  if (p.complianceStatus !== undefined) out.compliance_status = p.complianceStatus;
  if (p.riskScore !== undefined) out.risk_score = p.riskScore;
  if (p.auditStatus !== undefined) out.audit_status = p.auditStatus;
  if (p.externalCrmId !== undefined) out.external_crm_id = p.externalCrmId;
  if (p.notes !== undefined) out.notes = p.notes;
  if (p.lastAuditDate !== undefined) out.last_audit_date = p.lastAuditDate;
  return out;
}

export const partnerService = {
  async list(params: { page: number; perPage: number; search?: string; status?: string }) {
    const { page, perPage, search, status } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = db.from('partners').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (status) q = q.eq('compliance_status', status);
    if (search) {
      const s = `%${search}%`;
      q = q.or(`first_name.ilike.${s},last_name.ilike.${s},company.ilike.${s},email.ilike.${s}`);
    }
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;
    return { items: data || [], total: count || 0, page, perPage };
  },

  async getById(id: string) {
    const { data, error } = await db.from('partners').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError(`Partner ${id} not found`);
    return data;
  },

  async create(input: PartnerInput) {
    const { data, error } = await db.from('partners').insert(toDb(input)).select('*').single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<PartnerInput>) {
    await this.getById(id);
    const payload = { ...toDb(input), updated_at: new Date().toISOString() };
    const { data, error } = await db.from('partners').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    await this.getById(id);
    const { error } = await db.from('partners').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};