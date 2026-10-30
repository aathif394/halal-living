import type { CityTheme } from "@/lib/cities";
import type { PlaceCard } from "@/lib/view";
import { Landmark, StarPattern } from "./brand";
import { Icon } from "./icons";
import { PlaceBrowser } from "./place-browser";

export function ListPage({
  city,
  kind,
  places,
  areas,
  query,
  area,
  near,
}: {
  city: CityTheme;
  kind: "restaurants" | "masjids";
  places: PlaceCard[];
  areas: string[];
  query: string;
  area: string;
  near: boolean;
}) {
  const rest = kind === "restaurants";
  const loop = [...areas, ...areas];
  return (
    <>
      <section className="hl-lhero">
        <StarPattern />
        <Landmark city={city} size={300} className="hl-lhero__lm" />
        <div className="hl-wrap hl-lhero__in">
          <nav className="hl-crumbs" aria-label="Breadcrumb">
            <a href={`/${city.slug}`}>Home</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{rest ? "Restaurants" : "Masjids"}</span>
          </nav>
          <h1 className="hl-lhero__h">
            {rest ? "Halal restaurants" : "Masjids & prayer halls"} in {city.name}
          </h1>
          <form className="hl-lsearch" action={`/${city.slug}/${kind}`} role="search">
            <Icon name="search" size={18} stroke={2.4} />
            <input name="q" defaultValue={query} placeholder={rest ? "Search restaurants, cuisines or areas" : "Search masjids or areas"} aria-label={rest ? "Search restaurants" : "Search masjids"} enterKeyHint="search" />
            {area ? <input type="hidden" name="area" value={area} /> : null}
          </form>
          {areas.length ? (
            <div className="hl-marquee">
              <div className="hl-marquee__track">
                {loop.map((item, i) => (
                  <a key={`${item}-${i}`} className="hl-marquee__chip" href={`/${city.slug}/${kind}?area=${encodeURIComponent(item)}`} aria-hidden={i >= areas.length ? true : undefined} tabIndex={i >= areas.length ? -1 : undefined}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <PlaceBrowser
        city={{ slug: city.slug, name: city.name }}
        restaurants={rest ? places : []}
        masjids={rest ? [] : places}
        areas={areas}
        mode="list"
        initialKind={kind}
        initialArea={area}
        initialNear={near}
        query={query}
      />
    </>
  );
}
