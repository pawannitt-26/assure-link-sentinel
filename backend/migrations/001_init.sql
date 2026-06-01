-- AssureLink Guardian — PostgreSQL schema (Railway / standard Postgres)
-- Auto-applied by the backend on startup, or run manually:
--   psql "$DATABASE_URL" -f backend/migrations/001_init.sql
--   psql "$DATABASE_URL" -f backend/migrations/002_seed.sql
--
-- Railway notes:
--   * Uses standard PostgreSQL (pgcrypto is a built-in contrib extension)
--   * Connect with the DATABASE_URL from Railway → Postgres → Connect
--   * SSL is handled by the connection string / psql automatically
--   * RLS policies are optional; the backend connects as table owner and bypasses RLS
--
-- Schema notes:
--   * UUID primary keys default to gen_random_uuid() (PG 13+ / pgcrypto)
--   * Enum-like columns use TEXT + CHECK constraints
--   * Safe to re-run: CREATE IF NOT EXISTS / ON CONFLICT DO NOTHING

create extension if not exists pgcrypto;

-- ============================================================
-- users
-- ============================================================
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         varchar(255) not null unique,
  password_hash varchar(255) not null,
  full_name     varchar(255) not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_users_email on public.users(email);

-- ============================================================
-- partners
-- ============================================================
create table if not exists public.partners (
  id                uuid primary key default gen_random_uuid(),
  first_name        varchar(255) not null,
  last_name         varchar(255) not null,
  email             varchar(255),
  phone             varchar(50),
  company           varchar(255) not null,
  compliance_status text not null default 'pending'
    check (compliance_status in ('compliant','non_compliant','under_review','pending')),
  risk_score        integer not null default 0,
  audit_status      text default 'not_started'
    check (audit_status in ('not_started','in_progress','completed','overdue')),
  external_crm_id   varchar(255),
  notes             text,
  last_audit_date   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_partners_compliance_status on public.partners(compliance_status);
create index if not exists idx_partners_risk_score        on public.partners(risk_score);
create index if not exists idx_partners_company           on public.partners(company);
create index if not exists idx_partners_external_crm_id   on public.partners(external_crm_id);
create index if not exists idx_partners_created_at        on public.partners(created_at);

-- ============================================================
-- compliance_runs
-- ============================================================
create table if not exists public.compliance_runs (
  id                   uuid primary key default gen_random_uuid(),
  name                 varchar(255) not null,
  compliance_threshold text not null default 'standard'
    check (compliance_threshold in ('strict','standard','relaxed')),
  status               text not null default 'pending'
    check (status in ('pending','in_progress','completed','failed')),
  started_at           timestamptz,
  completed_at         timestamptz,
  executive_summary    text,
  critical_count       integer not null default 0,
  high_count           integer not null default 0,
  medium_count         integer not null default 0,
  low_count            integer not null default 0,
  additional_notes     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_compliance_runs_status     on public.compliance_runs(status);
create index if not exists idx_compliance_runs_threshold  on public.compliance_runs(compliance_threshold);
create index if not exists idx_compliance_runs_created_at on public.compliance_runs(created_at);

-- ============================================================
-- compliance_findings
-- ============================================================
create table if not exists public.compliance_findings (
  id                 uuid primary key default gen_random_uuid(),
  compliance_run_id  uuid not null references public.compliance_runs(id) on delete cascade,
  partner_id         uuid not null references public.partners(id)        on delete cascade,
  title              varchar(500) not null,
  description        text not null,
  severity           text not null
    check (severity in ('critical','high','medium','low')),
  risk_category      text not null
    check (risk_category in ('financial','documentation','transaction','audit','data_integrity')),
  affected_record    varchar(500),
  recommended_action text,
  status             text not null default 'open'
    check (status in ('open','in_progress','resolved','dismissed')),
  resolution_notes   text,
  resolved_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_findings_run_id        on public.compliance_findings(compliance_run_id);
create index if not exists idx_findings_partner_id    on public.compliance_findings(partner_id);
create index if not exists idx_findings_severity      on public.compliance_findings(severity);
create index if not exists idx_findings_status        on public.compliance_findings(status);
create index if not exists idx_findings_risk_category on public.compliance_findings(risk_category);
create index if not exists idx_findings_created_at    on public.compliance_findings(created_at);
create index if not exists idx_findings_run_partner   on public.compliance_findings(compliance_run_id, partner_id);

-- ============================================================
-- documents
-- ============================================================
create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references public.partners(id) on delete cascade,
  file_name         varchar(500) not null,
  file_type         text not null
    check (file_type in ('pdf','spreadsheet','questionnaire','audit_report','other')),
  file_path         varchar(1000) not null,
  file_size_bytes   bigint not null,
  mime_type         varchar(255) not null,
  processing_status text not null default 'pending'
    check (processing_status in ('pending','processed','failed')),
  extracted_content text,
  notes             text,
  uploaded_at       timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_documents_partner_id on public.documents(partner_id);
create index if not exists idx_documents_file_type on public.documents(file_type);
create index if not exists idx_documents_processing_status on public.documents(processing_status);

-- ============================================================
-- scheduled_reports
-- ============================================================
create table if not exists public.scheduled_reports (
  id                    uuid primary key default gen_random_uuid(),
  name                  varchar(255) not null,
  report_type           text not null
    check (report_type in ('compliance_summary','risk_assessment','finding_report','partner_audit','full_assurance')),
  frequency             text not null
    check (frequency in ('daily','weekly','monthly')),
  execution_hour        integer not null,
  day_of_week_or_month  varchar(20) not null,
  timezone              varchar(100) default 'UTC',
  delivery_endpoint     varchar(1000),
  enabled               boolean not null default true,
  last_executed_at      timestamptz,
  next_execution_at     timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists idx_scheduled_enabled    on public.scheduled_reports(enabled);
create index if not exists idx_scheduled_frequency  on public.scheduled_reports(frequency);
create index if not exists idx_scheduled_next       on public.scheduled_reports(next_execution_at);

-- ============================================================
-- crm_update_logs
-- ============================================================
create table if not exists public.crm_update_logs (
  id                  uuid primary key default gen_random_uuid(),
  partner_id          uuid not null references public.partners(id) on delete cascade,
  compliance_run_id   uuid references public.compliance_runs(id) on delete set null,
  update_type         text not null
    check (update_type in ('compliance_status','risk_assessment','finding_note','alert')),
  payload             jsonb not null,
  status              text not null default 'pending'
    check (status in ('pending','sent','confirmed','failed')),
  external_record_id  varchar(255),
  error_message       text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_crm_partner_id      on public.crm_update_logs(partner_id);
create index if not exists idx_crm_run_id          on public.crm_update_logs(compliance_run_id);
create index if not exists idx_crm_status          on public.crm_update_logs(status);
create index if not exists idx_crm_update_type     on public.crm_update_logs(update_type);
create index if not exists idx_crm_created_at      on public.crm_update_logs(created_at);

-- ============================================================
-- Row Level Security (optional — for future direct-client use)
-- Backend on Railway connects as postgres table owner and bypasses RLS.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping custom roles — not required for Railway backend access';
END$$;

alter table public.users               enable row level security;
alter table public.partners            enable row level security;
alter table public.compliance_runs     enable row level security;
alter table public.compliance_findings enable row level security;
alter table public.documents           enable row level security;
alter table public.scheduled_reports   enable row level security;
alter table public.crm_update_logs     enable row level security;

-- Permissive authenticated policies (only if role exists).
-- The Fastify backend uses direct pg access as table owner — not these roles.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise notice 'Skipping RLS policies — authenticated role not present';
    return;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='users_auth_all') then
    create policy users_auth_all on public.users for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='partners' and policyname='partners_auth_all') then
    create policy partners_auth_all on public.partners for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='compliance_runs' and policyname='runs_auth_all') then
    create policy runs_auth_all on public.compliance_runs for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='compliance_findings' and policyname='findings_auth_all') then
    create policy findings_auth_all on public.compliance_findings for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='documents' and policyname='documents_auth_all') then
    create policy documents_auth_all on public.documents for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='scheduled_reports' and policyname='schedules_auth_all') then
    create policy schedules_auth_all on public.scheduled_reports for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_update_logs' and policyname='crm_auth_all') then
    create policy crm_auth_all on public.crm_update_logs for all to authenticated using (true) with check (true);
  end if;
end$$;

-- ============================================================
-- Seed: demo user (password "demo123" — authService has a literal fallback)
-- ============================================================
insert into public.users (email, password_hash, full_name)
values ('demo@example.com', 'demo123', 'Demo User')
on conflict (email) do nothing;
