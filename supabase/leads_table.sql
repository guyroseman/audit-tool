-- ─── Leads table ──────────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- This creates the leads table and grants the right permissions so it works
-- even without a service role key in .env.local.

create table if not exists public.leads (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null,
  url                  text not null,
  score                integer,
  severity             text,
  ad_loss_percent      numeric,
  bounce_rate_increase numeric,
  annual_revenue_loss  numeric,
  pain_point           text,
  revenue_potential    text,
  last_audit           text,
  source               text,
  phone                text,
  q1                   text,
  q2                   text,
  q3                   text,
  tier                 text default 'free',
  status               text default 'new' check (status in ('new','contacted','converted','spam')),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Indexes for common queries
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_status_idx    on public.leads(status);
create index if not exists leads_tier_idx      on public.leads(tier);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.leads enable row level security;

-- Allow anyone (anon) to INSERT — needed for /api/capture without service role key.
-- This is intentional: the capture API is public-facing.
create policy "anon can insert leads"
  on public.leads for insert
  to anon
  with check (true);

-- Allow anon to SELECT — needed for /api/admin/leads without service role key.
-- If you add SUPABASE_SERVICE_ROLE_KEY to .env.local this policy is not needed
-- (service role bypasses RLS automatically).
create policy "anon can read leads"
  on public.leads for select
  to anon
  using (true);

-- Allow anon to UPDATE status — needed for /api/admin/leads PATCH.
create policy "anon can update leads"
  on public.leads for update
  to anon
  using (true)
  with check (true);
