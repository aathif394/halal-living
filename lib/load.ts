import { notFound } from "next/navigation";
import { getCity, type CityTheme } from "./cities";
import { listCommunity, listMasjids, listRestaurants } from "./data";
import type { PrayerHall, Restaurant } from "./types";
import { toReelSlide, topAreas, type ReelSlide } from "./view";

export function cityOr404(slug: string): CityTheme {
  const city = getCity(slug);
  if (!city) notFound();
  return city;
}

export async function loadCity(city: CityTheme): Promise<{ restaurants: Restaurant[]; masjids: PrayerHall[]; areas: string[] }> {
  const [restaurants, masjids] = await Promise.all([listRestaurants(city.slug).catch(() => []), listMasjids(city.slug).catch(() => [])]);
  const areas = topAreas(
    restaurants.map((place) => place.neighborhood).concat(masjids.map((place) => place.neighborhood)),
    city.areas,
  );
  return { restaurants, masjids, areas };
}

export async function loadReels(): Promise<ReelSlide[]> {
  const posts = await listCommunity().catch(() => []);
  return posts.map(toReelSlide);
}

export function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim().slice(0, 80);
}
