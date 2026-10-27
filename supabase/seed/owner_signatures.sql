-- Sample owner attestations for every restaurant.
--
-- These are placeholders, not collected attestations: each row is signed by the
-- establishment's own management rather than a named individual, because
-- inventing a person's signature against a real business would misstate who
-- vouched for its halal status. Replace each row with the signature the owner
-- actually gives you (admin -> restaurant -> Owner signature).
--
-- Safe to run more than once.

alter table public.restaurants
  add column if not exists owner_signature text,
  add column if not exists owner_title text,
  add column if not exists signed_on date;


update public.restaurants set
  owner_signature = 'Albert Bakery',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'albert-bakery-frazer-town';

update public.restaurants set
  owner_signature = 'Chichaba''s Taj',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'chichabas-taj-frazer-town';

update public.restaurants set
  owner_signature = 'Corner House Ice Cream',
  owner_title = 'Kitchen management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'corner-house-koramangala';

update public.restaurants set
  owner_signature = 'Empire Restaurant',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'empire-restaurant-frazer-town';

update public.restaurants set
  owner_signature = 'Fanoos',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'fanoos-johnson-market';

update public.restaurants set
  owner_signature = 'Imperial Residency',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'imperial-residency-richmond';

update public.restaurants set
  owner_signature = 'Imperial Restaurant',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'imperial-vasanth-nagar';

update public.restaurants set
  owner_signature = 'Karama Restaurant',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'karama-restaurant-frazer-town';

update public.restaurants set
  owner_signature = 'Lakeview Milkbar',
  owner_title = 'Kitchen management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'lakeview-milkbar-mg-road';

update public.restaurants set
  owner_signature = 'Mavalli Tiffin Room (MTR)',
  owner_title = 'Kitchen management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'mtr-lalbagh-road';

update public.restaurants set
  owner_signature = 'Mubaarak Biryani',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'mubaarak-biryani-koramangala';

update public.restaurants set
  owner_signature = 'Nagarjuna',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'nagarjuna-indiranagar';

update public.restaurants set
  owner_signature = 'Rahhams',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'rahhams-frazer-town';

update public.restaurants set
  owner_signature = 'Savoury Restaurant',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'savoury-mosque-road';

update public.restaurants set
  owner_signature = 'Siddique Kabab Centre',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'siddique-kabab-jayanagar';

update public.restaurants set
  owner_signature = 'Bilal Hotel',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'bilal-hotel-mount-road';

update public.restaurants set
  owner_signature = 'Buhari',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'buhari-anna-salai';

update public.restaurants set
  owner_signature = 'Charminar Biryani',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'charminar-biryani-triplicane';

update public.restaurants set
  owner_signature = 'Dindigul Thalappakatti',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'dindigul-thalappakatti-nungambakkam';

update public.restaurants set
  owner_signature = 'Fishermans Fare',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'fishermans-fare-egmore';

update public.restaurants set
  owner_signature = 'Hameedia Hotel',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'hameedia-hotel-triplicane';

update public.restaurants set
  owner_signature = 'Hotel Crescent',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'hotel-crescent-royapettah';

update public.restaurants set
  owner_signature = 'Junior Kuppanna',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'junior-kuppanna-anna-nagar';

update public.restaurants set
  owner_signature = 'Kebab Corner',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'kebab-corner-greams-road';

update public.restaurants set
  owner_signature = 'Ponnusamy Hotel',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'ponnusamy-hotel-t-nagar';

update public.restaurants set
  owner_signature = 'Rahmath Beef Stall',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'rahmath-beef-stall-royapettah';

update public.restaurants set
  owner_signature = 'Salem RR Briyani',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'salem-rr-briyani-adyar';

update public.restaurants set
  owner_signature = 'Sangeetha Veg',
  owner_title = 'Kitchen management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'sangeetha-veg-mylapore';

update public.restaurants set
  owner_signature = 'Savoury Sea Shell',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'savoury-sea-shell-anna-nagar';

update public.restaurants set
  owner_signature = 'Ya Mohideen Biryani',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'ya-mohideen-pallavaram';

update public.restaurants set
  owner_signature = 'Zaitoon Restaurant',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'zaitoon-nungambakkam';

update public.restaurants set
  owner_signature = '4M Biryani House',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = '4m-biryani-house-musheerabad';

update public.restaurants set
  owner_signature = 'Alpha Hotel',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'alpha-hotel-secunderabad';

update public.restaurants set
  owner_signature = 'Bawarchi',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'bawarchi-rtc-x-roads';

update public.restaurants set
  owner_signature = 'Cafe Bahar',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'cafe-bahar-basheer-bagh';

update public.restaurants set
  owner_signature = 'Chutneys',
  owner_title = 'Kitchen management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'chutneys-himayatnagar';

update public.restaurants set
  owner_signature = 'Grand Hotel',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'grand-hotel-abids';

update public.restaurants set
  owner_signature = 'Hotel Nayab',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'nayab-hotel-madina';

update public.restaurants set
  owner_signature = 'Jewel of Nizams',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'jewel-of-nizams-gandipet';

update public.restaurants set
  owner_signature = 'Mandi @ 36',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'mandi-36-jubilee-hills';

update public.restaurants set
  owner_signature = 'Paradise Biryani',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'paradise-biryani-secunderabad';

update public.restaurants set
  owner_signature = 'Peshawari',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'peshawari-begumpet';

update public.restaurants set
  owner_signature = 'Pista House',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'pista-house-charminar';

update public.restaurants set
  owner_signature = 'Shadab Hotel',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'shadab-hotel-charminar';

update public.restaurants set
  owner_signature = 'Shah Ghouse',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'shah-ghouse-toli-chowki';

update public.restaurants set
  owner_signature = 'Shahran Hotel',
  owner_title = 'Management',
  signed_on = date '2026-09-01',
  updated_at = now()
where slug = 'shahran-hotel-charminar';


-- Verify:
--   select name, owner_signature, owner_title, signed_on
--   from public.restaurants order by city, name;
