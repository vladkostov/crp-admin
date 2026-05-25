create table if not exists public.fanvue_revenue_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.fanvue_accounts(id) on delete cascade,
  amount numeric(12, 2) not null default 0,
  period_label text not null default 'recent',
  recorded_at timestamptz not null default now()
);

create table if not exists public.fanvue_fan_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.fanvue_accounts(id) on delete cascade,
  fans_count integer not null default 0,
  recorded_at timestamptz not null default now()
);

create table if not exists public.fanvue_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.fanvue_accounts(id) on delete cascade,
  external_id text not null,
  title text,
  likes integer not null default 0,
  comments integer not null default 0,
  posted_at timestamptz,
  scraped_at timestamptz not null default now(),
  unique (account_id, external_id)
);

alter table public.fanvue_sync_logs
  add column if not exists metadata jsonb;

create index if not exists fanvue_revenue_entries_account_id_idx
  on public.fanvue_revenue_entries (account_id, recorded_at desc);

create index if not exists fanvue_fan_snapshots_account_id_idx
  on public.fanvue_fan_snapshots (account_id, recorded_at desc);

create index if not exists fanvue_posts_account_id_idx
  on public.fanvue_posts (account_id, scraped_at desc);

alter table public.fanvue_revenue_entries enable row level security;
alter table public.fanvue_fan_snapshots enable row level security;
alter table public.fanvue_posts enable row level security;

create policy "authenticated users can read/write fanvue_revenue_entries"
on public.fanvue_revenue_entries for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write fanvue_fan_snapshots"
on public.fanvue_fan_snapshots for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write fanvue_posts"
on public.fanvue_posts for all
to authenticated
using (true)
with check (true);
