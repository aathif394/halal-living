-- Enable necessary extensions
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ─── SITE B: HALAL DISCOVERY ────────────────────────────────────────────────

create table public.restaurants (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  tagline      text not null default '',
  cuisine      text not null,
  neighborhood text not null,
  city         text not null default 'chennai',
  address      text not null default '',
  lat          double precision not null default 0,
  lng          double precision not null default 0,
  rating       numeric(3,1) not null default 0,
  review_count integer not null default 0,
  price_range  text not null default '₹₹',
  certification text not null,
  open_hours   text not null default '',
  phone        text,
  description  text,
  hero_image   text,
  gallery      jsonb not null default '[]',
  tags         text[] not null default '{}',
  tone         text not null default 'warm',
  is_open      boolean not null default true,
  closes_at    text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.prayer_halls (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  nick         text,
  neighborhood text not null,
  city         text not null default 'chennai',
  address      text not null default '',
  lat          double precision not null default 0,
  lng          double precision not null default 0,
  capacity     integer not null default 0,
  madhab       text not null default 'Mixed',
  facilities   text[] not null default '{}',
  jummah_time  text not null default '1:00 PM',
  fajr         text not null default '5:14',
  dhuhr        text not null default '12:18',
  asr          text not null default '4:32',
  maghrib      text not null default '6:14',
  isha         text not null default '7:32',
  description  text,
  note         text,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.featured_placements (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  kind          text not null,
  name          text not null,
  pitch         text not null,
  cta           text not null,
  sponsor_label text not null,
  tone          text not null default 'warm',
  week_start    date not null,
  week_end      date not null,
  active        boolean not null default true
);

-- Full-text search index (restaurants)
create index restaurants_fts_idx on public.restaurants
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(tagline,'') || ' ' || coalesce(cuisine,'') || ' ' || coalesce(neighborhood,'')));

-- Full-text search index (prayer halls)
create index prayer_halls_fts_idx on public.prayer_halls
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(nick,'') || ' ' || coalesce(neighborhood,'')));

-- City + cuisine composite index for category pages
create index restaurants_city_cuisine_idx on public.restaurants(city, cuisine) where active = true;
create index restaurants_city_neighborhood_idx on public.restaurants(city, neighborhood) where active = true;
create index prayer_halls_city_idx on public.prayer_halls(city) where active = true;

-- ─── SITE A: MEMBERSHIP ─────────────────────────────────────────────────────

create table public.members (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references auth.users(id) on delete cascade,
  plan                      text not null check (plan in ('monthly', 'annual', 'founder')),
  status                    text not null default 'pending' check (status in ('active', 'cancelled', 'expired', 'pending')),
  razorpay_subscription_id  text,
  razorpay_payment_id       text,
  razorpay_order_id         text,
  started_at                timestamptz not null default now(),
  expires_at                timestamptz,
  created_at                timestamptz not null default now()
);

create index members_user_id_idx on public.members(user_id);
create index members_status_idx on public.members(status);

create table public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  topic      text not null,
  name       text not null,
  email      text not null,
  subject    text not null,
  body       text not null,
  created_at timestamptz not null default now()
);

-- ─── ROW-LEVEL SECURITY ─────────────────────────────────────────────────────

alter table public.restaurants enable row level security;
alter table public.prayer_halls enable row level security;
alter table public.featured_placements enable row level security;
alter table public.members enable row level security;
alter table public.contact_submissions enable row level security;

-- Public read access for discovery tables
create policy "restaurants public read" on public.restaurants
  for select using (active = true);

create policy "prayer_halls public read" on public.prayer_halls
  for select using (active = true);

create policy "featured_placements public read" on public.featured_placements
  for select using (active = true and week_end >= current_date);

-- Members: users can read their own record
create policy "members own read" on public.members
  for select using (auth.uid() = user_id);

-- Contact submissions: insert only (anon), no public read
create policy "contact_submissions insert" on public.contact_submissions
  for insert with check (true);

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();

create trigger prayer_halls_updated_at before update on public.prayer_halls
  for each row execute function public.set_updated_at();
