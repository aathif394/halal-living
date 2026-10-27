import { getServiceSupabase, readEnv } from "./supabase";

export const PHOTO_NAME = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export type GooglePhoto = { name: string; attributions: string[] };
export type GoogleReview = { who?: string; when?: string; rating?: number; body?: string };

export type PlaceLink = {
  google_place_id: string;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_reviews: GoogleReview[];
  google_photos: GooglePhoto[];
  google_hours: string[];
  google_phone: string | null;
  google_open_now: boolean | null;
};

type PlaceResult = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  currentOpeningHours?: { openNow?: boolean };
  photos?: { name?: string; authorAttributions?: { displayName?: string }[] }[];
  reviews?: {
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: { text?: string };
    authorAttribution?: { displayName?: string };
  }[];
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.photos",
  "places.reviews",
  "places.regularOpeningHours",
  "places.googleMapsUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.currentOpeningHours",
].join(",");

const STOP = new Set(["hotel", "restaurant", "biryani", "chennai", "mumbai", "bangalore", "bengaluru", "hyderabad", "masjid", "mosque"]);

export function asGooglePhotos(value: unknown): GooglePhoto[] {
  if (!Array.isArray(value)) return [];
  const photos: GooglePhoto[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const name = String((item as { name?: unknown }).name ?? "");
    if (!PHOTO_NAME.test(name)) continue;
    const raw = (item as { attributions?: unknown }).attributions;
    const attributions = Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === "string").slice(0, 3) : [];
    photos.push({ name, attributions });
  }
  return photos.slice(0, 8);
}

export function asGoogleReviews(value: unknown): GoogleReview[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const row = item as GoogleReview;
      return {
        who: row.who ? String(row.who) : undefined,
        when: row.when ? String(row.when) : undefined,
        rating: typeof row.rating === "number" ? row.rating : undefined,
        body: row.body ? String(row.body) : undefined,
      };
    })
    .filter((review) => review.body || review.who)
    .slice(0, 5);
}

export function asHourLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, 7)
    .map((line) => line.replace(/^[A-Za-z]+day:\s*/i, "").trim());
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 3 && !STOP.has(token));
}

function sharesName(ours: string, theirs: string): boolean {
  const other = theirs.toLowerCase();
  return tokens(ours).some((token) => other.includes(token));
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

export function choosePlace(name: string, lat: number, lng: number, places: PlaceResult[]): PlaceResult | null {
  let best: { place: PlaceResult; distance: number } | null = null;
  for (const place of places) {
    const latitude = place.location?.latitude;
    const longitude = place.location?.longitude;
    if (latitude == null || longitude == null || !place.id) continue;
    const distance = haversineKm(lat, lng, latitude, longitude);
    const label = place.displayName?.text ?? "";
    if (distance > 0.6 || !sharesName(name, label)) continue;
    if (!best || distance < best.distance) best = { place, distance };
  }
  return best?.place ?? null;
}

function linkFrom(place: PlaceResult): PlaceLink {
  const photos = (place.photos ?? [])
    .map((photo) => ({
      name: photo.name ?? "",
      attributions: (photo.authorAttributions ?? []).map((author) => author.displayName ?? "").filter(Boolean).slice(0, 3),
    }))
    .filter((photo) => PHOTO_NAME.test(photo.name))
    .slice(0, 8);
  const reviews = (place.reviews ?? [])
    .map((review) => ({
      who: review.authorAttribution?.displayName?.trim() || undefined,
      when: review.relativePublishTimeDescription?.trim() || undefined,
      rating: typeof review.rating === "number" ? review.rating : undefined,
      body: review.text?.text?.trim() || undefined,
    }))
    .filter((review) => review.body)
    .slice(0, 5);
  const hours = (place.regularOpeningHours?.weekdayDescriptions ?? [])
    .filter((line) => typeof line === "string")
    .slice(0, 7)
    .map((line) => line.replace(/^[A-Za-z]+day:\s*/i, "").trim());
  return {
    google_place_id: place.id ?? "",
    google_maps_url: place.googleMapsUri ?? null,
    google_rating: typeof place.rating === "number" ? place.rating : null,
    google_review_count: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    google_reviews: reviews,
    google_photos: photos,
    google_hours: hours,
    google_phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
    google_open_now: typeof place.currentOpeningHours?.openNow === "boolean" ? place.currentOpeningHours.openNow : null,
  };
}

async function searchPlace(key: string, query: string, lat: number, lng: number): Promise<PlaceResult[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query.slice(0, 200),
      maxResultCount: 5,
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 800 } },
    }),
  });
  if (!response.ok) throw new Error(`Places search failed (${response.status})`);
  const payload = (await response.json()) as { places?: PlaceResult[] };
  return payload.places ?? [];
}

type SyncRow = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
};

async function syncTable(table: "restaurants" | "prayer_halls", key: string, city: string | undefined, limit: number, force: boolean) {
  const supabase = await getServiceSupabase();
  if (!supabase) return { linked: 0, skipped: 0, failed: 0, reason: "missing-service-role" as const };
  let query = supabase.from(table).select("id,name,address,city,lat,lng,google_synced_at").eq("active", true);
  if (city) query = query.eq("city", city);
  if (!force) query = query.is("google_synced_at", null);
  const { data, error } = await query.order("name", { ascending: true }).limit(limit);
  if (error) throw new Error(error.message);
  let linked = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of (data ?? []) as SyncRow[]) {
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      skipped += 1;
      continue;
    }
    try {
      const queryText = [row.name, row.address, row.city].filter(Boolean).join(", ");
      const places = await searchPlace(key, queryText, lat, lng);
      const chosen = choosePlace(row.name, lat, lng, places);
      if (!chosen) {
        skipped += 1;
        const { error: stampError } = await supabase.from(table).update({ google_synced_at: new Date().toISOString() }).eq("id", row.id);
        if (stampError) failed += 1;
        continue;
      }
      const link = linkFrom(chosen);
      const { error: updateError } = await supabase.from(table).update({ ...link, google_synced_at: new Date().toISOString() }).eq("id", row.id);
      if (updateError) failed += 1;
      else linked += 1;
    } catch {
      failed += 1;
    }
  }
  return { linked, skipped, failed };
}

export async function syncGooglePlaces(options: { city?: string; limit: number; force?: boolean }) {
  const key = await readEnv("GOOGLE_PLACES_API_KEY");
  if (!key) return { ok: false as const, reason: "missing-places-key" };
  const supabase = await getServiceSupabase();
  if (!supabase) return { ok: false as const, reason: "missing-service-role" };
  const city = options.city;
  const limit = options.limit;
  const force = options.force === true;
  const restaurants = await syncTable("restaurants", key, city, limit, force);
  const masjids = await syncTable("prayer_halls", key, city, limit, force);
  return { ok: true as const, restaurants, masjids };
}
