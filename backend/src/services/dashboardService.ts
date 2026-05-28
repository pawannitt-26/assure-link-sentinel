import { supabase } from '../config/supabase.js';

export const dashboardService = {
  async getStats() {
    const severities = ['critical', 'high', 'medium', 'low'] as const;
    const counts: Record<string, number> = {};
    for (const sev of severities) {
      const { count, error } = await supabase
        .from('compliance_findings')
        .select('id', { count: 'exact', head: true })
        .eq('severity', sev);
      if (error) throw error;
      counts[sev] = count || 0;
    }

    const { data: recentRuns, error: rErr } = await supabase
      .from('compliance_runs')
      .select('id, name, compliance_threshold, status, created_at, critical_count, high_count, medium_count, low_count')
      .order('created_at', { ascending: false })
      .limit(5);
    if (rErr) throw rErr;

    return {
      stats: {
        critical: counts.critical,
        high: counts.high,
        medium: counts.medium,
        low: counts.low,
      },
      recentRuns: recentRuns || [],
    };
  },
};