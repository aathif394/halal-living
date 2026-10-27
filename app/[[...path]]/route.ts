import { CITIES, SITE_DESCRIPTION, getCity, type CitySlug } from "@/lib/cities";
import { getAboutPage, getMasjid, getRestaurant, listCommunity, listMasjids, listRestaurants } from "@/lib/data";
import { breadcrumbLd, faqLd, graphLd, itemListLd, jsonLdScript, masjidLd, organizationLd, restaurantLd, siteUrl, websiteLd } from "@/lib/seo";
import { shellPack, toShellMasjid, toShellReel, toShellRestaurant, type ShellMasjid, type ShellPack, type ShellReel, type ShellRestaurant } from "@/lib/shell-data";
import type { PrayerHall, Restaurant } from "@/lib/types";

export const dynamic = "force-dynamic";

type Kind = "restaurants" | "masjids";

type Page =
  | { page: "city"; city: CitySlug }
  | { page: "list"; city: CitySlug; kind: Kind }
  | { page: "place"; city: CitySlug; kind: Kind; slug: string }
  | { page: "search"; city: CitySlug | null }
  | { page: "suggest" }
  | { page: "advertise" }
  | { page: "about" };

type Boot = {
  view: "rest" | "mas" | null;
  q: string;
  area: string;
  cuisine: string;
  slug?: string;
  kind?: Kind;
  pos?: [number, number];
  scroll?: string;
};

const MARKER = "</script>\n\n\n<x-dc>\n";

let cachedShell: string | null = null;

async function loadShell(request: Request): Promise<string> {
  if (cachedShell && process.env.NODE_ENV === "production") return cachedShell;
  try {
    const mod = (await import(/* @vite-ignore */ "cloudflare:workers")) as {
      env?: { ASSETS?: { fetch: (input: Request) => Promise<Response> } };
    };
    const assets = mod.env?.ASSETS;
    if (assets) {
      const response = await assets.fetch(new Request(new URL("/shell.html", request.url)));
      if (response.ok) {
        const text = await response.text();
        if (process.env.NODE_ENV === "production") cachedShell = text;
        return text;
      }
    }
  } catch {
    // Local dev can read the file directly when the assets binding is unavailable.
  }
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const text = await readFile(fileURLToPath(new URL("../../public/shell.html", import.meta.url)), "utf8");
  return text;
}

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsValue(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function parsePage(path: string[]): Page | null {
  if (path.length === 1 && path[0] === "search") return { page: "search", city: null };
  if (path.length === 1 && path[0] === "suggest") return { page: "suggest" };
  if (path.length === 1 && path[0] === "advertise") return { page: "advertise" };
  if (path.length === 1 && path[0] === "how-we-verify") return { page: "about" };
  const city = getCity(path[0] ?? "");
  if (!city) return null;
  if (path.length === 1) return { page: "city", city: city.slug };
  const kind = path[1] === "restaurants" || path[1] === "masjids" ? path[1] : null;
  if (path.length === 2 && path[1] === "search") return { page: "search", city: city.slug };
  if (path.length === 2 && kind) return { page: "list", city: city.slug, kind };
  if (path.length === 3 && kind && path[2]) return { page: "place", city: city.slug, kind, slug: decodeURIComponent(path[2]) };
  return null;
}

function queryValue(url: URL, key: string) {
  return (url.searchParams.get(key) ?? "").trim().slice(0, 80);
}

function coord(value: string) {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < -180 || number > 180) return undefined;
  return number;
}

function matchesQuery(name: string, extra: string, query: string) {
  if (!query) return true;
  return `${name} ${extra}`.toLowerCase().includes(query.toLowerCase());
}

function linkList(title: string, items: { href: string; label: string }[]) {
  if (!items.length) return `<h2>${esc(title)}</h2><p>None listed yet.</p>`;
  return `<h2>${esc(title)}</h2><ul>${items
    .map((item) => `<li><a href="${esc(item.href)}">${esc(item.label)}</a></li>`)
    .join("")}</ul>`;
}

function restaurantLinks(base: string, city: CitySlug, rows: ShellRestaurant[]) {
  return rows.map((place) => ({
    href: `${base}/${city}/restaurants/${encodeURIComponent(place.slug)}`,
    label: [place.name, place.area].filter(Boolean).join(" · "),
  }));
}

function masjidLinks(base: string, city: CitySlug, rows: ShellMasjid[]) {
  return rows.map((place) => ({
    href: `${base}/${city}/masjids/${encodeURIComponent(place.slug)}`,
    label: [place.name, place.area].filter(Boolean).join(" · "),
  }));
}

export async function GET(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  const url = new URL(request.url);
  const path = (await context.params).path ?? [];
  if (path.length === 0) return Response.redirect(new URL(`/chennai${url.search}`, url), 307);

  const page = parsePage(path);
  if (!page) return missing(url);

  const communityPromise = listCommunity();
  const loaded = await Promise.all(
    CITIES.map(async (city) => {
      try {
        const [restaurants, masjids] = await Promise.all([listRestaurants(city.slug), listMasjids(city.slug)]);
        return { city: city.slug, restaurants, masjids, pack: shellPack(restaurants, masjids, city.areas) };
      } catch {
        return { city: city.slug, restaurants: [] as Restaurant[], masjids: [] as PrayerHall[], pack: shellPack([], [], city.areas) };
      }
    }),
  );
  const byCity = {} as Record<CitySlug, ShellPack>;
  const records = {} as Record<CitySlug, { restaurants: Restaurant[]; masjids: PrayerHall[]; pack: ShellPack }>;
  for (const entry of loaded) {
    byCity[entry.city] = entry.pack;
    records[entry.city] = entry;
  }

  const city = "city" in page && page.city ? page.city : "chennai";
  const q = queryValue(url, "q");
  const area = queryValue(url, "area");
  const cuisine = queryValue(url, "cuisine");
  const lat = coord(url.searchParams.get("lat") ?? "");
  const lng = coord(url.searchParams.get("lng") ?? "");
  const noindex = lat != null || lng != null;

  let placeRestaurant: Restaurant | null = null;
  let placeMasjid: PrayerHall | null = null;
  if (page.page === "place") {
    const fromList =
      page.kind === "restaurants"
        ? records[page.city].restaurants.find((item) => item.slug === page.slug)
        : records[page.city].masjids.find((item) => item.slug === page.slug);
    if (page.kind === "restaurants") {
      placeRestaurant = (fromList as Restaurant | undefined) ?? (await getRestaurant(page.city, page.slug));
      if (!placeRestaurant) return missing(url);
      if (!byCity[page.city].restaurants.some((item) => item.slug === placeRestaurant!.slug)) {
        byCity[page.city].restaurants.push(toShellRestaurant(placeRestaurant, byCity[page.city].restaurants.length));
      }
    } else {
      placeMasjid = (fromList as PrayerHall | undefined) ?? (await getMasjid(page.city, page.slug));
      if (!placeMasjid) return missing(url);
      if (!byCity[page.city].masjids.some((item) => item.slug === placeMasjid!.slug)) {
        byCity[page.city].masjids.push(toShellMasjid(placeMasjid, byCity[page.city].masjids.length));
      }
    }
  }
  const reels: ShellReel[] = (await communityPromise).map(toShellReel);

  const boot: Boot = {
    view: page.page === "list" ? (page.kind === "masjids" ? "mas" : "rest") : page.page === "search" ? "rest" : null,
    q,
    area,
    cuisine,
    scroll: page.page === "suggest" ? "[data-suggest='1']" : page.page === "advertise" ? "[data-advertise='1']" : undefined,
  };
  if (lat != null && lng != null) boot.pos = [lat, lng];
  if (page.page === "place") {
    boot.slug = page.slug;
    boot.kind = page.kind;
  }

  const base = await siteUrl();
  const canonicalPath = `/${path.map(encodeURIComponent).join("/")}`;
  const cityName = getCity(city)?.name ?? "Chennai";
  const pack = byCity[city];
  const title = pageTitle(page, cityName, placeRestaurant, placeMasjid);
  const description = pageDescription(page, cityName, pack);
  const noscript = renderNoscript(page, base, byCity, records, { q, area, cuisine }, placeRestaurant, placeMasjid);
  const graph = await jsonGraph(page, base, records, placeRestaurant, placeMasjid);

  const shell = await loadShell(request);
  if (!shell.includes(MARKER) || !shell.includes("<title>Halal Living</title>")) {
    return new Response("Shell is missing its mount point.", { status: 500 });
  }

  const head = `<title>${esc(title)}</title>\n<meta name="description" content="${esc(description)}">\n<link rel="canonical" href="${esc(`${base}${canonicalPath}`)}">${noindex ? '\n<meta name="robots" content="noindex">' : ""}`;
  const bootScript =
    "(function(){var boot=window.__HLC&&window.__HLC.boot;if(!boot||!boot.slug)return;var pack=window.__HLC.byCity[window.__HLC.city];var list=pack&&(boot.kind==='masjids'?pack.masjids:pack.restaurants);if(!list)return;for(var i=0;i<list.length;i++){if(list[i].slug===boot.slug){window.__HLC_DETAIL=list[i];break;}}})();";
  const injected = `<script>window.__HLC=${jsValue({ city, boot, byCity, reels })};${bootScript}</script>\n<script type="application/ld+json">${jsonLdScript(graph)}</script>\n${noscript}\n`;
  const html = shell.replace("<title>Halal Living</title>", head).replace(MARKER, `</script>\n${injected}\n<x-dc>\n`);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "permissions-policy": "geolocation=(self)",
    },
  });
}

function pageTitle(page: Page, cityName: string, restaurant: Restaurant | null, masjid: PrayerHall | null) {
  if (page.page === "place" && restaurant) return `${restaurant.name} · ${cityName} · Halal Living`;
  if (page.page === "place" && masjid) return `${masjid.name} · ${cityName} · Halal Living`;
  if (page.page === "list") return `${page.kind === "masjids" ? "Masjids" : "Halal restaurants"} in ${cityName} · Halal Living`;
  if (page.page === "search") return `Search halal places${page.city ? ` in ${cityName}` : ""} · Halal Living`;
  if (page.page === "suggest") return "Suggest a place · Halal Living";
  if (page.page === "advertise") return "Advertise · Halal Living";
  if (page.page === "about") return "How we verify · Halal Living";
  return `Halal food and masjids in ${cityName} · Halal Living`;
}

function pageDescription(page: Page, cityName: string, pack: ShellPack) {
  if (page.page === "place") return SITE_DESCRIPTION;
  if (page.page === "about") return "A person suggests a place, and someone from the community checks it before it is listed.";
  return `${cityName} has ${pack.restaurants.length} halal restaurants and ${pack.masjids.length} masjids on Halal Living. ${SITE_DESCRIPTION}`;
}

function renderNoscript(
  page: Page,
  base: string,
  byCity: Record<CitySlug, ShellPack>,
  records: Record<CitySlug, { restaurants: Restaurant[]; masjids: PrayerHall[] }>,
  filters: { q: string; area: string; cuisine: string },
  restaurant: Restaurant | null,
  masjid: PrayerHall | null,
) {
  const city = "city" in page && page.city ? page.city : "chennai";
  const cityName = getCity(city)?.name ?? "Chennai";
  const pack = byCity[city];
  const restaurants = pack.restaurants.filter(
    (place) =>
      (!filters.area || place.area === filters.area) &&
      (!filters.cuisine || place.kind === filters.cuisine) &&
      matchesQuery(place.name, `${place.cuisine} ${place.area}`, filters.q),
  );
  const masjids = pack.masjids.filter(
    (place) => (!filters.area || place.area === filters.area) && matchesQuery(place.name, `${place.kind} ${place.area}`, filters.q),
  );

  let body = "";
  if (page.page === "place" && restaurant) {
    body = `<h1>${esc(restaurant.name)}</h1><p>${esc([restaurant.cuisine, restaurant.neighborhood, restaurant.address].filter(Boolean).join(" · "))}</p><p>${esc(restaurant.certification || "Halal status not recorded.")}</p><p>${esc(restaurant.description || restaurant.tagline || "")}</p><p><a href="${esc(`${base}/${city}/restaurants`)}">All restaurants in ${esc(cityName)}</a></p>`;
  } else if (page.page === "place" && masjid) {
    const times = [masjid.fajr && `Fajr ${masjid.fajr}`, masjid.dhuhr && `Dhuhr ${masjid.dhuhr}`, masjid.asr && `Asr ${masjid.asr}`, masjid.maghrib && `Maghrib ${masjid.maghrib}`, masjid.isha && `Isha ${masjid.isha}`, masjid.jummah_time && `Jumu'ah ${masjid.jummah_time}`]
      .filter(Boolean)
      .join(" · ");
    body = `<h1>${esc(masjid.name)}</h1><p>${esc([masjid.neighborhood, masjid.address, masjid.madhab].filter(Boolean).join(" · "))}</p><p>${esc(times)}</p><p>${esc(masjid.facilities.join(", "))}</p><p>${esc(masjid.description || "")}</p><p><a href="${esc(`${base}/${city}/masjids`)}">All masjids in ${esc(cityName)}</a></p>`;
  } else if (page.page === "search" && !page.city) {
    body = `<h1>Search</h1>${CITIES.map((entry) => {
      const rows = byCity[entry.slug].restaurants.filter((place) => matchesQuery(place.name, `${place.cuisine} ${place.area}`, filters.q));
      const halls = byCity[entry.slug].masjids.filter((place) => matchesQuery(place.name, place.area, filters.q));
      return `<h2>${esc(entry.name)}</h2>${linkList("Restaurants", restaurantLinks(base, entry.slug, rows))}${linkList("Masjids", masjidLinks(base, entry.slug, halls))}`;
    }).join("")}`;
  } else if (page.page === "about") {
    const counts = CITIES.map((entry) => `${entry.name}: ${records[entry.slug].restaurants.length} restaurants, ${records[entry.slug].masjids.length} masjids`).join(". ");
    body = `<h1>How we verify</h1><p>Someone suggests a restaurant or masjid. A person from the community checks it before it is published. Certification is labelled from the listing, including HMC certified, self-certified, and vegetarian.</p><p>${esc(counts)}.</p>`;
  } else if (page.page === "suggest") {
    body = `<h1>Suggest a place</h1><p>Tell us about a restaurant or masjid. Someone from the community checks it before it is listed.</p><p><a href="${esc(`${base}/${city}`)}">${esc(cityName)}</a></p>`;
  } else if (page.page === "advertise") {
    body = `<h1>Advertise</h1><p>${esc(cityName)} currently lists ${pack.restaurants.length} restaurants and ${pack.masjids.length} masjids.</p>`;
  } else {
    const heading =
      page.page === "list" ? (page.kind === "masjids" ? `Masjids in ${cityName}` : `Halal restaurants in ${cityName}`) : `Halal food and masjids in ${cityName}`;
    body = `<h1>${esc(heading)}</h1><p>${esc(SITE_DESCRIPTION)}</p>${linkList("Restaurants", restaurantLinks(base, city, page.page === "list" && page.kind === "masjids" ? [] : restaurants))}${linkList("Masjids", masjidLinks(base, city, page.page === "list" && page.kind === "restaurants" ? [] : masjids))}`;
  }
  const cities = CITIES.map((entry) => `<a href="${esc(`${base}/${entry.slug}`)}">${esc(entry.name)}</a>`).join(" · ");
  return `<noscript><main>${body}<p>${cities}</p></main></noscript>`;
}

async function jsonGraph(
  page: Page,
  base: string,
  records: Record<CitySlug, { restaurants: Restaurant[]; masjids: PrayerHall[] }>,
  restaurant: Restaurant | null,
  masjid: PrayerHall | null,
) {
  const nodes: object[] = [organizationLd(base), websiteLd(base)];
  const city = "city" in page && page.city ? page.city : null;
  const cityName = city ? getCity(city)?.name ?? "" : "";
  if (page.page === "city" && city) {
    const questions = [
      {
        q: `Where can I find halal food in ${cityName}?`,
        a: records[city].restaurants.length
          ? `${cityName} currently has ${records[city].restaurants.length} halal restaurants on Halal Living, including ${records[city].restaurants
              .slice(0, 3)
              .map((place) => place.name)
              .join(", ")}.`
          : `Halal Living does not have restaurant listings for ${cityName} yet.`,
      },
      {
        q: `Which masjids are listed in ${cityName}?`,
        a: records[city].masjids.length
          ? `${records[city].masjids.length} masjids and prayer halls are listed, including ${records[city].masjids
              .slice(0, 3)
              .map((place) => place.name)
              .join(", ")}.`
          : `No masjids are listed in ${cityName} yet.`,
      },
      {
        q: "How does a listing get on Halal Living?",
        a: "Someone suggests a restaurant or masjid. A person from the community checks it before it is published. Halal certification is labelled as HMC certified, self-certified, or vegetarian.",
      },
    ];
    nodes.push(faqLd(questions));
    nodes.push(
      itemListLd(
        base,
        `Halal restaurants in ${cityName}`,
        records[city].restaurants.map((place) => ({ name: place.name, path: `/${city}/restaurants/${place.slug}` })),
      ),
    );
  }
  if (page.page === "list" && city) {
    const items =
      page.kind === "restaurants"
        ? records[city].restaurants.map((place) => ({ name: place.name, path: `/${city}/restaurants/${place.slug}` }))
        : records[city].masjids.map((place) => ({ name: place.name, path: `/${city}/masjids/${place.slug}` }));
    nodes.push(breadcrumbLd(base, [{ name: cityName, path: `/${city}` }, { name: page.kind === "restaurants" ? "Restaurants" : "Masjids", path: `/${city}/${page.kind}` }]));
    nodes.push(itemListLd(base, `${page.kind === "restaurants" ? "Restaurants" : "Masjids"} in ${cityName}`, items));
  }
  if (page.page === "place" && city && restaurant) {
    nodes.push(
      breadcrumbLd(base, [
        { name: cityName, path: `/${city}` },
        { name: "Restaurants", path: `/${city}/restaurants` },
        { name: restaurant.name, path: `/${city}/restaurants/${restaurant.slug}` },
      ]),
    );
    nodes.push(restaurantLd(base, restaurant));
  }
  if (page.page === "place" && city && masjid) {
    nodes.push(
      breadcrumbLd(base, [
        { name: cityName, path: `/${city}` },
        { name: "Masjids", path: `/${city}/masjids` },
        { name: masjid.name, path: `/${city}/masjids/${masjid.slug}` },
      ]),
    );
    nodes.push(masjidLd(base, masjid));
  }
  if (page.page === "about") {
    const about = await getAboutPage();
    if (about?.thesis_body) nodes.push({ "@type": "AboutPage", name: about.title || "How we verify", description: about.thesis_body });
  }
  return graphLd(nodes);
}

function missing(url: URL) {
  const home = new URL("/chennai", url);
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Not found · Halal Living</title><body style="font-family:Figtree,sans-serif;background:#fff;color:#1C1C1C;padding:48px 20px"><h1>That page is not listed.</h1><p><a href="${esc(home.pathname)}">Halal Living</a></p></body></html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}
