import catalog from "../data/reel-directory.json";
import type { CommunityPost, PrayerHall, Restaurant } from "./types";
import { withPlaceSnapshot } from "./place-snapshot";

export type DirectoryReel = (typeof catalog.reels)[number];
export type ReelPlace = (typeof catalog.places)[number];

export const reelPlaces = catalog.places;
export const directoryReels = catalog.reels;

export function reelsForPlace(kind: "restaurants" | "masjids", slug: string): DirectoryReel[] {
  const place = reelPlaces.find((item) => item.kind === kind && item.slug === slug);
  return place ? directoryReels.filter((reel) => place.reelIds.includes(reel.id)) : [];
}

const google = {
  google_place_id: null, google_maps_url: null, google_rating: null, google_review_count: null,
  google_reviews: [], google_photos: [], google_hours: [], google_phone: null,
  google_open_now: null, google_synced_at: null,
};

export function reelRestaurants(): Restaurant[] {
  return reelPlaces.filter((place) => place.kind === "restaurants").map((place) => ({
    ...google,
    id: `reel-${place.slug}`, slug: place.slug, name: place.name,
    source_reel_ids: place.reelIds, reel_posters: reelsForPlace(place.kind as "restaurants" | "masjids", place.slug).map(reel => reel.poster),
    city: place.city, neighborhood: place.area, address: place.address,
    lat: 0, lng: 0, rating: 0, review_count: 0,
    tagline: place.description, description: place.description,
    cuisine: place.cuisine || "Restaurant", price_range: "",
    certification: "Featured by Halal Living. See the original reel for the visit and halal sourcing discussion.",
    open_hours: "Hours not confirmed", phone: null,
    hero_image: reelsForPlace("restaurants", place.slug)[0]?.poster || null,
    gallery: reelsForPlace("restaurants", place.slug).map((reel) => reel.poster),
    tags: place.facilities || [], is_open: false, closes_at: null,
    signatures: [], reviews: [], owner_signature: null, owner_title: null, signed_on: null,
  })).map(row => withPlaceSnapshot(row, "restaurants"));
}

export function reelMasjids(): PrayerHall[] {
  return reelPlaces.filter((place) => place.kind === "masjids").map((place) => ({
    ...google,
    id: `reel-${place.slug}`, slug: place.slug, name: place.name,
    source_reel_ids: place.reelIds, reel_posters: reelsForPlace(place.kind as "restaurants" | "masjids", place.slug).map(reel => reel.poster),
    city: place.city, neighborhood: place.area, address: place.address,
    lat: 0, lng: 0, capacity: 0, madhab: "", nick: null,
    facilities: place.facilities || [], jummah_time: "",
    fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "",
    description: place.description, note: place.note || null,
  })).map(row => withPlaceSnapshot(row, "prayer_halls"));
}

export function reelCommunity(): CommunityPost[] {
  return directoryReels.map((reel) => ({
    id: reel.id, media_type: "REELS", media_url: `/api/reels/${reel.id}`, thumbnail_url: reel.poster, permalink: reel.permalink,
    place_slugs: reel.placeSlugs, place_name: reel.title, city: reel.city,
    caption: reel.title, alt_text: reel.title,
  }));
}

export function reelPlaceDetails(kind: "restaurants" | "masjids", slug: string) {
  const place = reelPlaces.find((item) => item.kind === kind && item.slug === slug);
  if (!place) return null;
  return {
    description: place.description,
    facilities: place.facilities || [],
    sourceNote: place.note || "",
    reels: reelsForPlace(kind, slug),
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}`)}`,
  };
}
