-- ─── Leads table ──────────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor to create the leads table.

create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null,
  url                 text not null,
  score               integer,
  severity            text,
  ad_loss_percent     numeric,
  bounce_rate_increase numeric,
  annual_revenue_loss numeric,
  pain_point          text,
  revenue_potential   text,
  last_audit          text,
  source              text,
  phone               text,
  q1                  text,
  q2                  text,
  q3                  text,
  tier                text default 'free',
  status              text default 'new' check (status in ('new','contacted','converted','spam')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Index for common queries
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_tier_idx on public.leads(tier);

-- Row Level Security — only service role can read/write (admin API uses service key)
alter table public.leads enable row level security;

-- No public access policy — all access goes through the service role key in the API
