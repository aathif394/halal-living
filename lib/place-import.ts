/** The local gosom importer and the Worker share this validation boundary. */
export const STATIC_PLACE_PHOTO = /^\/places\/photos\/[a-f0-9]{64}\.(?:jpg|png|webp)$/;

export type ScrapedReview = {
  who?: string;
  when?: string;
  rating?: number;
  body?: string;
  authorUrl?: string;
  url?: string;
};

export type ScrapedPlace = {
  google_place_id: string;
  google_maps_url: string;
  google_rating: number | null;
  google_review_count: number | null;
  google_reviews: ScrapedReview[];
  google_photos: { name: string; attributions: string[] }[];
  google_hours: string[];
  google_phone: string | null;
  google_open_now: null;
  google_synced_at: string;
  lat: number;
  lng: number;
};

export type PlaceSnapshot = { version: 1; updatedAt: string | null; places: Record<string, ScrapedPlace> };
export type PlaceTarget = { id: string; table: string; slug: string; city: string; name: string; address?: string; lat: number; lng: number; google_place_id?: string | null; google_maps_url?: string | null };
export type GosomEntry = Record<string, unknown>;

export function snapshotKey(target: Pick<PlaceTarget, "table" | "city" | "slug">): string {
  return `${target.table}/${target.city}/${target.slug}`;
}

export function googleImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (!/^lh\d*\.googleusercontent\.com$/.test(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

function string(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function number(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function record(value: unknown): GosomEntry { return value && typeof value === "object" && !Array.isArray(value) ? value as GosomEntry : {}; }
function array(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }

export function distanceKm(a: number, b: number, c: number, d: number): number {
  const rad = Math.PI / 180;
  const h = Math.sin((c - a) * rad / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin((d - b) * rad / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

const GENERIC = new Set(["the", "and", "hotel", "restaurant", "biryani", "house", "masjid", "mosque", "jumma", "juma", "jamia", "chennai", "mumbai", "bangalore", "bengaluru", "hyderabad", "india"]);
function nameTokens(value: string): string[] {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\b(\d)\s+([a-z])\b/g, "$1$2")
    .replace(/\bice\s*creams?\b/g, "icecream")
    .replace(/\bmilk\s+bar\b/g, "milkbar")
    .replace(/\bkabab\b/g, "kebab")
    .replace(/([aeiou])\1+/g, "$1")
    .replace(/[^a-z0-9]+/g, " ").split(" ").filter(x => (x.length > 2 || (x.length === 2 && /\d/.test(x))) && !GENERIC.has(x));
}

/** A query ID identifies intent, not proof that Google returned the right branch. */
export function matchesTarget(target: PlaceTarget, entry: GosomEntry): boolean {
  const lat = number(entry.latitude), lng = number(entry.longitude ?? entry.longtitude);
  const targetLat = number(target.lat), targetLng = number(target.lng);
  if (lat == null || lng == null || targetLat == null || targetLng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return false;
  if (target.google_place_id && string(entry.place_id) === target.google_place_id) return true;
  if (distanceKm(targetLat, targetLng, lat, lng) > 1.2) return false;
  const abbreviation = target.name.match(/\(([A-Z0-9]{2,8})\)/)?.[1];
  if (abbreviation && string(entry.title).toUpperCase() === abbreviation) return true;
  const ours = nameTokens(target.name), theirs = new Set(nameTokens(string(entry.title)));
  if (!ours.length) return false;
  const matches = ours.filter(word => theirs.has(word)).length;
  return matches >= Math.min(2, ours.length) && matches / ours.length >= 0.5;
}

export function photoCandidates(entry: GosomEntry): string[] {
  const reviewImages = [...array(entry.user_reviews), ...array(entry.user_reviews_extended)].flatMap(value => {
    const review = record(value);
    return array(review.Images ?? review.images);
  });
  const values = [entry.thumbnail, ...array(entry.images).map(item => typeof item === "string" ? item : record(item).image), ...reviewImages];
  return [...new Set(values.map(googleImageUrl).filter((x): x is string => Boolean(x)))].slice(0, 8);
}

export function photoAuthors(entry: GosomEntry, url: string): string[] {
  return [...new Set([...array(entry.user_reviews), ...array(entry.user_reviews_extended)].flatMap(value => {
    const review = record(value);
    return array(review.Images ?? review.images).includes(url) && string(review.Name ?? review.name) ? [string(review.Name ?? review.name)] : [];
  }))];
}

function googleLink(value: unknown): string | undefined {
  try {
    const url = new URL(string(value));
    if (url.protocol === "https:" && !url.username && !url.password && !url.port && /^(?:www\.|maps\.|search\.)?google\.com$/.test(url.hostname)) return url.href;
  } catch { /* Absent or invalid source URL. */ }
  return undefined;
}

export function normalizeEntry(entry: GosomEntry, timestamp: string): ScrapedPlace {
  const placeId = string(entry.place_id);
  if (!placeId) throw new Error("Scraper result has no Google place ID.");
  const seen = new Set<string>();
  const reviews = [...array(entry.user_reviews), ...array(entry.user_reviews_extended)].flatMap(value => {
    const review = record(value);
    const who = string(review.Name ?? review.name);
    const body = string(review.Description ?? review.description ?? review.TextOriginal ?? review.text_original);
    const rating = number(review.Rating ?? review.rating ?? review.rating_float);
    if (!body || rating == null || rating < 1 || rating > 5) return [];
    const key = string(review.review_id) || `${who}\n${body}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ who: who.slice(0, 150), body: body.slice(0, 10000), when: string(review.When ?? review.when).slice(0, 100), rating, authorUrl: googleLink(review.author_url), url: googleLink(review.review_link) }];
  }).slice(0, 20);
  const hours = record(entry.open_hours);
  const week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const rating = number(entry.review_rating), count = number(entry.review_count);
  return {
    google_place_id: placeId,
    google_maps_url: googleLink(entry.link) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(string(entry.title))}&query_place_id=${encodeURIComponent(placeId)}`,
    google_rating: rating != null && rating >= 1 && rating <= 5 ? rating : null,
    google_review_count: count != null && count >= 0 ? Math.floor(count) : null,
    google_reviews: reviews,
    google_photos: [],
    // Keep weekday positions, even when a day is missing.
    google_hours: week.some(day => day in hours) ? week.map(day => array(hours[day]).map(string).filter(Boolean).join(", ")) : [],
    google_phone: string(entry.phone) || null,
    // An import is a snapshot, never a live open/closed signal.
    google_open_now: null,
    google_synced_at: timestamp,
    lat: number(entry.latitude) ?? 0,
    lng: number(entry.longitude ?? entry.longtitude) ?? 0,
  };
}
