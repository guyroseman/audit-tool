-- ─── Leads table ──────────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- This creates the leads table and grants the right permissions.
-- Safe to run multiple times (uses IF NOT EXISTS).

create table if not exists public.leads (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null,
  url                  text not null,
  score                integer,
  severity             text,
  ad_loss_percent      numeric,
  bounce_rate_increase numeric,
  annual_revenue_loss  numeric,
  total_monthly_cost   numeric,
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

-- Add total_monthly_cost if upgrading from previous schema
alter table public.leads add column if not exists total_monthly_cost numeric;

-- Indexes for common queries
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_status_idx     on public.leads(status);
create index if not exists leads_tier_idx       on public.leads(tier);
create index if not exists leads_email_idx      on public.leads(email);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.leads enable row level security;

-- Allow anyone (anon) to INSERT — public-facing capture API
create policy "anon can insert leads"
  on public.leads for insert
  to anon
  with check (true);

-- Allow anon to SELECT — needed for admin panel
create policy "anon can read leads"
  on public.leads for select
  to anon
  using (true);

-- Allow anon to UPDATE status — admin panel status changes
create policy "anon can update leads"
  on public.leads for update
  to anon
  using (true)
  with check (true);
