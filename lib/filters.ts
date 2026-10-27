import { parseCoord, type PlaceFilters } from "./data";

export type { PlaceFilters };

export type SearchRecord = Record<string, string | string[] | undefined>;

export function readFilters(searchParams: SearchRecord): PlaceFilters {
  const one = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : undefined;
  };
  return {
    q: one("q"),
    area: one("area"),
    cuisine: one("cuisine"),
    lat: parseCoord(one("lat")),
    lng: parseCoord(one("lng")),
  };
}

export function readNotice(searchParams: SearchRecord): "sent" | "error" | undefined {
  if (searchParams.sent !== undefined) return "sent";
  if (searchParams.error !== undefined) return "error";
  return undefined;
}

export function withFilters(path: string, filters: PlaceFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.area) params.set("area", filters.area);
  if (filters.cuisine) params.set("cuisine", filters.cuisine);
  if (filters.lat != null && filters.lng != null) {
    params.set("lat", String(filters.lat));
    params.set("lng", String(filters.lng));
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function indexableFilters(filters: PlaceFilters): PlaceFilters {
  return { q: filters.q, area: filters.area, cuisine: filters.cuisine };
}

export function uniqueLabels(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "en"));
}
