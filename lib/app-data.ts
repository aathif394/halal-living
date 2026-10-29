import { headers } from "next/headers";
import { CITIES, type CitySlug } from "./cities";
import { getMasjid, getRestaurant, listCommunity, listMasjids, listRestaurants, parseCoord } from "./data";
import { shellPack, toShellMasjid, toShellReel, toShellRestaurant, type ShellPack, type ShellReel } from "./shell-data";
import type { PrayerHall, Restaurant } from "./types";

export type Kind = "restaurants" | "masjids";

export type Boot = {
  view: "rest" | "mas" | null;
  q: string;
  area: string;
  cuisine: string;
  pos?: [number, number];
  slug?: string;
  kind?: Kind;
  scroll?: string;
  open?: "ad";
  notFound?: boolean;
};

export type AppData = {
  city: CitySlug;
  mob: boolean;
  boot: Boot;
  byCity: Record<CitySlug, ShellPack>;
  reels: ShellReel[];
};

export type CityRecords = Record<CitySlug, { restaurants: Restaurant[]; masjids: PrayerHall[] }>;

export type SearchRecord = Record<string, string | string[] | undefined>;

function one(params: SearchRecord, key: string) {
  const value = params[key];
  return (typeof value === "string" ? value : "").trim().slice(0, 80);
}

async function isMobileRequest() {
  const h = await headers();
  if (h.get("sec-ch-ua-mobile") === "?1") return true;
  return /Mobi|Android|iPhone|iPad|iPod|Silk|Kindle/i.test(h.get("user-agent") ?? "");
}

export async function emptyAppData(): Promise<AppData> {
  const byCity = {} as Record<CitySlug, ShellPack>;
  for (const city of CITIES) byCity[city.slug] = shellPack([], [], city.areas);
  return { city: "chennai", mob: await isMobileRequest(), boot: { view: null, q: "", area: "", cuisine: "", notFound: true }, byCity, reels: [] };
}

export async function loadAppData(options: {
  city: CitySlug;
  view?: "rest" | "mas" | null;
  place?: { kind: Kind; slug: string };
  scroll?: string;
  searchParams?: SearchRecord;
}): Promise<{ data: AppData; records: CityRecords; place: Restaurant | PrayerHall | null }> {
  const params = options.searchParams ?? {};
  const [loaded, community, mob] = await Promise.all([
    Promise.all(
      CITIES.map(async (city) => {
        try {
          const [restaurants, masjids] = await Promise.all([listRestaurants(city.slug), listMasjids(city.slug)]);
          return { city: city.slug, restaurants, masjids };
        } catch {
          return { city: city.slug, restaurants: [] as Restaurant[], masjids: [] as PrayerHall[] };
        }
      }),
    ),
    listCommunity().catch(() => []),
    isMobileRequest(),
  ]);

  const records = {} as CityRecords;
  const byCity = {} as Record<CitySlug, ShellPack>;
  for (const entry of loaded) {
    records[entry.city] = { restaurants: entry.restaurants, masjids: entry.masjids };
    const city = CITIES.find((c) => c.slug === entry.city)!;
    byCity[entry.city] = shellPack(entry.restaurants, entry.masjids, city.areas);
  }

  let place: Restaurant | PrayerHall | null = null;
  if (options.place) {
    const { kind, slug } = options.place;
    const rec = records[options.city];
    const pack = byCity[options.city];
    if (kind === "restaurants") {
      const found = rec.restaurants.find((r) => r.slug === slug) ?? (await getRestaurant(options.city, slug));
      if (found && !pack.restaurants.some((r) => r.slug === found.slug)) pack.restaurants.push(toShellRestaurant(found, pack.restaurants.length));
      place = found;
    } else {
      const found = rec.masjids.find((m) => m.slug === slug) ?? (await getMasjid(options.city, slug));
      if (found && !pack.masjids.some((m) => m.slug === found.slug)) pack.masjids.push(toShellMasjid(found, pack.masjids.length));
      place = found;
    }
  }

  const lat = parseCoord(one(params, "lat"));
  const lng = parseCoord(one(params, "lng"));
  const boot: Boot = {
    view: options.view ?? null,
    q: one(params, "q"),
    area: one(params, "area"),
    cuisine: one(params, "cuisine"),
  };
  if (options.scroll) boot.scroll = options.scroll;
  if (lat != null && lng != null) boot.pos = [lat, lng];
  if (options.place && place) {
    boot.slug = options.place.slug;
    boot.kind = options.place.kind;
  }

  return {
    data: { city: options.city, mob, boot, byCity, reels: community.map(toShellReel) },
    records,
    place,
  };
}
