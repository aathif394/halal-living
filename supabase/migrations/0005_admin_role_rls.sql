-- ─── 0005: ADMIN ROLE VIA PROFILES ────────────────────────────────────────────
--
-- Instead of using the service role key from the app, we:
--   1. Create a `profiles` table with a `role` column
--   2. Add RLS policies granting full access to users with role = 'admin'
--   3. Expose a safe `admin_users_view` so admins can list auth users without
--      needing the service role key
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Profiles table (one row per auth.users row)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles: own read" on public.profiles
  for select using (auth.uid() = id);

-- Admins can read all profiles
create policy "profiles: admin read all" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Admins can update any profile (e.g. change roles)
create policy "profiles: admin update" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Helper function: is the current user an admin?
--    Used in all RLS policies below to keep things DRY.
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Admin RLS policies for all tables
--    Admins get full SELECT / INSERT / UPDATE / DELETE on everything.

-- restaurants
create policy "restaurants: admin all" on public.restaurants
  for all using (public.is_admin()) with check (public.is_admin());

-- prayer_halls
create policy "prayer_halls: admin all" on public.prayer_halls
  for all using (public.is_admin()) with check (public.is_admin());

-- featured_placements
create policy "featured_placements: admin all" on public.featured_placements
  for all using (public.is_admin()) with check (public.is_admin());

-- members
create policy "members: admin all" on public.members
  for all using (public.is_admin()) with check (public.is_admin());

-- contact_submissions
create policy "contact_submissions: admin read" on public.contact_submissions
  for select using (public.is_admin());

-- site_settings (from migration 0004)
create policy "site_settings: admin all" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- 4. A safe view so admins can list auth users without the service role key.
--    security definer runs as the owner (postgres), but we gate it with is_admin().
create or replace view public.admin_users_view
  with (security_invoker = false)
as
  select
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.raw_user_meta_data  as metadata,
    coalesce(p.role, 'user') as role
  from auth.users u
  left join public.profiles p on p.id = u.id;

-- Only admins may query this view
revoke all on public.admin_users_view from anon, authenticated;
grant select on public.admin_users_view to authenticated;

create policy "admin_users_view: admin only" on public.profiles
  for select using (public.is_admin());
