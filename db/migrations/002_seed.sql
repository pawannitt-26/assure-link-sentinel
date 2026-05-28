-- Demo seed data for AssureLink Guardian (Railway / standard Postgres)
-- Safe to re-run: uses fixed UUIDs with ON CONFLICT DO NOTHING
-- Run after 001_init.sql:
--   psql "$DATABASE_URL" -f db/migrations/002_seed.sql

-- Partners
INSERT INTO public.partners (id, first_name, last_name, email, company, compliance_status, risk_score, audit_status)
VALUES
  ('a1000001-0000-4000-8000-000000000001', 'Alice', 'Chen', 'alice@acme.com', 'Acme Financial', 'compliant', 12, 'completed'),
  ('a1000001-0000-4000-8000-000000000002', 'Robert', 'Singh', 'r.singh@globex.com', 'Globex Holdings', 'under_review', 58, 'in_progress'),
  ('a1000001-0000-4000-8000-000000000003', 'Maria', 'Lopez', 'maria@initech.io', 'Initech LLC', 'non_compliant', 84, 'overdue'),
  ('a1000001-0000-4000-8000-000000000004', 'Priya', 'Patel', 'priya@stark.com', 'Stark Industries', 'pending', 45, 'not_started')
ON CONFLICT (id) DO NOTHING;

-- Compliance runs
INSERT INTO public.compliance_runs (id, name, compliance_threshold, status, critical_count, high_count, medium_count, low_count, created_at)
VALUES
  ('b2000001-0000-4000-8000-000000000001', 'Q4 Partner Audit', 'strict', 'completed', 3, 5, 2, 2, '2024-11-18T10:00:00Z'),
  ('b2000001-0000-4000-8000-000000000002', 'Monthly Compliance Sweep', 'standard', 'in_progress', 1, 3, 4, 0, '2024-11-17T10:00:00Z'),
  ('b2000001-0000-4000-8000-000000000003', 'Year-End Review', 'strict', 'completed', 6, 8, 5, 2, '2024-11-15T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Findings
INSERT INTO public.compliance_findings (id, compliance_run_id, partner_id, title, description, severity, risk_category, status, created_at)
VALUES
  ('c3000001-0000-4000-8000-000000000001', 'b2000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000002', 'Unusual transaction pattern detected', 'Multiple high-value transactions occurred outside normal business hours over a 72-hour period.', 'critical', 'financial', 'open', '2024-11-18T10:00:00Z'),
  ('c3000001-0000-4000-8000-000000000002', 'b2000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000003', 'Missing quarterly audit documentation', 'Q3 2024 audit packet has not been submitted; deadline passed 14 days ago.', 'high', 'documentation', 'in_progress', '2024-11-17T10:00:00Z'),
  ('c3000001-0000-4000-8000-000000000003', 'b2000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000001', 'Inconsistent data across CRM and ERP', 'Partner record fields differ between systems for company size and contact role.', 'medium', 'data_integrity', 'open', '2024-11-16T10:00:00Z'),
  ('c3000001-0000-4000-8000-000000000004', 'b2000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000004', 'Minor formatting deviation', 'Cover sheet uses outdated template version.', 'low', 'documentation', 'resolved', '2024-11-12T10:00:00Z'),
  ('c3000001-0000-4000-8000-000000000005', 'b2000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000002', 'Elevated wire transfer volume', 'Wire transfers exceeded threshold by 340% in October.', 'critical', 'transaction', 'open', '2024-11-10T10:00:00Z'),
  ('c3000001-0000-4000-8000-000000000006', 'b2000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000003', 'Delayed audit response', 'Partner has not responded to audit requests within SLA.', 'high', 'audit', 'open', '2024-11-09T10:00:00Z'),
  ('c3000001-0000-4000-8000-000000000007', 'b2000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000001', 'Incomplete KYC renewal', 'Annual KYC renewal documents are partially submitted.', 'medium', 'documentation', 'in_progress', '2024-11-08T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Documents
INSERT INTO public.documents (id, partner_id, file_name, file_type, file_path, file_size_bytes, mime_type, processing_status, uploaded_at)
VALUES
  ('d4000001-0000-4000-8000-000000000001', 'a1000001-0000-4000-8000-000000000001', 'Q4_Audit_Report_Acme.pdf', 'audit_report', '/uploads/q4_acme.pdf', 2516582, 'application/pdf', 'processed', '2024-11-18T10:00:00Z'),
  ('d4000001-0000-4000-8000-000000000002', 'a1000001-0000-4000-8000-000000000002', 'Compliance_Questionnaire_Globex.pdf', 'questionnaire', '/uploads/globex_q.pdf', 913408, 'application/pdf', 'pending', '2024-11-17T10:00:00Z'),
  ('d4000001-0000-4000-8000-000000000003', 'a1000001-0000-4000-8000-000000000003', 'Transactions_Initech_Oct.xlsx', 'spreadsheet', '/uploads/initech_oct.xlsx', 5347737, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'processed', '2024-11-15T10:00:00Z'),
  ('d4000001-0000-4000-8000-000000000004', 'a1000001-0000-4000-8000-000000000004', 'Vendor_Risk_Assessment.pdf', 'pdf', '/uploads/stark_risk.pdf', 1258291, 'application/pdf', 'failed', '2024-11-14T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Scheduled reports
INSERT INTO public.scheduled_reports (id, name, report_type, frequency, execution_hour, day_of_week_or_month, enabled, next_execution_at)
VALUES
  ('e5000001-0000-4000-8000-000000000001', 'Daily Compliance Summary', 'compliance_summary', 'daily', 8, '1', true, '2024-11-19T08:00:00Z'),
  ('e5000001-0000-4000-8000-000000000002', 'Weekly Risk Assessment', 'risk_assessment', 'weekly', 9, 'monday', true, '2024-11-25T09:00:00Z'),
  ('e5000001-0000-4000-8000-000000000003', 'Monthly Full Assurance', 'full_assurance', 'monthly', 6, '1', true, '2024-12-01T06:00:00Z'),
  ('e5000001-0000-4000-8000-000000000004', 'Partner Audit Digest', 'partner_audit', 'weekly', 17, 'friday', false, NULL)
ON CONFLICT (id) DO NOTHING;
