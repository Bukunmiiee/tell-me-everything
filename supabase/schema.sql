-- ============================================================
-- TELL ME EVERYTHING — DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- Required for gen_random_uuid() / secure random tokens
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. APPLICANTS
-- One row per person. Minimal fields on purpose — no address,
-- no ID, no financial info.
-- ------------------------------------------------------------
create table applicants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int,
  occupation text,
  email text,                -- optional, only used for status update emails
  has_children boolean,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. APPLICATIONS
-- One row per submission. Holds the private status token —
-- this is the secret string in the /status/[token] URL.
-- ------------------------------------------------------------
create type application_status as enum (
  'in_progress',      -- still filling out the form (autosave)
  'submitted',
  'reading',
  'still_thinking',
  'lets_talk_more',
  'not_right_now'
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  status application_status not null default 'in_progress',
  status_token text not null unique default encode(gen_random_bytes(32), 'hex'), -- 64-char secret, unguessable
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on applications (status_token);
create index on applications (applicant_id);

-- ------------------------------------------------------------
-- 3. RESPONSES
-- One row per question answer. question_id is a stable string
-- key (e.g. "intentions_looking_for") defined in the app code
-- (src/lib/questions.ts) — NOT a foreign key to a "questions"
-- table. This means you can edit question text, reorder, or add
-- new questions in code any time without touching this table
-- or migrating the database.
-- ------------------------------------------------------------
create table responses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  question_id text not null,
  answer text,
  updated_at timestamptz not null default now(),
  unique (application_id, question_id)
);

create index on responses (application_id);

-- ------------------------------------------------------------
-- 4. REVIEWS
-- Your private scoring + notes. NEVER exposed to applicants.
-- One review row per application.
-- ------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references applications(id) on delete cascade,

  score_intentionality int check (score_intentionality between 1 and 10),
  score_emotional_maturity int check (score_emotional_maturity between 1 and 10),
  score_communication int check (score_communication between 1 and 10),
  score_spiritual_alignment int check (score_spiritual_alignment between 1 and 10),
  score_values_alignment int check (score_values_alignment between 1 and 10),
  score_financial_responsibility int check (score_financial_responsibility between 1 and 10),
  score_relationship_readiness int check (score_relationship_readiness between 1 and 10),
  score_overall_compatibility int check (score_overall_compatibility between 1 and 10),

  green_flags text,
  concerns text,
  ask_in_person text,
  general_notes text,
  do_not_continue boolean not null default false,

  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. DECISIONS
-- A log of every decision made, so there's a history over time
-- (not just the current status).
-- ------------------------------------------------------------
create type decision_choice as enum (
  'continue_getting_to_know',
  'another_conversation',
  'take_it_slowly',
  'better_as_friends',
  'not_compatible'
);

create table decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  choice decision_choice not null,
  email_sent boolean not null default false,
  email_body text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Keep applications.updated_at fresh automatically
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger applications_set_updated_at
before update on applications
for each row execute function set_updated_at();

create trigger reviews_set_updated_at
before update on reviews
for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
--
-- Model: applicants and the public never talk to Supabase
-- directly using their own login. All public reads/writes go
-- through Next.js server routes using the SERVICE ROLE key
-- (server-side only, never sent to the browser), which bypasses
-- RLS deliberately and safely, because our own server code
-- controls exactly what's allowed (e.g. "only rows matching
-- this exact token").
--
-- RLS is still enabled and locked down as defense-in-depth: if
-- anything were ever queried directly with the public anon key,
-- it should return nothing.
-- ============================================================

alter table applicants enable row level security;
alter table applications enable row level security;
alter table responses enable row level security;
alter table reviews enable row level security;
alter table decisions enable row level security;

-- No policies are created for the anon/public role on any table.
-- With RLS enabled and zero policies, the anon key can read or
-- write NOTHING. All access happens via server-side code using
-- the service role key, which always bypasses RLS by design.
-- This is intentional and is the safest model for this app.
