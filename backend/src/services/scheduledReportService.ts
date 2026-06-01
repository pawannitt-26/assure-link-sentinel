import { getDb } from '../config/postgres.js';

const db = getDb();
import { NotFoundError } from '../utils/errors.js';

export interface ScheduledReportInput {
  name: string;
  reportType: string;
  frequency: string;
  executionHour: number;
  dayOfWeekOrMonth: string;
  timezone?: string;
  deliveryEndpoint?: string;
  enabled?: boolean;
  lastExecutedAt?: string;
  nextExecutionAt?: string;
}

function toDb(p: Partial<ScheduledReportInput>): Record<string, any> {
  const out: Record<string, any> = {};
  if (p.name !== undefined) out.name = p.name;
  if (p.reportType !== undefined) out.report_type = p.reportType;
  if (p.frequency !== undefined) out.frequency = p.frequency;
  if (p.executionHour !== undefined) out.execution_hour = p.executionHour;
  if (p.dayOfWeekOrMonth !== undefined) out.day_of_week_or_month = p.dayOfWeekOrMonth;
  if (p.timezone !== undefined) out.timezone = p.timezone;
  if (p.deliveryEndpoint !== undefined) out.delivery_endpoint = p.deliveryEndpoint;
  if (p.enabled !== undefined) out.enabled = p.enabled;
  if (p.lastExecutedAt !== undefined) out.last_executed_at = p.lastExecutedAt;
  if (p.nextExecutionAt !== undefined) out.next_execution_at = p.nextExecutionAt;
  return out;
}

export const scheduledReportService = {
  async list(params: { page: number; perPage: number; enabled?: boolean }) {
    const { page, perPage, enabled } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = db.from('scheduled_reports').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (enabled !== undefined) q = q.eq('enabled', enabled);
    q = q.range(from, to);

    const { data, count, error } = await q;
    if (error) throw error;
    return { items: data || [], total: count || 0, page, perPage };
  },

  async getById(id: string) {
    const { data, error } = await db.from('scheduled_reports').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError(`Scheduled report ${id} not found`);
    return data;
  },

  async create(input: ScheduledReportInput) {
    const { data, error } = await db.from('scheduled_reports').insert(toDb(input)).select('*').single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<ScheduledReportInput>) {
    await this.getById(id);
    const payload = { ...toDb(input), updated_at: new Date().toISOString() };
    const { data, error } = await db
      .from('scheduled_reports')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    await this.getById(id);
    const { error } = await db.from('scheduled_reports').delete().eq('id', id);
    if (error) throw error;
    return { id };
  },
};