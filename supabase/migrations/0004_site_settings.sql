-- Create site_settings table
create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.site_settings enable row level security;

-- Allow public read access
create policy "site_settings public read" on public.site_settings
  for select using (true);

-- Trigger for updated_at
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Seed initial about_page data
insert into public.site_settings (key, value)
values (
  'about_page',
  '{
    "title": "A directory\nbuilt by neighbours.",
    "thesis_label": "The thesis",
    "thesis_body": "Chennai''s halal kitchens and prayer halls are mostly known by word of mouth — your father''s cousin''s friend swears by Buhari, an uncle who prayed at Wallajah for forty years. We are trying to write that knowledge down.",
    "stats": [
      {"number": "248", "label": "Halal kitchens listed"},
      {"number": "87", "label": "Prayer spaces listed"},
      {"number": "14", "label": "Volunteer editors"},
      {"number": "48k", "label": "Weekly readers"}
    ],
    "process_label": "Our process",
    "process_title": "How a listing\ngets made.",
    "process_steps": [
      {"number": "01", "title": "We visit", "body": "Twice — once unannounced, once introduced. We pay for our own meals."},
      {"number": "02", "title": "We verify", "body": "Halal certification is confirmed in writing. Self-certified kitchens are labelled honestly."},
      {"number": "03", "title": "We listen", "body": "Reader reports re-open every listing. Disputes are investigated within 14 days."}
    ],
    "quote": "We are not a Yelp. We are not a guidebook. We are a neighbour, walking you to the place where the biryani is good and the parking is easy and the mosque next door has shade in the afternoon.",
    "quote_author": "From the Founders'' Letter, Issue 1"
  }'::jsonb
) on conflict (key) do nothing;
