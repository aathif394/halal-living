export type Signature = { name?: string; price?: string; note?: string };
export type Review = { who?: string; when?: string; rating?: number; body?: string };
export type GooglePhoto = { name: string; attributions: string[] };

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  cuisine: string;
  neighborhood: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  review_count: number;
  price_range: string;
  certification: string;
  open_hours: string;
  phone: string | null;
  description: string | null;
  hero_image: string | null;
  gallery: string[];
  tags: string[];
  is_open: boolean;
  closes_at: string | null;
  signatures: Signature[];
  reviews: Review[];
  owner_signature: string | null;
  owner_title: string | null;
  signed_on: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_reviews: Review[];
  google_photos: GooglePhoto[];
  google_hours: string[];
  google_phone: string | null;
  google_open_now: boolean | null;
  google_synced_at: string | null;
  distanceKm?: number;
};

export type PrayerHall = {
  id: string;
  slug: string;
  name: string;
  nick: string | null;
  neighborhood: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
  madhab: string;
  facilities: string[];
  jummah_time: string;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  description: string | null;
  note: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_reviews: Review[];
  google_photos: GooglePhoto[];
  google_hours: string[];
  google_phone: string | null;
  google_open_now: boolean | null;
  google_synced_at: string | null;
  distanceKm?: number;
};

export type Featured = {
  id: string;
  name: string;
  pitch: string;
  cta: string;
  sponsor_label: string;
  restaurant_slug: string | null;
  restaurant_city: string | null;
};

export type CommunityPost = {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url: string | null;
  permalink: string;
  caption: string | null;
  alt_text: string | null;
};

export type AboutPage = {
  title?: string;
  thesis_label?: string;
  thesis_body?: string;
  process_label?: string;
  process_title?: string;
  process_steps?: { number: string; title: string; body: string }[];
  quote?: string;
  quote_author?: string;
};
