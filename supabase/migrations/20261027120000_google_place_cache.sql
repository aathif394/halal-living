alter table public.restaurants
  add column if not exists google_place_id text,
  add column if not exists google_maps_url text,
  add column if not exists google_rating numeric(3,1),
  add column if not exists google_review_count integer,
  add column if not exists google_reviews jsonb not null default '[]'::jsonb,
  add column if not exists google_photos jsonb not null default '[]'::jsonb,
  add column if not exists google_hours jsonb not null default '[]'::jsonb,
  add column if not exists google_phone text,
  add column if not exists google_open_now boolean,
  add column if not exists google_synced_at timestamptz;

alter table public.prayer_halls
  add column if not exists google_place_id text,
  add column if not exists google_maps_url text,
  add column if not exists google_rating numeric(3,1),
  add column if not exists google_review_count integer,
  add column if not exists google_reviews jsonb not null default '[]'::jsonb,
  add column if not exists google_photos jsonb not null default '[]'::jsonb,
  add column if not exists google_hours jsonb not null default '[]'::jsonb,
  add column if not exists google_phone text,
  add column if not exists google_open_now boolean,
  add column if not exists google_synced_at timestamptz;

create index if not exists restaurants_google_place_id_idx
  on public.restaurants (google_place_id)
  where google_place_id is not null;

create index if not exists prayer_halls_google_place_id_idx
  on public.prayer_halls (google_place_id)
  where google_place_id is not null;
