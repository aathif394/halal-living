import type { CityTheme } from "@/lib/cities";
import { withFilters, type PlaceFilters } from "@/lib/filters";
import { breadcrumbLd, itemListLd } from "@/lib/seo";
import type { PrayerHall, Restaurant } from "@/lib/types";
import { MasjidCard, RestaurantCard } from "./cards";
import { Crumbs } from "./crumbs";
import { JsonLd } from "./json-ld";
import { NearButton } from "./near-button";

type Kind = "restaurants" | "masjids" | "search";

function titleFor(city: CityTheme, kind: Kind, filters: PlaceFilters): string {
  if (kind === "search") {
    return filters.q ? `Search “${filters.q}” in ${city.name}` : `Search ${city.name}`;
  }
  if (kind === "masjids") {
    return filters.area ? `Masjids in ${filters.area}, ${city.name}` : `Masjids and prayer halls in ${city.name}`;
  }
  if (filters.area) return `Halal restaurants in ${filters.area}, ${city.name}`;
  if (filters.cuisine) return `${filters.cuisine} restaurants in ${city.name}`;
  return `Halal restaurants in ${city.name}`;
}

export function Directory({
  city,
  kind,
  restaurants,
  masjids,
  filters,
  areas,
  cuisines,
  base,
}: {
  city: CityTheme;
  kind: Kind;
  restaurants: Restaurant[];
  masjids: PrayerHall[];
  filters: PlaceFilters;
  areas: string[];
  cuisines: string[];
  base: string;
}) {
  const path = kind === "search" ? `/${city.slug}/search` : `/${city.slug}/${kind}`;
  const title = titleFor(city, kind, filters);
  const filtered = Boolean(filters.q || filters.area || filters.cuisine);
  const crumbs = [
    { href: `/${city.slug}`, label: city.name },
    { label: kind === "masjids" ? "Masjids" : kind === "restaurants" ? "Restaurants" : "Search" },
  ];
  const showRestaurants = kind !== "masjids";
  const showMasjids = kind !== "restaurants";

  return (
    <div className="hl-page-main">
      <Crumbs items={crumbs} />
      <h1>{title}</h1>
      <p className="hl-prose">
        {kind === "masjids"
          ? `Masjids and prayer halls in ${city.name}, with Jumu'ah time, madhab, and facilities.`
          : `Halal restaurants and masjids in ${city.name}, checked by people who live there.`}
      </p>
      <form className="hl-search" action={path} style={{ marginTop: 22 }}>
        <span className="hl-sr">Search</span>
        {filters.area ? <input type="hidden" name="area" value={filters.area} /> : null}
        {filters.cuisine && kind !== "masjids" ? <input type="hidden" name="cuisine" value={filters.cuisine} /> : null}
        {filters.lat != null ? <input type="hidden" name="lat" value={filters.lat} /> : null}
        {filters.lng != null ? <input type="hidden" name="lng" value={filters.lng} /> : null}
        <input name="q" defaultValue={filters.q ?? ""} placeholder="Search restaurants, masjids, or areas" aria-label={`Search halal places in ${city.name}`} />
        <button type="submit">Search</button>
      </form>
      <div className="hl-chips">
        <NearButton label={filters.lat != null ? "Location on" : "Sort by my location"} />
        {filtered || filters.lat != null ? <a className="hl-chip" href={path}>Clear</a> : null}
      </div>
      {areas.length ? (
        <div className="hl-chips" aria-label="Neighbourhoods">
          <a className="hl-chip" href={withFilters(path, { ...filters, area: undefined })} aria-current={filters.area ? undefined : "page"}>All areas</a>
          {areas.map((area) => (
            <a
              className="hl-chip"
              key={area}
              href={withFilters(path, { ...filters, area })}
              aria-current={filters.area === area ? "page" : undefined}
            >
              {area}
            </a>
          ))}
        </div>
      ) : null}
      {kind !== "masjids" && cuisines.length ? (
        <div className="hl-chips" aria-label="Cuisines">
          <a className="hl-chip" href={withFilters(path, { ...filters, cuisine: undefined })} aria-current={filters.cuisine ? undefined : "page"}>All cuisines</a>
          {cuisines.map((cuisine) => (
            <a
              className="hl-chip"
              key={cuisine}
              href={withFilters(path, { ...filters, cuisine })}
              aria-current={filters.cuisine === cuisine ? "page" : undefined}
            >
              {cuisine}
            </a>
          ))}
        </div>
      ) : null}

      {showRestaurants ? (
        <section className="hl-section" aria-labelledby="restaurant-results">
          <div className="hl-section-head">
            <h2 id="restaurant-results">Restaurants</h2>
            <span>{restaurants.length}</span>
          </div>
          {restaurants.length ? (
            <div className="hl-grid cols-3">
              {restaurants.map((place) => <RestaurantCard key={place.id} place={place} city={city} />)}
            </div>
          ) : (
            <div className="hl-empty">
              {filtered ? `No restaurants in ${city.name} match this search.` : `No restaurants in ${city.name} yet.`}{" "}
              <a className="hl-link" href="/suggest">Suggest a place</a>
            </div>
          )}
        </section>
      ) : null}

      {showMasjids ? (
        <section className="hl-section" aria-labelledby="masjid-results">
          <div className="hl-section-head">
            <h2 id="masjid-results">Masjids & prayer halls</h2>
            <span>{masjids.length}</span>
          </div>
          {masjids.length ? (
            <div className="hl-grid cols-3">
              {masjids.map((place) => <MasjidCard key={place.id} place={place} city={city} />)}
            </div>
          ) : (
            <div className="hl-empty">
              {filtered ? `No masjids in ${city.name} match this search.` : `No masjids in ${city.name} yet.`}{" "}
              <a className="hl-link" href="/suggest">Suggest a place</a>
            </div>
          )}
        </section>
      ) : null}

      <JsonLd
        data={breadcrumbLd(base, [
          { name: city.name, path: `/${city.slug}` },
          { name: crumbs[1]?.label ?? title, path },
        ])}
      />
      {showRestaurants ? (
        <JsonLd
          data={itemListLd(
            base,
            title,
            restaurants.slice(0, 30).map((place) => ({
              name: place.name,
              path: `/${city.slug}/restaurants/${place.slug}`,
            })),
          )}
        />
      ) : null}
      {showMasjids ? (
        <JsonLd
          data={itemListLd(
            base,
            `Masjids in ${city.name}`,
            masjids.slice(0, 30).map((place) => ({
              name: place.name,
              path: `/${city.slug}/masjids/${place.slug}`,
            })),
          )}
        />
      ) : null}
    </div>
  );
}
