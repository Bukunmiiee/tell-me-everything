-- ============================================================
-- MIGRATION 002 — Stage 11 additions
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- Duplicate submission prevention (Item 10)
-- Only enforced when an email was actually provided (it's optional).
-- ------------------------------------------------------------
create unique index if not exists applicants_email_unique
  on applicants (lower(email))
  where email is not null;

-- ------------------------------------------------------------
-- Who made each decision (Item 5 / 7)
-- ------------------------------------------------------------
alter table decisions add column if not exists changed_by text;

-- ------------------------------------------------------------
-- Review audit trail (Item 5)
-- One row per save, capturing what changed. Append-only — never
-- updated or deleted, so it builds a full history over time.
-- ------------------------------------------------------------
create table if not exists review_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  changed_by text,
  changed_at timestamptz not null default now(),
  previous_scores jsonb,
  new_scores jsonb,
  previous_decision decision_choice,
  new_decision decision_choice
);

create index if not exists review_history_application_id_idx on review_history (application_id);

-- ------------------------------------------------------------
-- Email delivery log (Item 8)
-- One row per send attempt (success or failure), so you can see
-- exactly what happened without digging through Resend's own
-- dashboard.
-- ------------------------------------------------------------
create type email_log_status as enum ('sent', 'failed');

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  decision_id uuid references decisions(id) on delete set null,
  recipient text not null,
  status email_log_status not null,
  error_message text,
  sent_at timestamptz not null default now()
);

create index if not exists email_logs_application_id_idx on email_logs (application_id);

alter table review_history enable row level security;
alter table email_logs enable row level security;
-- Same model as schema.sql: no public policies, service-role only.
