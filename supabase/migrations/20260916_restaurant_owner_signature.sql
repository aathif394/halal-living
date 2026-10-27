-- The owner's own attestation behind a halal certification claim.
-- Self-certified kitchens carry no third-party certificate, so the signature of
-- the person responsible is the evidence we can show a reader.
alter table public.restaurants
  add column if not exists owner_signature text,
  add column if not exists owner_title text,
  add column if not exists signed_on date;

comment on column public.restaurants.owner_signature is
  'Name as signed by the owner/manager attesting to the certification claim.';
comment on column public.restaurants.owner_title is
  'How the signatory describes their role, e.g. Owner, Managing partner.';
comment on column public.restaurants.signed_on is
  'Date the owner gave the attestation.';
