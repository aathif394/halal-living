-- Curated Instagram content for the main site. Posts can be entered manually
-- or synchronized from a professional Instagram account through Meta's API.
create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  instagram_media_id text unique,
  source text not null default 'manual' check (source in ('manual', 'meta')),
  media_type text not null default 'IMAGE' check (media_type in ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS')),
  media_url text not null,
  thumbnail_url text,
  permalink text not null,
  caption text,
  alt_text text,
  published_at timestamptz,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.instagram_posts enable row level security;

grant select on public.instagram_posts to anon, authenticated;
grant insert, update, delete on public.instagram_posts to authenticated;

create policy "instagram_posts: public active read"
  on public.instagram_posts
  for select
  to anon, authenticated
  using (active = true);

create policy "instagram_posts: admin all"
  on public.instagram_posts
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create index instagram_posts_public_feed_idx
  on public.instagram_posts (position asc, published_at desc)
  where active = true;
