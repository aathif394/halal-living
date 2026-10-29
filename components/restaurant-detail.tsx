import type { CityTheme } from "@/lib/cities";
import { breadcrumbLd, restaurantLd } from "@/lib/seo";
import { toShellRestaurant } from "@/lib/shell-data";
import type { Restaurant } from "@/lib/types";
import { Crumbs } from "./crumbs";
import { JsonLd } from "./json-ld";
import { SealBadge } from "./seal-badge";

export function RestaurantDetail({ city, place, base }: { city: CityTheme; place: Restaurant; base: string }) {
  const shell = toShellRestaurant(place, 0);
  const tier = shell.cert ? "certified" : shell.trust === "Vegetarian" ? "vegetarian" : "attested";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="hl-page-main">
      <Crumbs
        items={[
          { href: `/${city.slug}`, label: city.name },
          { href: `/${city.slug}/restaurants`, label: "Restaurants" },
          { label: place.name },
        ]}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <h1 style={{ margin: 0 }}>{place.name}</h1>
        <SealBadge tier={tier} />
      </div>
      <p className="hl-prose">{place.tagline || place.description || `${place.cuisine} in ${place.neighborhood}, ${city.name}.`}</p>

      <div className="hl-detail">
        <div className="hl-detail-art">
          {shell.photos.length ? (
            <div className="hl-grid" style={{ gridTemplateColumns: "2fr 1fr 1fr", gap: 4 }}>
              {shell.photos.slice(0, 3).map((photo, index) => (
                <div
                  key={index}
                  style={{ height: index === 0 ? 320 : 158, background: photo.bg, gridRow: index === 0 ? "1 / 3" : undefined }}
                />
              ))}
            </div>
          ) : (
            <div className="hl-card-art" style={{ height: 320, background: "var(--tint)" }} />
          )}
        </div>
        <div>
          <div className="hl-facts">
            <div><b>Halal status</b>{shell.trustLine}</div>
            <div><b>Cuisine</b>{place.cuisine}</div>
            <div><b>Price range</b>{place.price_range || "Not listed"}</div>
            <div><b>Address</b>{place.address || "Not listed"}</div>
            {shell.phone ? <div><b>Phone</b><a href={`tel:${shell.phone}`}>{shell.phone}</a></div> : null}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {shell.mapsUrl ? (
              <a className="hl-btn" href={shell.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ background: "var(--btn)", color: "#fff" }}>
                Directions →
              </a>
            ) : null}
            {shell.phone ? (
              <a className="hl-btn" href={`tel:${shell.phone}`}>Call</a>
            ) : null}
          </div>

          {shell.weekHours.length === 7 ? (
            <>
              <h2 style={{ marginTop: 28 }}>Hours</h2>
              <div className="hl-times">
                {days.map((day, index) => (
                  <div className="hl-time" key={day}>
                    <b>{day}</b>
                    {shell.weekHours[index] || "—"}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="hl-note">{shell.today}</p>
          )}
        </div>
      </div>

      {shell.reviewItems.length ? (
        <>
          <h2>Reviews</h2>
          <ul className="hl-list" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", display: "grid" }}>
            {shell.reviewItems.map(([name, initial, color, stars, ago, text], index) => (
              <li key={index}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 999, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                    {initial}
                  </span>
                  <div>
                    <strong>{name}</strong>
                    <p style={{ margin: 0, color: "var(--muted)" }}>{ago}</p>
                  </div>
                  {stars ? <span style={{ marginLeft: "auto", color: "#f2a20c" }}>{stars}</span> : null}
                </div>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {place.owner_signature ? (
        <blockquote className="hl-quote">
          “{place.owner_signature}”
          <footer>{place.owner_title || "Owner"}</footer>
        </blockquote>
      ) : null}

      <JsonLd
        data={breadcrumbLd(base, [
          { name: city.name, path: `/${city.slug}` },
          { name: "Restaurants", path: `/${city.slug}/restaurants` },
          { name: place.name, path: `/${city.slug}/restaurants/${place.slug}` },
        ])}
      />
      <JsonLd data={restaurantLd(base, place)} />
    </div>
  );
}
