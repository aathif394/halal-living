import type { CommunityPost, GooglePhoto, PrayerHall, Restaurant, Review } from "./types";

// Shapes the database rows into what the page components render.

export type TrustKey = "verified" | "owner" | "reported";

export type Trust = {
  key: TrustKey;
  short: string;
  label: string;
  title: string;
  line: string;
  color: string;
  tint: string;
};

export type Photo = { src: string; credit: string };

export type ReviewView = { name: string; initial: string; color: string; rating: number; when: string; text: string };

export type HoursRow = { day: string; time: string; today: boolean };

export type RestaurantView = {
  slug: string;
  name: string;
  cuisine: string;
  area: string;
  address: string;
  price: string;
  photo: string;
  photos: Photo[];
  art: string;
  trust: Trust;
  rating: string;
  ratingValue: number;
  reviewCount: string;
  reviews: ReviewView[];
  isOpen: boolean;
  today: string;
  /** Empty when the week's hours are not known. */
  hours: HoursRow[];
  /** Mockup hours card: "Till 11:30 pm" / "Opens 12 pm", and consecutive days with the same hours grouped. */
  openHead: string;
  openSub: string;
  hourGroups: { days: string; time: string; today: boolean }[];
  phone: string;
  mapsUrl: string;
  reviewsUrl: string;
  lat: number | null;
  lng: number | null;
};

export type Amenity = { key: "parking" | "women" | "jummah"; label: string; ok: boolean; detail: string };

export type MasjidView = {
  slug: string;
  name: string;
  kind: string;
  area: string;
  address: string;
  photo: string;
  photos: Photo[];
  art: string;
  amenities: Amenity[];
  women: boolean;
  parking: boolean;
  jummah: string;
  prayers: { name: string; time: string }[];
  madhab: string;
  phone: string;
  mapsUrl: string;
  lat: number | null;
  lng: number | null;
};

export type ReelSlide = {
  id: string;
  kind: "image" | "video";
  src: string;
  poster: string;
  title: string;
  by: string;
  place: string;
  link: string;
  /** Illustration fallback: shown whole rather than cropped to fill. */
  art?: boolean;
};

const REVIEW_COLORS = ["#0B5F88", "#B94421", "#1F6B12", "#5A2FAC"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function seedOf(value: string): number {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function foodArt(seed: string): string {
  return `/art/food-${seedOf(seed) % 6}.svg`;
}

export function masjidArt(seed: string): string {
  return `/art/masjid-${seedOf(seed) % 4}.svg`;
}

function googlePhotos(photos: GooglePhoto[]): Photo[] {
  return photos.slice(0, 8).map((photo) => ({
    src: `/api/photo?name=${encodeURIComponent(photo.name)}`,
    credit: photo.attributions[0] ? `Photo · ${photo.attributions[0]}` : "Photo from Google",
  }));
}

function position(lat: number, lng: number): [number, number] | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  return [lat, lng];
}

function mapsLink(explicit: string | null, name: string, lat: number, lng: number): string {
  if (explicit && /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl)/i.test(explicit)) return explicit;
  const pos = position(lat, lng);
  if (pos) return `https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

function dial(value: string | null): string {
  if (!value) return "";
  return value.replace(/\D/g, "").length >= 8 ? value.trim() : "";
}

export function istWeekday(): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(new Date());
  const index = DAYS.indexOf(name);
  return index >= 0 ? index : 0;
}

// Every listed place has been checked by someone from Halal Living before it went live,
// so it carries the green "Halal Living Verified" seal. The certification detail goes in `line`.
export function trustFor(certification: string, signedOn: string | null): Trust {
  const value = certification.toLowerCase();
  const when = signedOn ? ` Signed ${signedOn}.` : "";
  const line = certification ? `${certification}.${when}`.replace("..", ".") : "Checked by someone from the Halal Living community.";
  const title = value.includes("vegetarian") ? "Vegetarian kitchen" : value.includes("hmc") ? "Why it’s Certified" : "Why it’s Verified";
  return { key: "verified", short: "Verified", label: "Halal verified by Halal Living", title, line, color: "#1F6B12", tint: "#E6F2E2" };
}

function reviewView(review: Review, index: number): ReviewView {
  const name = review.who?.trim() || "Guest";
  return {
    name,
    initial: name.slice(0, 1).toUpperCase(),
    color: REVIEW_COLORS[index % REVIEW_COLORS.length]!,
    rating: Math.max(0, Math.min(5, Math.round(review.rating ?? 0))),
    when: review.when?.trim() || "",
    text: review.body?.trim() || "",
  };
}

function hoursFor(week: string[], todayLine: string): HoursRow[] {
  const today = istWeekday();
  return DAYS.map((day, i) => {
    // Google gives "Monday: 12:00 – 11:30 PM"; keep the time part.
    const raw = week[i] ?? "";
    const time = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1).trim() : raw;
    return { day, time: time || (i === today ? todayLine : "Hours not listed"), today: i === today };
  });
}

function lowerTime(value: string) {
  return value.replace(/:00(?=\s*[AP]M)/i, "").replace(/\s*([AP])M/i, (_, x: string) => ` ${x.toLowerCase()}m`).trim();
}

function clock24(value: string) {
  const [h, m] = value.split(":").map(Number) as [number, number];
  const suffix = h >= 12 && h < 24 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

function hoursCard(rows: HoursRow[], open: boolean, rawToday: string) {
  // Listing hours like "Mo-Su 07:00-22:30" become "7 am – 10:30 pm".
  const range = rawToday.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  const everyDay = /^mo\s*-\s*su/i.test(rawToday.trim());
  const todayText = range ? `${clock24(range[1]!)} – ${clock24(range[2]!)}` : rawToday;
  const closes = todayText.match(/closes\s+(.+)$/i);
  const parts = closes ? ["", closes[1]!] : todayText.split(/\s*[–-]\s*/);
  const start = parts.length === 2 && /\d/.test(parts[0]!) ? lowerTime(parts[0]!) : "";
  const end = parts.length === 2 && /\d/.test(parts[1]!) ? lowerTime(parts[1]!) : "";
  const closed = /closed/i.test(todayText);
  const openHead = open ? (end ? `Till ${lowerTime(end)}` : "Open now") : closed ? "Closed today" : start ? `Opens ${start}` : "Closed now";
  const openSub = open ? "" : closed ? "" : start ? "Closed right now" : todayText === "Hours not listed" ? "" : todayText;
  const groups: { days: string; time: string; today: boolean }[] = [];
  let i = 0;
  while (i < rows.length) {
    let j = i;
    while (j + 1 < rows.length && rows[j + 1]!.time === rows[i]!.time && !rows[j + 1]!.today && !rows[i]!.today) j++;
    const time = rows[i]!.time.split(/\s*[–-]\s*/).map(lowerTime).join(" – ");
    groups.push({ days: i === j ? rows[i]!.day : `${rows[i]!.day} – ${rows[j]!.day}`, time, today: rows[i]!.today });
    i = j + 1;
  }
  // Without the week from Google, show today's line on its own.
  if (!groups.length && todayText && todayText !== "Hours not listed") {
    groups.push({ days: everyDay ? "Every day" : "Today", time: closes ? `Closes ${lowerTime(closes[1]!)}` : todayText.replace(/^Open now\s*·?\s*/i, "") || "Open", today: true });
  }
  return { openHead, openSub, hourGroups: groups };
}

export function toRestaurantView(place: Restaurant): RestaurantView {
  const linked = Boolean(place.google_place_id);
  const photos = googlePhotos(place.google_photos);
  if (!photos.length && place.hero_image) photos.push({ src: place.hero_image, credit: "" });
  for (const url of place.gallery) if (photos.length < 8 && /^https:\/\//.test(url)) photos.push({ src: url, credit: "" });
  const openNow = linked && place.google_open_now != null ? place.google_open_now : place.is_open;
  const week = place.google_hours;
  const fallbackToday = openNow ? (place.closes_at ? `Open now · closes ${place.closes_at}` : "Open now") : place.open_hours || "Hours not listed";
  const hours = hoursFor(week, fallbackToday);
  const ratingValue = linked && place.google_rating != null ? place.google_rating : place.rating;
  const count = linked && place.google_review_count != null ? place.google_review_count : place.review_count;
  const reviews = (linked ? place.google_reviews : place.reviews).filter((review) => review.body || review.who).map(reviewView);
  const art = foodArt(place.slug);
  const pos = position(place.lat, place.lng);
  return {
    slug: place.slug,
    name: place.name,
    cuisine: place.cuisine || place.tagline || "Restaurant",
    area: place.neighborhood,
    address: place.address,
    price: place.price_range || "₹₹",
    photo: photos[0]?.src || art,
    photos,
    art,
    trust: trustFor(place.certification, place.signed_on),
    rating: count > 0 && ratingValue > 0 ? (Number.isInteger(ratingValue) ? String(ratingValue) : ratingValue.toFixed(1)) : "–",
    ratingValue: count > 0 ? ratingValue : 0,
    reviewCount: count > 0 ? count.toLocaleString("en-IN") : "0",
    reviews,
    isOpen: openNow,
    today: hours.find((row) => row.today)?.time || fallbackToday,
    hours: week.length ? hours : [],
    ...hoursCard(week.length ? hours : [], openNow, hours.find((row) => row.today)?.time || fallbackToday),
    phone: dial(place.google_phone || place.phone),
    mapsUrl: mapsLink(place.google_maps_url, `${place.name}, ${place.address}`, place.lat, place.lng),
    reviewsUrl: place.google_place_id
      ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(place.google_place_id)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.neighborhood}`)}`,
    lat: pos?.[0] ?? null,
    lng: pos?.[1] ?? null,
  };
}

function hasFacility(facilities: string[], pattern: RegExp): boolean {
  return facilities.some((item) => pattern.test(item));
}

export function toMasjidView(place: PrayerHall): MasjidView {
  const photos = googlePhotos(place.google_photos);
  const women = hasFacility(place.facilities, /women|ladies|sisters/i);
  const parking = hasFacility(place.facilities, /park/i) && !hasFacility(place.facilities, /no parking/i);
  const jummah = place.jummah_time.trim();
  const art = masjidArt(place.slug);
  const pos = position(place.lat, place.lng);
  const prayers = (
    [
      ["Fajr", place.fajr],
      ["Dhuhr", place.dhuhr],
      ["Asr", place.asr],
      ["Maghrib", place.maghrib],
      ["Isha", place.isha],
    ] as const
  )
    .filter(([, time]) => time.trim())
    .map(([name, time]) => ({ name, time: time.trim() }));
  return {
    slug: place.slug,
    name: place.name,
    kind: /prayer hall/i.test(`${place.name} ${place.nick ?? ""}`) ? "Prayer hall" : "Masjid",
    area: place.neighborhood,
    address: place.address,
    photo: photos[0]?.src || art,
    photos,
    art,
    amenities: [
      { key: "parking", label: "Parking", ok: parking, detail: parking ? "Room for cars and two-wheelers" : "Street parking only" },
      { key: "women", label: "Women's prayer area", ok: women, detail: women ? "Separate space for women" : "Not available here" },
      { key: "jummah", label: "Jumu’ah held", ok: Boolean(jummah), detail: jummah ? `Khutbah at ${jummah}` : "Daily prayers only" },
    ],
    women,
    parking,
    jummah,
    prayers,
    madhab: place.madhab,
    phone: dial(place.google_phone),
    mapsUrl: mapsLink(place.google_maps_url, `${place.name}, ${place.address}`, place.lat, place.lng),
    lat: pos?.[0] ?? null,
    lng: pos?.[1] ?? null,
  };
}

export function toReelSlide(post: CommunityPost): ReelSlide {
  const caption = (post.caption ?? "").replace(/\s+/g, " ").trim();
  const title = caption.split(/[.!#]/)[0]?.trim().slice(0, 90) || "From the community";
  const at = caption.match(/\bat\s+([^.#]+)/i);
  const video = /video|reel/i.test(post.media_type) || /\.(mp4|mov|webm)(\?|$)/i.test(post.media_url);
  const link = /^https:\/\/(www\.)?instagram\.com\/.+/.test(post.permalink) ? post.permalink : "";
  return {
    id: post.id,
    kind: video ? "video" : "image",
    src: post.media_url,
    poster: post.thumbnail_url || (video ? "" : post.media_url),
    title,
    by: "@halalliving",
    place: at?.[1]?.trim().slice(0, 40) || "Halal Living",
    link,
  };
}

const GENERIC = new Set(["hotel", "restaurant", "biryani", "briyani", "kitchen", "cafe", "masjid", "mosque", "jumma", "jamia", "juma", "house", "corner", "stall", "grill", "halal", "road", "nagar", "salai"]);

// Reels shown on a place page: community posts that name the place, then the place's own photos.
export function placeReel(name: string, area: string, photos: Photo[], art: string, posts: ReelSlide[]): ReelSlide[] {
  const key = name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 3 && !GENERIC.has(word));
  const mentions = key.length
    ? posts.filter((post) => {
        const text = `${post.title} ${post.place}`.toLowerCase();
        return key.every((word) => text.includes(word));
      })
    : [];
  const fromPhotos: ReelSlide[] = photos.map((photo, i) => ({
    id: `photo-${i}`,
    kind: "image",
    src: photo.src,
    poster: photo.src,
    title: i === 0 ? `Inside ${name}` : name,
    by: photo.credit.replace(/^Photo · /, "") || name,
    place: area,
    link: "",
  }));
  const slides = [...mentions, ...fromPhotos];
  if (slides.length) return slides.slice(0, 8);
  return [{ id: "art", kind: "image", src: art, poster: art, title: `Inside ${name}`, by: "@halalliving", place: area, link: "", art: true }];
}

export function topAreas(names: string[], fallback: string[]): string[] {
  const counts = new Map<string, number>();
  for (const name of names) {
    const cleaned = name.trim();
    if (cleaned) counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
  return ranked.length ? ranked : fallback;
}

export type PlaceCard = {
  kind: "restaurants" | "masjids";
  slug: string;
  name: string;
  sub: string;
  area: string;
  photo: string;
  lat: number | null;
  lng: number | null;
  trust: Trust | null;
  women: boolean;
  parking: boolean;
};

export function restaurantCard(place: RestaurantView): PlaceCard {
  return { kind: "restaurants", slug: place.slug, name: place.name, sub: place.cuisine, area: place.area, photo: place.photo, lat: place.lat, lng: place.lng, trust: place.trust, women: false, parking: false };
}

export function masjidCard(place: MasjidView): PlaceCard {
  return { kind: "masjids", slug: place.slug, name: place.name, sub: place.kind, area: place.area, photo: place.photo, lat: place.lat, lng: place.lng, trust: null, women: place.women, parking: place.parking };
}
