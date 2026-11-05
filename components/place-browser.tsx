"use client";

import Link from "next/link";
import { PlaceImage } from "./place-image";

import { useEffect, useMemo, useState } from "react";
import type { PlaceCard } from "@/lib/view";
import { ShareButton } from "./detail-parts";
import { Icon } from "./icons";
import { openLocator } from "./locator";
import { tiltHandlers } from "./motion";
import { SegTabs } from "./slide";
import { mapEmbedUrl } from "@/lib/maps";

type Kind = "restaurants" | "masjids";
type Coords = [number, number];

function km(a: Coords, lat: number, lng: number) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(lat - a[0]);
  const dLng = rad(lng - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function distLabel(value: number | null) {
  if (value == null) return "";
  return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1)} km`;
}

type Row = PlaceCard & { km: number | null; href: string };

export function PlaceRow({ place }: { place: Row }) {
  return (
    <article className="hl-row">
      <Link className="hl-row__link" href={place.href} prefetch={false}>
        <span className="hl-row__ph">
          <PlaceImage src={place.photo} alt="" width={160} height={120} sizes="80px" />
        </span>
        <span className="hl-row__t">
          <span className="hl-row__name">
            {place.name}
          </span>
          <span className="hl-row__sub">
            {place.sub} · {place.area}
          </span>
          <span className="hl-row__d">{place.km != null ? distLabel(place.km) : ""}</span>
        </span>
      </Link>
      <ShareButton title={place.name} url={place.href} />
    </article>
  );
}

/**
 * Mockup cards. "list" (list pages): distance chip on the photo, nothing else; restaurants end with
 * "View", masjids are shorter with no footer. "near" (home, desktop): share button on the photo,
 * then name and "cuisine · area" with the distance on the right.
 */
export function PlaceTile({ place, variant }: { place: Row; variant: "list" | "near" }) {
  const masjid = place.kind === "masjids";
  return (
    <article className={`hl-tile hl-tile--${variant}${masjid ? " hl-tile--m" : ""}`}>
      <Link className="hl-tile__link" href={place.href} prefetch={false}>
        <span className="hl-tile__ph" {...(variant === "near" ? tiltHandlers() : {})}>
          <PlaceImage src={place.photo} alt="" width={640} height={480} sizes="(min-width: 1100px) 280px, (min-width: 600px) 45vw, 90vw" />
          <span className="hl-tile__shine" aria-hidden="true" />
          {variant === "list" && place.km != null ? <span className="hl-tile__km">{distLabel(place.km)}</span> : null}
        </span>
        <span className="hl-tile__b">
          <span className="hl-tile__name">{place.name}</span>
          <span className="hl-tile__sub">
            <span>
              {place.sub} · {place.area}
            </span>
            {variant === "near" && place.km != null ? <span>{distLabel(place.km)}</span> : null}
          </span>
          {variant === "list" && !masjid ? (
            <span className="hl-tile__foot">
              View
              <Icon name="arrowRight" size={14} stroke={2.4} />
            </span>
          ) : null}
        </span>
      </Link>
      {variant === "near" ? <ShareButton title={place.name} url={place.href} /> : null}
    </article>
  );
}

function PlacesMap({ rows, kind, cityName }: { rows: Row[]; kind: Kind; cityName: string }) {
  const pins = rows.filter((row) => row.lat != null && row.lng != null);
  if (!pins.length) return <div className="hl-empty">No map positions for these places yet.</div>;
  const current = pins[0]!;
  return (
    <div className="hl-pmap">
      <iframe className="hl-pmap__bg" src={mapEmbedUrl([current.lat!, current.lng!])} title={`${cityName} ${kind === "masjids" ? "masjids" : "restaurants"} map`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen style={{ width: "100%", height: "calc(100% - 86px)", border: 0 }} />
      <a className="hl-pmap__open" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${kind === "masjids" ? "masjid" : "halal restaurant"} ${cityName}`)}`} target="_blank" rel="noopener noreferrer">
        <Icon name="map" size={14} stroke={2.2} />
        Open in Google Maps
      </a>
      <Link className="hl-pmap__card" href={current.href}>
        <PlaceImage src={current.photo} alt="" width={160} height={120} sizes="80px" />
        <span>
          <b>{current.name}</b>
          <small>
            {current.sub} · {current.area}
            {current.km != null ? ` · ${distLabel(current.km)}` : ""}
          </small>
        </span>
        <span className="hl-pmap__go">
          <Icon name="arrowRight" size={16} stroke={2.4} />
        </span>
      </Link>
    </div>
  );
}

export function PlaceBrowser({
  city,
  restaurants,
  masjids,
  areas,
  mode,
  initialKind,
  initialArea = "",
  initialNear = false,
  query = "",
}: {
  city: { slug: string; name: string };
  restaurants: PlaceCard[];
  masjids: PlaceCard[];
  areas: string[];
  mode: "home" | "list";
  initialKind: Kind;
  initialArea?: string;
  initialNear?: boolean;
  query?: string;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [area, setArea] = useState(initialArea);
  const [women, setWomen] = useState(false);
  const [sort, setSort] = useState<"near" | "az">("near");
  const [map, setMap] = useState(false);
  const [pos, setPos] = useState<Coords | null>(null);
  const [loc, setLoc] = useState<"idle" | "asking" | "denied" | "hidden">("idle");

  const ask = () => {
    if (!("geolocation" in navigator)) {
      setLoc("denied");
      return;
    }
    setLoc("asking");
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPos([result.coords.latitude, result.coords.longitude]);
        setLoc("hidden");
      },
      () => setLoc("denied"),
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    if (initialNear) ask();
    // Run once: the locator link asks for location straight away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const source = kind === "restaurants" ? restaurants : masjids;
  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = source
      .filter((place) => !area || place.area === area)
      .filter((place) => !women || kind !== "masjids" || place.women)
      .filter((place) => !q || `${place.name} ${place.sub} ${place.area}`.toLowerCase().includes(q))
      .map((place) => ({
        ...place,
        href: `/${city.slug}/${place.kind}/${encodeURIComponent(place.slug)}`,
        km: pos && place.lat != null && place.lng != null ? km(pos, place.lat, place.lng) : null,
      }));
    if (sort === "az" || !pos) return sort === "az" ? list.sort((a, b) => a.name.localeCompare(b.name)) : list;
    return list.sort((a, b) => (a.km ?? 1e9) - (b.km ?? 1e9));
  }, [source, area, women, kind, query, pos, sort, city.slug]);

  const shown = mode === "home" ? rows.slice(0, 6) : rows;
  const label = kind === "restaurants" ? (rows.length === 1 ? "restaurant" : "restaurants") : rows.length === 1 ? "masjid" : "masjids";
  const filtered = Boolean(area || women || query);
  const clear = () => {
    setArea("");
    setWomen(false);
  };

  const locAsk =
    loc === "idle" || loc === "asking" || loc === "denied" ? (
      <div className="hl-locask">
        <span className="hl-locask__ic">
          <Icon name="pin" size={18} stroke={2.1} />
        </span>
        <span className="hl-locask__t">
          <b>{loc === "denied" ? "Location is off" : kind === "masjids" ? "Find the closest masjid" : "Show places near you"}</b>
          <small>{loc === "denied" ? "Allow location in your browser settings to sort by distance." : "Sorts this list by distance. We only use it on your phone."}</small>
        </span>
        {loc !== "denied" ? (
          <button type="button" className="hl-locask__go" onClick={ask} disabled={loc === "asking"}>
            {loc === "asking" ? "Finding…" : "Allow"}
          </button>
        ) : null}
        <button type="button" className="hl-locask__x" aria-label="Not now" title="Not now" onClick={() => setLoc("hidden")}>
          <Icon name="close" size={16} stroke={2.4} />
        </button>
      </div>
    ) : pos ? (
      <div className="hl-sorted">
        <i />
        Sorted by distance from you
        <button type="button" onClick={() => setPos(null)}>
          Reset
        </button>
      </div>
    ) : null;

  const areaSelect = (
    <label className="hl-chip hl-areac">
      <Icon name="pin" size={16} />
      <span className="hl-chip-k">Area</span>
      <select aria-label="Area" value={area} onChange={(event) => setArea(event.target.value)}>
        <option value="">All of {city.name}</option>
        {areas.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={14} stroke={2.6} className="hl-chip__chev" />
    </label>
  );

  const womenToggle =
    kind === "masjids" ? (
      <button type="button" className="hl-ftog" role="switch" aria-checked={women} onClick={() => setWomen((value) => !value)}>
        Women's area
        <span className="hl-ftog__trk">
          <span />
        </span>
      </button>
    ) : null;

  const mapButton = (
    <button type="button" className={`hl-mapbtn${map ? " is-on" : ""}`} aria-label={map ? "Hide map" : "Show map"} aria-pressed={map} onClick={() => setMap((value) => !value)}>
      <Icon name="map" size={15} stroke={2.1} />
      <span className="hl-mapbtn__label">{map ? "Hide map" : "Show map"}</span>
    </button>
  );

  if (mode === "home") {
    return (
      <div className="hl-near">
        <div className="hl-near__head">
          <h2 className="hl-h2 hl-ul">Near you in {city.name}</h2>
          <SegTabs
            role="tablist"
            label="Show"
            value={kind}
            onChange={setKind}
            options={[
              { value: "restaurants", label: "Restaurants" },
              {
                value: "masjids",
                label: (
                  <>
                    <span className="hl-only-mob-i">Masjids</span>
                    <span className="hl-only-desk-i">Masjids &amp; prayer halls</span>
                  </>
                ),
              },
            ]}
          />
          <div className="hl-near__acts">
            <Link className="hl-btn-brand hl-btn-sm" href={`/${city.slug}/${kind}`}>
              See all
              <Icon name="arrowRight" size={14} stroke={2.4} />
            </Link>
            {mapButton}
          </div>
        </div>
        <div className="hl-frow hl-frow--home">
          {areaSelect}
          {womenToggle}
          <span className="hl-frow__count">
            {rows.length} {label} in {area || city.name}
          </span>
          {filtered ? (
            <button type="button" className="hl-clear" onClick={clear}>
              Clear filters
            </button>
          ) : null}
          <span className="hl-frow__map">{mapButton}</span>
        </div>
        {kind === "masjids" ? (
          <button type="button" className="hl-locate" onClick={openLocator}>
            <span className="hl-radar" aria-hidden="true">
              <i />
              <b />
            </span>
            Locate nearest masjid
          </button>
        ) : null}
        {map ? <PlacesMap rows={rows} kind={kind} cityName={city.name} /> : null}
        {kind === "restaurants" ? locAsk : loc === "denied" ? locAsk : pos ? locAsk : null}
        <div className="hl-near__rows">
          {shown.map((place) => (
            <PlaceRow key={place.slug} place={place} />
          ))}
        </div>
        <div className="hl-near__tiles">
          {rows.slice(0, 4).map((place) => (
            <PlaceTile key={place.slug} place={place} variant="near" />
          ))}
        </div>
        {!rows.length ? (
          <div className="hl-empty">
            No {label} match these filters yet.{" "}
            <button type="button" className="hl-clear" onClick={clear}>
              Clear filters
            </button>
          </div>
        ) : null}
        <Link className="hl-seeall" href={`/${city.slug}/${kind}`}>
          See all
          <Icon name="arrowRight" size={15} stroke={2.4} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hl-filterbar">
        <div className="hl-frow">
          {areaSelect}
          {womenToggle}
          <span className="hl-frow__grow" />
          <label className="hl-chip hl-sortc">
            <Icon name="sort" size={18} className="hl-sort-ic" />
            <span className="hl-chip-k">Sort</span>
            <select
              aria-label="Sort by"
              value={sort}
              onChange={(event) => {
                const value = event.target.value as "near" | "az";
                setSort(value);
                if (value === "near" && !pos) ask();
              }}
            >
              <option value="near">Nearest first</option>
              <option value="az">A to Z</option>
            </select>
            <Icon name="chevronDown" size={14} stroke={2.6} className="hl-chip__chev" />
          </label>
        </div>
      </div>
      <div className="hl-listbody">
        <div className="hl-listbody__count">
          <span>
            {rows.length} {label} in {area || city.name}
            {query ? ` matching “${query}”` : ""}
          </span>
          {filtered ? (
            <Link className="hl-clear" href={`/${city.slug}/${kind}`} onClick={(event) => (query ? undefined : (event.preventDefault(), clear()))}>
              Clear all
            </Link>
          ) : null}
        </div>
        {pos ? locAsk : null}
        <div className="hl-tiles">
          {rows.map((place) => (
            <PlaceTile key={place.slug} place={place} variant="list" />
          ))}
          {!rows.length ? (
            <div className="hl-empty">
              No {label} match that yet.{" "}
              <Link className="hl-clear" href={`/${city.slug}/${kind}`}>
                Clear filters
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
