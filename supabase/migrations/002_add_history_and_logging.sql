-- ============================================================
-- MIGRATION 002 — Audit trail, email logging, duplicate detection
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- AUDIT LOG
-- One row per meaningful change (a review save, or a decision).
-- Stores who changed it, when, and a before/after snapshot.
-- Kept generic (jsonb) so it can capture either scores or
-- decisions without needing a different table for each.
-- ------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  change_type text not null check (change_type in ('review', 'decision')),
  changed_by text,               -- admin's email, from the auth session
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index on audit_log (application_id, created_at desc);

-- ------------------------------------------------------------
-- EMAIL LOG
-- One row per email send attempt (success or failure), so you
-- can see exactly what happened without digging through Vercel
-- logs.
-- ------------------------------------------------------------
create table email_log (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  recipient text not null,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  sent_at timestamptz not null default now()
);

create index on email_log (application_id, sent_at desc);

alter table audit_log enable row level security;
alter table email_log enable row level security;
-- Same model as the rest of the schema: no public policies, all
-- access via the service-role key in server-side code only.

-- ------------------------------------------------------------
-- DUPLICATE DETECTION
-- A fast lookup so /api/submit can check "does an applicant with
-- this email already exist?" before creating a new record.
-- (Not a unique constraint, deliberately — a real duplicate check
-- needs to WARN, not hard-block, since two different people could
-- legitimately share an email in rare cases, or someone may
-- intentionally want to resubmit.)
-- ------------------------------------------------------------
create index if not exists applicants_email_idx on applicants (email) where email is not null;
