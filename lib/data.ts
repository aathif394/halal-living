import { asGooglePhotos, asGoogleReviews, asHourLines } from "./google";
import { getSupabase } from "./supabase";
import type { AboutPage, CommunityPost, Featured, PrayerHall, Restaurant, Review, Signature } from "./types";

const GOOGLE_COLUMNS =
  "google_place_id,google_maps_url,google_rating,google_review_count,google_reviews,google_photos,google_hours,google_phone,google_open_now,google_synced_at";

const RESTAURANT_COLUMNS =
  "id,slug,name,tagline,cuisine,neighborhood,city,address,lat,lng,rating,review_count,price_range,certification,open_hours,phone,description,hero_image,gallery,tags,is_open,closes_at,signatures,reviews,owner_signature,owner_title,signed_on," +
  GOOGLE_COLUMNS;

const MASJID_COLUMNS =
  "id,slug,name,nick,neighborhood,city,address,lat,lng,capacity,madhab,facilities,jummah_time,fajr,dhuhr,asr,maghrib,isha,description,note," +
  GOOGLE_COLUMNS;

export type PlaceFilters = {
  q?: string;
  area?: string;
  cuisine?: string;
  lat?: number;
  lng?: number;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asSignatures(value: unknown): Signature[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as Signature[];
}

function asReviews(value: unknown): Review[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object") as Review[];
}

function googleFields(row: Record<string, unknown>) {
  return {
    google_place_id: row.google_place_id ? String(row.google_place_id) : null,
    google_maps_url: row.google_maps_url ? String(row.google_maps_url) : null,
    google_rating: row.google_rating == null || row.google_rating === "" ? null : Number(row.google_rating),
    google_review_count: row.google_review_count == null || row.google_review_count === "" ? null : Number(row.google_review_count),
    google_reviews: asGoogleReviews(row.google_reviews),
    google_photos: asGooglePhotos(row.google_photos),
    google_hours: asHourLines(row.google_hours),
    google_phone: row.google_phone ? String(row.google_phone) : null,
    google_open_now: typeof row.google_open_now === "boolean" ? row.google_open_now : null,
    google_synced_at: row.google_synced_at ? String(row.google_synced_at) : null,
  };
}

function mapRestaurant(row: Record<string, unknown>): Restaurant {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: String(row.tagline ?? ""),
    cuisine: String(row.cuisine ?? ""),
    neighborhood: String(row.neighborhood ?? ""),
    city: String(row.city),
    address: String(row.address ?? ""),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    rating: Number(row.rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    price_range: String(row.price_range ?? ""),
    certification: String(row.certification ?? ""),
    open_hours: String(row.open_hours ?? ""),
    phone: row.phone ? String(row.phone) : null,
    description: row.description ? String(row.description) : null,
    hero_image: row.hero_image ? String(row.hero_image) : null,
    gallery: asStringArray(row.gallery),
    tags: asStringArray(row.tags),
    is_open: Boolean(row.is_open),
    closes_at: row.closes_at ? String(row.closes_at) : null,
    signatures: asSignatures(row.signatures),
    reviews: asReviews(row.reviews),
    owner_signature: row.owner_signature ? String(row.owner_signature) : null,
    owner_title: row.owner_title ? String(row.owner_title) : null,
    signed_on: row.signed_on ? String(row.signed_on) : null,
    ...googleFields(row),
  };
}

function mapMasjid(row: Record<string, unknown>): PrayerHall {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    nick: row.nick ? String(row.nick) : null,
    neighborhood: String(row.neighborhood ?? ""),
    city: String(row.city),
    address: String(row.address ?? ""),
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    capacity: Number(row.capacity ?? 0),
    madhab: String(row.madhab ?? ""),
    facilities: asStringArray(row.facilities),
    jummah_time: String(row.jummah_time ?? ""),
    fajr: String(row.fajr ?? ""),
    dhuhr: String(row.dhuhr ?? ""),
    asr: String(row.asr ?? ""),
    maghrib: String(row.maghrib ?? ""),
    isha: String(row.isha ?? ""),
    description: row.description ? String(row.description) : null,
    note: row.note ? String(row.note) : null,
    ...googleFields(row),
  };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function safeTerm(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/[%_,().*"\\]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, 80) : undefined;
}

function sortByDistance<T extends { lat: number; lng: number }>(rows: T[], lat?: number, lng?: number): T[] {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return rows;
  return rows
    .map((row) => ({ ...row, distanceKm: haversineKm(lat, lng, row.lat, row.lng) }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export function parseCoord(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < -180 || number > 180) return undefined;
  return number;
}

async function queryRestaurants(city: string | undefined, filters: PlaceFilters): Promise<Restaurant[]> {
  const supabase = await getSupabase();
  let query = supabase.from("restaurants").select(RESTAURANT_COLUMNS).eq("active", true);
  if (city) query = query.eq("city", city);
  if (filters.area) query = query.eq("neighborhood", filters.area);
  if (filters.cuisine) query = query.eq("cuisine", filters.cuisine);
  const term = safeTerm(filters.q);
  if (term) {
    query = query.or(
      `name.ilike."%${term}%",cuisine.ilike."%${term}%",neighborhood.ilike."%${term}%",tagline.ilike."%${term}%"`,
    );
  }
  const { data, error } = await query.order("rating", { ascending: false }).limit(80);
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map(mapRestaurant);
  return sortByDistance(rows, filters.lat, filters.lng);
}

async function queryMasjids(city: string | undefined, filters: PlaceFilters): Promise<PrayerHall[]> {
  const supabase = await getSupabase();
  let query = supabase.from("prayer_halls").select(MASJID_COLUMNS).eq("active", true);
  if (city) query = query.eq("city", city);
  if (filters.area) query = query.eq("neighborhood", filters.area);
  const term = safeTerm(filters.q);
  if (term) {
    query = query.or(`name.ilike."%${term}%",neighborhood.ilike."%${term}%",nick.ilike."%${term}%"`);
  }
  const { data, error } = await query.order("name", { ascending: true }).limit(80);
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map(mapMasjid);
  return sortByDistance(rows, filters.lat, filters.lng);
}

export function listRestaurants(city: string, filters: PlaceFilters = {}) {
  return queryRestaurants(city, filters);
}

export function listMasjids(city: string, filters: PlaceFilters = {}) {
  return queryMasjids(city, filters);
}

export function searchRestaurants(filters: PlaceFilters) {
  return queryRestaurants(undefined, filters);
}

export function searchMasjids(filters: PlaceFilters) {
  return queryMasjids(undefined, filters);
}

export async function getRestaurant(city: string, slug: string): Promise<Restaurant | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("city", city)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRestaurant(data as unknown as Record<string, unknown>) : null;
}

export async function getMasjid(city: string, slug: string): Promise<PrayerHall | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("prayer_halls")
    .select(MASJID_COLUMNS)
    .eq("city", city)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapMasjid(data as unknown as Record<string, unknown>) : null;
}

export async function listFeatured(city: string): Promise<Featured[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("featured_placements")
    .select("id,name,pitch,cta,sponsor_label,restaurant_id,restaurants(slug,city)")
    .eq("active", true)
    .limit(6);
  if (error) return [];
  return (data ?? [])
    .map((row) => {
      const joined = row.restaurants as { slug?: string; city?: string } | { slug?: string; city?: string }[] | null;
      const restaurant = Array.isArray(joined) ? joined[0] : joined;
      return {
        id: String(row.id),
        name: String(row.name),
        pitch: String(row.pitch),
        cta: String(row.cta),
        sponsor_label: String(row.sponsor_label),
        restaurant_slug: restaurant?.slug ?? null,
        restaurant_city: restaurant?.city ?? null,
      };
    })
    .filter((item) => !item.restaurant_city || item.restaurant_city === city);
}

export async function listCommunity(): Promise<CommunityPost[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("instagram_posts")
    .select("id,media_url,permalink,caption,alt_text,position")
    .eq("active", true)
    .order("position", { ascending: true })
    .limit(8);
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: String(row.id),
    media_url: String(row.media_url),
    permalink: String(row.permalink),
    caption: row.caption ? String(row.caption) : null,
    alt_text: row.alt_text ? String(row.alt_text) : null,
  }));
}

export async function getAboutPage(): Promise<AboutPage | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "about_page").maybeSingle();
  if (error || !data?.value || typeof data.value !== "object") return null;
  return data.value as AboutPage;
}

export async function listSitemapPlaces(): Promise<{ city: string; slug: string; kind: "restaurants" | "masjids" }[]> {
  const supabase = await getSupabase();
  const [restaurants, masjids] = await Promise.all([
    supabase.from("restaurants").select("city,slug").eq("active", true),
    supabase.from("prayer_halls").select("city,slug").eq("active", true),
  ]);
  if (restaurants.error) throw new Error(restaurants.error.message);
  if (masjids.error) throw new Error(masjids.error.message);
  return [
    ...(restaurants.data ?? []).map((row) => ({
      city: String(row.city),
      slug: String(row.slug),
      kind: "restaurants" as const,
    })),
    ...(masjids.data ?? []).map((row) => ({
      city: String(row.city),
      slug: String(row.slug),
      kind: "masjids" as const,
    })),
  ];
}
