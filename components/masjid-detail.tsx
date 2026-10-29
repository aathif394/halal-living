import type { CityTheme } from "@/lib/cities";
import { breadcrumbLd, masjidLd } from "@/lib/seo";
import { toShellMasjid } from "@/lib/shell-data";
import type { PrayerHall } from "@/lib/types";
import { Crumbs } from "./crumbs";
import { JsonLd } from "./json-ld";

export function MasjidDetail({ city, place, base }: { city: CityTheme; place: PrayerHall; base: string }) {
  const shell = toShellMasjid(place, 0);

  return (
    <div className="hl-page-main">
      <Crumbs
        items={[
          { href: `/${city.slug}`, label: city.name },
          { href: `/${city.slug}/masjids`, label: "Masjids" },
          { label: place.name },
        ]}
      />
      <h1>{place.name}</h1>
      <p className="hl-prose">
        {[shell.kind, place.neighborhood, place.madhab ? `${place.madhab} madhab` : ""].filter(Boolean).join(" · ")}
        {place.description ? ` ${place.description}` : ""}
      </p>

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
            <div><b>Address</b>{place.address || "Not listed"}</div>
            {shell.jummah ? <div><b>Jumu&rsquo;ah</b>{shell.jummah}</div> : null}
            {place.capacity > 0 ? <div><b>Capacity</b>{place.capacity.toLocaleString("en-IN")} people</div> : null}
            {shell.phone ? <div><b>Phone</b><a href={`tel:${shell.phone}`}>{shell.phone}</a></div> : null}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {shell.mapsUrl ? (
              <a className="hl-btn" href={shell.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ background: "var(--btn)", color: "#fff" }}>
                Directions →
              </a>
            ) : null}
            {shell.phone ? <a className="hl-btn" href={`tel:${shell.phone}`}>Call</a> : null}
          </div>

          {shell.prayers.length ? (
            <>
              <h2 style={{ marginTop: 28 }}>Prayer times</h2>
              <div className="hl-times">
                {shell.prayers.map(([name, minutes]) => (
                  <div className="hl-time" key={name}>
                    <b>{name}</b>
                    {String(Math.floor(minutes / 60)).padStart(2, "0")}:{String(minutes % 60).padStart(2, "0")}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {place.facilities.length ? (
            <>
              <h2 style={{ marginTop: 28 }}>Facilities</h2>
              <div className="hl-chips" style={{ margin: "12px 0 0" }}>
                {place.facilities.map((item) => (
                  <span className="hl-amenity" key={item}>{item}</span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {place.note ? <p className="hl-note">{place.note}</p> : null}

      <JsonLd
        data={breadcrumbLd(base, [
          { name: city.name, path: `/${city.slug}` },
          { name: "Masjids", path: `/${city.slug}/masjids` },
          { name: place.name, path: `/${city.slug}/masjids/${place.slug}` },
        ])}
      />
      <JsonLd data={masjidLd(base, place)} />
    </div>
  );
}
