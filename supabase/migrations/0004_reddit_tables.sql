create table if not exists public.reddit_accounts (
  id uuid primary key default gen_random_uuid(),
  account_name text not null,
  reddit_username text not null unique,
  notes text,
  status text not null default 'connected'
    check (status in ('connected', 'disconnected', 'error', 'syncing')),
  posts_count integer not null default 0,
  chats_count integer not null default 0,
  comment_karma integer not null default 0,
  link_karma integer not null default 0,
  total_karma integer not null default 0,
  last_sync_at timestamptz,
  password_encrypted text,
  refresh_token_encrypted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reddit_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.reddit_accounts(id) on delete cascade,
  reddit_post_id text not null,
  title text not null,
  subreddit text,
  permalink text,
  url text,
  selftext text,
  score integer not null default 0,
  comments_count integer not null default 0,
  posted_at timestamptz,
  scraped_at timestamptz not null default now(),
  unique (account_id, reddit_post_id)
);

create table if not exists public.reddit_chats (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.reddit_accounts(id) on delete cascade,
  external_id text not null,
  peer_username text,
  subject text,
  message_count integer not null default 0,
  last_message_at timestamptz,
  scraped_at timestamptz not null default now(),
  unique (account_id, external_id)
);

create table if not exists public.reddit_sync_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.reddit_accounts(id) on delete cascade,
  status text not null check (status in ('success', 'failed')),
  message text,
  metadata jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists reddit_posts_account_id_idx
  on public.reddit_posts (account_id, posted_at desc);

create index if not exists reddit_chats_account_id_idx
  on public.reddit_chats (account_id, last_message_at desc);

create index if not exists reddit_sync_logs_account_id_idx
  on public.reddit_sync_logs (account_id, synced_at desc);

alter table public.reddit_accounts enable row level security;
alter table public.reddit_posts enable row level security;
alter table public.reddit_chats enable row level security;
alter table public.reddit_sync_logs enable row level security;

create policy "authenticated users can read/write reddit_accounts"
on public.reddit_accounts for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write reddit_posts"
on public.reddit_posts for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write reddit_chats"
on public.reddit_chats for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can read/write reddit_sync_logs"
on public.reddit_sync_logs for all
to authenticated
using (true)
with check (true);
