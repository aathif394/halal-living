-- Add contact fields for pre-auth membership flow
alter table public.members
  add column if not exists name  text,
  add column if not exists email text,
  add column if not exists phone text;

-- Extend status enum to cover Razorpay subscription states
alter table public.members
  drop constraint if exists members_status_check;

alter table public.members
  add constraint members_status_check
  check (status in ('pending', 'active', 'cancelled', 'expired', 'halted', 'payment_failed'));
