-- Add signatures and reviews columns to restaurants table
alter table public.restaurants
  add column if not exists signatures jsonb not null default '[]',
  add column if not exists reviews    jsonb not null default '[]';
