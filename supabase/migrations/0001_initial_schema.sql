create extension if not exists "pgcrypto";

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  onlyfans_username text not null unique,
  status text not null default 'active',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  platform text not null,
  username text not null,
  profile_url text,
  is_warmup boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.traffic_snapshots (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  source_platform text not null,
  followers integer not null default 0,
  engagement_rate numeric(5, 2) not null default 0,
  clicks integer not null default 0,
  snapshot_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fans (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references public.models(id) on delete set null,
  username text not null,
  total_spent numeric(12, 2) not null default 0,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references public.models(id) on delete set null,
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  fan_id uuid not null references public.fans(id) on delete cascade,
  model_id uuid references public.models(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  sent_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references public.models(id) on delete set null,
  title text not null,
  storage_path text,
  content_type text not null default 'photo',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_schedule (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references public.models(id) on delete set null,
  content_item_id uuid references public.content_items(id) on delete set null,
  publish_at timestamptz not null,
  channel text not null,
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_entries (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  amount numeric(12, 2) not null,
  source text not null,
  revenue_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.models enable row level security;
alter table public.social_accounts enable row level security;
alter table public.traffic_snapshots enable row level security;
alter table public.fans enable row level security;
alter table public.message_templates enable row level security;
alter table public.chat_messages enable row level security;
alter table public.content_items enable row level security;
alter table public.content_schedule enable row level security;
alter table public.revenue_entries enable row level security;

create policy "authenticated users can read/write models"
on public.models for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write social_accounts"
on public.social_accounts for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write traffic_snapshots"
on public.traffic_snapshots for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write fans"
on public.fans for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write message_templates"
on public.message_templates for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write chat_messages"
on public.chat_messages for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write content_items"
on public.content_items for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write content_schedule"
on public.content_schedule for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write revenue_entries"
on public.revenue_entries for all
to authenticated
using (true)
with check (true);
