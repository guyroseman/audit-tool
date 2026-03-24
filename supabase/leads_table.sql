-- ─── Leads table ──────────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to run multiple times — uses IF NOT EXISTS everywhere.

-- 1. Create table (only runs if it doesn't exist yet)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add every column individually — safe if already present
alter table public.leads add column if not exists score               integer;
alter table public.leads add column if not exists severity            text;
alter table public.leads add column if not exists ad_loss_percent     numeric;
alter table public.leads add column if not exists bounce_rate_increase numeric;
alter table public.leads add column if not exists annual_revenue_loss numeric;
alter table public.leads add column if not exists total_monthly_cost  numeric;
alter table public.leads add column if not exists pain_point          text;
alter table public.leads add column if not exists revenue_potential   text;
alter table public.leads add column if not exists last_audit          text;
alter table public.leads add column if not exists source              text;
alter table public.leads add column if not exists phone               text;
alter table public.leads add column if not exists q1                  text;
alter table public.leads add column if not exists q2                  text;
alter table public.leads add column if not exists q3                  text;
alter table public.leads add column if not exists tier                text default 'free';
alter table public.leads add column if not exists status              text default 'new';

-- 3. Indexes
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_status_idx     on public.leads(status);
create index if not exists leads_tier_idx       on public.leads(tier);
create index if not exists leads_email_idx      on public.leads(email);

-- 4. Row Level Security
alter table public.leads enable row level security;

-- Drop and recreate policies (idempotent)
drop policy if exists "anon can insert leads" on public.leads;
drop policy if exists "anon can read leads"   on public.leads;
drop policy if exists "anon can update leads" on public.leads;

create policy "anon can insert leads"
  on public.leads for insert to anon with check (true);

create policy "anon can read leads"
  on public.leads for select to anon using (true);

create policy "anon can update leads"
  on public.leads for update to anon using (true) with check (true);
