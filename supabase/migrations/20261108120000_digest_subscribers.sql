-- "Stay updated" monthly digest.
-- One row per email with the cities and topics chosen. The table is not readable or writable by anon/authenticated:
-- the Worker goes through the security-definer functions below, which check a shared secret (the DIGEST_SECRET
-- Worker secret, stored here in private.app_secrets). Unsubscribing only needs the per-subscriber token.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_secrets (
  name text primary key,
  value text not null
);
revoke all on private.app_secrets from public, anon, authenticated;
-- The value is set out of band: insert into private.app_secrets values ('digest', '<DIGEST_SECRET>') on conflict (name) do update set value = excluded.value;

create table if not exists public.digest_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default '',
  cities text[] not null check (cardinality(cities) > 0),
  restaurants boolean not null default true,
  masjids boolean not null default true,
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_digest_at timestamptz,
  unsubscribed_at timestamptz,
  check (restaurants or masjids)
);
create unique index if not exists digest_subscribers_email_key on public.digest_subscribers (lower(email));
alter table public.digest_subscribers enable row level security;
revoke all on public.digest_subscribers from anon, authenticated;

create or replace function private.digest_secret_ok(p_secret text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.app_secrets where name = 'digest' and value = p_secret and length(p_secret) >= 32);
$$;
revoke all on function private.digest_secret_ok(text) from public, anon, authenticated;

-- Sign up or update: re-subscribing merges cities and re-enables the topics chosen.
create or replace function public.digest_subscribe(p_secret text, p_email text, p_name text, p_cities text[], p_restaurants boolean, p_masjids boolean)
returns table (token uuid, is_new boolean)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.digest_secret_ok(p_secret) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  insert into public.digest_subscribers as s (email, name, cities, restaurants, masjids)
  values (lower(trim(p_email)), coalesce(nullif(trim(p_name), ''), ''), p_cities, p_restaurants, p_masjids)
  on conflict (lower(email)) do update set
    name = coalesce(nullif(excluded.name, ''), s.name),
    cities = case when s.unsubscribed_at is null then (select array_agg(distinct c order by c) from unnest(s.cities || excluded.cities) c) else excluded.cities end,
    restaurants = case when s.unsubscribed_at is null then s.restaurants or excluded.restaurants else excluded.restaurants end,
    masjids = case when s.unsubscribed_at is null then s.masjids or excluded.masjids else excluded.masjids end,
    unsubscribed_at = null,
    updated_at = now()
  returning s.token, (s.xmax = 0);
end;
$$;

-- Everyone still subscribed, for the monthly send.
create or replace function public.digest_due(p_secret text)
returns table (id uuid, email text, name text, cities text[], restaurants boolean, masjids boolean, token uuid, since timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.digest_secret_ok(p_secret) then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select s.id, s.email, s.name, s.cities, s.restaurants, s.masjids, s.token,
         coalesce(s.last_digest_at, s.created_at - interval '1 month')
  from public.digest_subscribers s
  where s.unsubscribed_at is null
  order by s.created_at;
end;
$$;

create or replace function public.digest_mark_sent(p_secret text, p_ids uuid[], p_at timestamptz)
returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if not private.digest_secret_ok(p_secret) then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.digest_subscribers set last_digest_at = p_at where id = any(p_ids);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Unsubscribe link: the token is the only credential.
create or replace function public.digest_unsubscribe(p_token uuid)
returns boolean
language sql security definer set search_path = '' as $$
  with u as (
    update public.digest_subscribers set unsubscribed_at = coalesce(unsubscribed_at, now()), updated_at = now()
    where token = p_token returning 1
  ) select exists (select 1 from u);
$$;

revoke all on function public.digest_subscribe(text, text, text, text[], boolean, boolean) from public;
revoke all on function public.digest_due(text) from public;
revoke all on function public.digest_mark_sent(text, uuid[], timestamptz) from public;
revoke all on function public.digest_unsubscribe(uuid) from public;
grant execute on function public.digest_subscribe(text, text, text, text[], boolean, boolean) to anon, authenticated;
grant execute on function public.digest_due(text) to anon, authenticated;
grant execute on function public.digest_mark_sent(text, uuid[], timestamptz) to anon, authenticated;
grant execute on function public.digest_unsubscribe(uuid) to anon, authenticated;

-- Bring across sign-ups saved before this table existed (stored in contact_submissions as topic 'subscribe').
insert into public.digest_subscribers (email, name, cities, restaurants, masjids, created_at)
select distinct on (lower(c.email))
  lower(c.email),
  case when c.name = 'Subscriber' then '' else c.name end,
  string_to_array(replace(substring(c.body from 'Cities: ([^\n]*)'), ' ', ''), ','),
  coalesce(substring(c.body from 'Topics: ([^\n]*)'), '') ilike '%restaurant%',
  coalesce(substring(c.body from 'Topics: ([^\n]*)'), '') ilike '%masjid%',
  c.created_at
from public.contact_submissions c
where c.topic = 'subscribe' and c.body ~ 'Cities: ' and c.body ~* 'Topics: .*(restaurant|masjid)'
order by lower(c.email), c.created_at desc
on conflict do nothing;
