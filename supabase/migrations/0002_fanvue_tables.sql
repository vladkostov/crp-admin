create table if not exists public.fanvue_accounts (
  id uuid primary key default gen_random_uuid(),
  account_name text not null,
  fanvue_username text not null,
  email text,
  password_encrypted text,
  api_key_encrypted text,
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'error', 'syncing')),
  last_sync_at timestamptz,
  revenue_this_month numeric(12, 2) not null default 0,
  fans_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fanvue_sync_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.fanvue_accounts(id) on delete cascade,
  status text not null check (status in ('success', 'failed')),
  message text,
  synced_at timestamptz not null default now()
);

create index if not exists fanvue_sync_logs_account_id_idx
  on public.fanvue_sync_logs (account_id, synced_at desc);

alter table public.fanvue_accounts enable row level security;
alter table public.fanvue_sync_logs enable row level security;

create policy "authenticated users can read/write fanvue_accounts"
on public.fanvue_accounts for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write fanvue_sync_logs"
on public.fanvue_sync_logs for all
to authenticated
using (true)
with check (true);
