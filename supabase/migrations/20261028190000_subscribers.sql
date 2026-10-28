-- Email subscribers for the monthly per-city digest ("Stay updated").
create table public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text not null default '',
  city       text not null,
  rest       boolean not null default true,
  mas        boolean not null default true,
  status     text not null default 'subscribed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Insert only (anon), no public read or update: same shape as contact_submissions.
-- A re-subscribe just adds another row; de-duplicate at digest-send time.
create policy "subscribers insert" on public.subscribers
  for insert with check (true);
