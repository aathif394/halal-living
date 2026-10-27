import type { CommunityPost, PrayerHall, Restaurant, Review } from "./types";

const REVIEW_COLORS = ["#0B5F88", "#B94421", "#1F6B12", "#5A2FAC"];

export type ShellClause = { title: string; text: string; ok: boolean };

export type ShellRestaurant = {
  type: "r";
  slug: string;
  name: string;
  cuisine: string;
  kind: string;
  area: string;
  dv: number;
  dist: string;
  open: string;
  isOpen: boolean;
  openColor: string;
  photo: string;
  trust: string;
  tBg: string;
  cert: boolean;
  trustTitle: string;
  trustLine: string;
  offer: string;
  hasOffer: false;
  offerBg: string;
  family: boolean;
  cta: string;
  pos: [number, number] | null;
  price: string;
  rating: string;
  reviews: string;
  reviewItems: [string, string, string, string, string, string][];
  clauses: ShellClause[];
  address: string;
  today: string;
  phone: string;
  mapsUrl: string;
  photos: { bg: string; cap: string }[];
  weekHours: string[];
  credit: string;
  showCredit: boolean;
};

export type ShellMasjid = {
  type: "m";
  slug: string;
  name: string;
  kind: string;
  area: string;
  dv: number;
  dist: string;
  women: boolean;
  park: boolean;
  verified: true;
  wudu: boolean;
  photo: string;
  facil: string;
  pos: [number, number] | null;
  address: string;
  jummah: string;
  prayers: [string, number][];
  phone: string;
  mapsUrl: string;
  photos: { bg: string; cap: string }[];
  credit: string;
  showCredit: boolean;
};

export type ShellReel = {
  handle: string;
  place: string;
  title: string;
  bg: string;
  permalink: string;
};

export type ShellPack = {
  areas: string[];
  restaurants: ShellRestaurant[];
  masjids: ShellMasjid[];
};

function cssPhoto(url: string | null): string {
  if (!url) return "";
  return `url("${url.replace(/["\\]/g, "")}") center/cover no-repeat`;
}

function photoCss(name: string): string {
  return `url("/api/photo?name=${encodeURIComponent(name)}") center/cover no-repeat`;
}

function mapsLink(explicit: string | null, lat: number, lng: number): string {
  if (explicit && /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)/i.test(explicit)) return explicit;
  const pos = position(lat, lng);
  if (!pos) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}`;
}

function dial(value: string | null): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 ? value.trim() : "";
}

function istWeekday(): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(new Date());
  const index = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(name);
  return index >= 0 ? index : 0;
}

function formatRating(value: number, count: number): string {
  if (count <= 0 || !Number.isFinite(value) || value <= 0) return "–";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function googlePhotos(place: { google_photos: { name: string; attributions: string[] }[] }) {
  return place.google_photos.slice(0, 8).map((photo) => ({
    bg: photoCss(photo.name),
    cap: photo.attributions[0] ? `Photo · ${photo.attributions[0]}` : "Photo from Google",
  }));
}

function position(lat: number, lng: number): [number, number] | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  return [lat, lng];
}

function hoursLine(isOpen: boolean, closesAt: string | null, openHours: string): string {
  if (isOpen) return closesAt ? `Open now · closes ${closesAt}` : "Open now";
  return openHours || "Hours not listed";
}

function trustFor(certification: string, signedOn: string | null) {
  const value = certification.toLowerCase();
  const certified = value.includes("hmc");
  const vegetarian = value.includes("vegetarian");
  const trust = certified ? "✓ Certified" : vegetarian ? "Vegetarian" : "Owner attested";
  const trustTitle = certified ? "Why it’s Certified" : vegetarian ? "Vegetarian kitchen" : "Why it’s Owner attested";
  const when = signedOn ? ` Signed ${signedOn}.` : "";
  const trustLine = certification ? `${certification}.${when}`.trim() : "Halal status has not been recorded yet.";
  return {
    trust,
    tBg: certified || vegetarian ? "#1F6B12" : "#9A6A44",
    cert: certified,
    trustTitle,
    trustLine,
  };
}

function stars(rating: number | undefined): string {
  if (rating == null || !Number.isFinite(rating) || rating <= 0) return "";
  return "★".repeat(Math.max(1, Math.min(5, Math.round(rating))));
}

function reviewTuple(review: Review, index: number): [string, string, string, string, string, string] {
  const name = review.who?.trim() || "Guest";
  return [name, name.slice(0, 1).toUpperCase(), REVIEW_COLORS[index % REVIEW_COLORS.length], stars(review.rating), review.when?.trim() || "", review.body?.trim() || ""];
}

export function prayerMinutes(value: string): number | null {
  const match = value.trim().toLowerCase().replace(/\./g, "").match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (match[3] === "pm" && hours < 12) hours += 12;
  if (match[3] === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function hasFacility(facilities: string[], pattern: RegExp): boolean {
  return facilities.some((item) => pattern.test(item));
}

export function topAreas(names: string[], fallback: string[]): string[] {
  const counts = new Map<string, number>();
  for (const name of names) {
    const cleaned = name.trim();
    if (!cleaned) continue;
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
  return (ranked.length ? ranked : fallback).slice(0, 8);
}

export function toShellRestaurant(place: Restaurant, index: number): ShellRestaurant {
  const trust = trustFor(place.certification, place.signed_on);
  const linked = Boolean(place.google_place_id);
  const photos = googlePhotos(place);
  const weekHours = place.google_hours;
  const openNow = linked && place.google_open_now != null ? place.google_open_now : place.is_open;
  const todayFromGoogle = weekHours[istWeekday()] || "";
  const today = todayFromGoogle || hoursLine(openNow, place.closes_at, place.open_hours);
  const ratingValue = linked && place.google_rating != null ? place.google_rating : place.rating;
  const reviewCount = linked && place.google_review_count != null ? place.google_review_count : place.review_count;
  const reviews = linked ? place.google_reviews : [];
  return {
    type: "r",
    slug: place.slug,
    name: place.name,
    cuisine: place.cuisine || place.tagline || "Restaurant",
    kind: place.cuisine || "Restaurant",
    area: place.neighborhood,
    dv: index,
    dist: "",
    open: today,
    isOpen: openNow,
    openColor: openNow ? "#1F6B12" : "#8A8F8B",
    photo: photos[0]?.bg || cssPhoto(place.hero_image),
    ...trust,
    offer: "",
    hasOffer: false,
    offerBg: "",
    family: place.tags.some((tag) => /family/i.test(tag)),
    cta: "Call",
    pos: position(place.lat, place.lng),
    price: place.price_range || "–",
    rating: formatRating(ratingValue, reviewCount),
    reviews: reviewCount > 0 ? reviewCount.toLocaleString("en-IN") : "0",
    reviewItems: reviews.filter((review) => review.body || review.who).map(reviewTuple),
    clauses: [
      {
        title: "Halal status",
        text: place.certification || "Not recorded yet.",
        ok: /hmc|vegetarian/i.test(place.certification),
      },
    ],
    address: place.address,
    today,
    phone: dial(place.google_phone || place.phone),
    mapsUrl: mapsLink(place.google_maps_url, place.lat, place.lng),
    photos,
    weekHours,
    credit: photos[0]?.cap || "",
    showCredit: Boolean(photos[0]),
  };
}

export function toShellMasjid(place: PrayerHall, index: number): ShellMasjid {
  const prayers: [string, number][] = [];
  for (const [name, value] of [
    ["Fajr", place.fajr],
    ["Dhuhr", place.dhuhr],
    ["Asr", place.asr],
    ["Maghrib", place.maghrib],
    ["Isha", place.isha],
  ] as const) {
    const minutes = value ? prayerMinutes(value) : null;
    if (minutes != null) prayers.push([name, minutes]);
  }
  const prayerHall = /prayer hall/i.test(`${place.name} ${place.nick ?? ""}`);
  const photos = googlePhotos(place);
  return {
    type: "m",
    slug: place.slug,
    name: place.name,
    kind: prayerHall ? "Prayer hall" : "Masjid",
    area: place.neighborhood,
    dv: index,
    dist: "",
    women: hasFacility(place.facilities, /women/i),
    park: hasFacility(place.facilities, /park/i) && !hasFacility(place.facilities, /no parking/i),
    verified: true,
    wudu: hasFacility(place.facilities, /wudu|wudhu|ablution/i),
    photo: photos[0]?.bg || "",
    facil: place.facilities.join(" · "),
    pos: position(place.lat, place.lng),
    address: place.address,
    jummah: place.jummah_time ? `Jumu'ah at ${place.jummah_time}` : "",
    prayers,
    phone: dial(place.google_phone),
    mapsUrl: mapsLink(place.google_maps_url, place.lat, place.lng),
    photos,
    credit: photos[0]?.cap || "",
    showCredit: Boolean(photos[0]),
  };
}

export function toShellReel(post: CommunityPost): ShellReel {
  const caption = (post.caption ?? "").replace(/\s+/g, " ").trim();
  const title = caption.split(/[.!#]/)[0]?.trim().slice(0, 90) || "From the community";
  const at = caption.match(/\bat\s+([^.#]+)/i);
  const permalink = post.permalink.startsWith("https://www.instagram.com/") && post.permalink.length > "https://www.instagram.com/".length
    ? post.permalink
    : "";
  return {
    handle: "@halalliving",
    place: at?.[1]?.trim().slice(0, 40) || "Halal Living",
    title,
    bg: cssPhoto(post.media_url),
    permalink,
  };
}

export function shellPack(restaurants: Restaurant[], masjids: PrayerHall[], fallbackAreas: string[]): ShellPack {
  return {
    areas: topAreas(
      restaurants.map((place) => place.neighborhood).concat(masjids.map((place) => place.neighborhood)),
      fallbackAreas,
    ),
    restaurants: restaurants.map(toShellRestaurant),
    masjids: masjids.map(toShellMasjid),
  };
}
