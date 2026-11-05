import { getSupabase } from "./supabase";
import { reelCommunity, reelMasjids, reelRestaurants } from "./reel-directory";
import type { AboutPage, CommunityPost, Featured, PrayerHall, Restaurant } from "./types";

export type PlaceFilters = {
  q?: string;
  area?: string;
  cuisine?: string;
  lat?: number;
  lng?: number;
};

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

function filterPlaces<T extends { name: string; neighborhood: string; city: string; lat: number; lng: number }>(rows: T[], city: string | undefined, filters: PlaceFilters): T[] {
  const term = safeTerm(filters.q)?.toLowerCase();
  return sortByDistance(rows.filter((row) => {
    if (city && row.city !== city) return false;
    if (filters.area && row.neighborhood !== filters.area) return false;
    const cuisine = "cuisine" in row ? String(row.cuisine) : "";
    if (filters.cuisine && cuisine !== filters.cuisine) return false;
    return !term || `${row.name} ${row.neighborhood} ${cuisine}`.toLowerCase().includes(term);
  }), filters.lat, filters.lng);
}

async function queryRestaurants(city: string | undefined, filters: PlaceFilters): Promise<Restaurant[]> {
  return filterPlaces(reelRestaurants(), city, filters);
}

async function queryMasjids(city: string | undefined, filters: PlaceFilters): Promise<PrayerHall[]> {
  return filterPlaces(reelMasjids(), city, filters);
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
  return reelRestaurants().find((place) => place.city === city && place.slug === slug) ?? null;
}

export async function getMasjid(city: string, slug: string): Promise<PrayerHall | null> {
  return reelMasjids().find((place) => place.city === city && place.slug === slug) ?? null;
}

export async function listFeatured(city: string): Promise<Featured[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("featured_placements")
    .select("id,name,pitch,cta,sponsor_label,restaurant_id,restaurants(slug,city)")
    .eq("active", true)
    .limit(6)
    .abortSignal(AbortSignal.timeout(1500));
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
  return reelCommunity();
}

export async function getAboutPage(): Promise<AboutPage | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "about_page").maybeSingle();
  if (error || !data?.value || typeof data.value !== "object") return null;
  return data.value as AboutPage;
}

export async function listSitemapPlaces(): Promise<{ city: string; slug: string; kind: "restaurants" | "masjids" }[]> {
  return [
    ...reelRestaurants().map((place) => ({ city: place.city, slug: place.slug, kind: "restaurants" as const })),
    ...reelMasjids().map((place) => ({ city: place.city, slug: place.slug, kind: "masjids" as const })),
  ];
}

export async function countPlaces(city: string): Promise<{ restaurants: number; masjids: number }> {
  return { restaurants: reelRestaurants().filter(place => place.city === city).length,
    masjids: reelMasjids().filter(place => place.city === city).length };
}
