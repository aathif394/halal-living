import { readEnv } from "./supabase.ts";
import snapshot from "../data/traffic.json" with { type: "json" };

const ACCOUNT = "5f9e40326be2921b0ad69c3cfe63ffbc";
const SITES = ["3fa39475461f4a449c11479e63884857", "c3945c6bb7894979ac1465446c65c31b"];
const HOSTS = ["halal.livingcollective.net", "thehalalliving.com", "www.thehalalliving.com"];
export const TRAFFIC_CITIES = ["chennai", "mumbai", "bangalore", "hyderabad"] as const;
export type Traffic = {
  counts: Record<string, number>;
  start: string;
  end: string;
  updatedAt: string;
  source: string;
  mode: "live" | "snapshot";
};
type Group = { count: number; dimensions: { requestPath: string } };

export function trafficWindows(now: Date): { start: string; end: string }[] {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")!.value);
  const month = Number(parts.find((part) => part.type === "month")!.value);
  const start = Date.UTC(year, month - 1, 1) - 330 * 60000;
  const windows = [];
  for (let cursor = start; cursor < now.getTime(); cursor += 7 * 86400000) {
    windows.push({
      start: new Date(cursor).toISOString(),
      end: new Date(Math.min(cursor + 7 * 86400000, now.getTime())).toISOString(),
    });
  }
  return windows;
}

export function cityPageViews(groups: Group[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(
    TRAFFIC_CITIES.map((city) => [city, 0]),
  );
  for (const group of groups) {
    const city = group.dimensions.requestPath.split("/")[1]!;
    if (city in counts && Number.isFinite(group.count) && group.count >= 0) {
      counts[city]! += group.count;
    }
  }
  return counts;
}

let cached: { expires: number; data: Traffic } | undefined;

export function trafficSnapshot(now = new Date()): Traffic | null {
  const start = trafficWindows(now)[0]?.start;
  if (cached && cached.expires > now.getTime() && cached.data.start === start) return cached.data;
  return snapshot.start === start && snapshot.updatedAt ? (snapshot as Traffic) : null;
}

export async function monthlyTraffic(): Promise<Traffic | null> {
  if (cached && cached.expires > Date.now()) return cached.data;
  const token = await readEnv("CLOUDFLARE_ANALYTICS_TOKEN");
  const now = new Date();
  const windows = trafficWindows(now);
  const measuredSnapshot = trafficSnapshot(now);
  if (!token) return measuredSnapshot;
  try {
    const siteFilter = SITES.map((s) => `"${s}"`).join(",");
    const hostFilter = HOSTS.map((h) => `"${h}"`).join(",");
    const fields = windows
      .map(
        (window, index) =>
          `period${index}:rumPageloadEventsAdaptiveGroups(limit:10000,filter:{siteTag_in:[${siteFilter}],requestHost_in:[${hostFilter}],datetime_geq:"${window.start}",datetime_lt:"${window.end}"}){count dimensions{requestPath}}`,
      )
      .join(" ");
    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        query: `{viewer{accounts(filter:{accountTag:"${ACCOUNT}"}){${fields}}}}`,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error("Analytics request failed");
    const result = (await response.json()) as {
      errors?: unknown;
      data?: { viewer: { accounts: Record<string, Group[]>[] } };
    };
    if (result.errors || !result.data?.viewer.accounts.length)
      throw new Error("Analytics unavailable");
    const groups = Object.values(result.data.viewer.accounts[0]!).flat();
    const data: Traffic = {
      counts: cityPageViews(groups),
      start: windows[0]!.start,
      end: now.toISOString(),
      updatedAt: now.toISOString(),
      source: "Verified Analytics",
      mode: "live",
    };
    cached = { expires: Date.now() + 5 * 60000, data };
    return data;
  } catch {
    // Do not substitute mockup numbers or silently show zero when analytics fails.
    return measuredSnapshot;
  }
}
