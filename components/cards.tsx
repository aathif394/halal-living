import type { CityTheme } from "@/lib/cities";
import type { ShellMasjid, ShellRestaurant } from "@/lib/shell-data";
import { SealBadge } from "./seal-badge";

function artKind(seed: string): number {
  return [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
}

function CardArt({ seed, label }: { seed: string; label: string }) {
  const kind = artKind(seed);
  return (
    <svg viewBox="0 0 400 180" role="img" style={{ width: "100%", height: "100%", display: "block" }}>
      <title>{label}</title>
      {kind === 0 ? (
        <>
          <rect width="400" height="180" fill="#3B1F12" />
          <ellipse cx="200" cy="150" rx="120" ry="18" fill="#000" opacity="0.2" />
          <path d="M80 90 Q80 150 200 150 Q320 150 320 90 Z" fill="#6E2D14" />
          <ellipse cx="200" cy="90" rx="120" ry="22" fill="#E9B44C" />
          <ellipse cx="200" cy="84" rx="100" ry="16" fill="#F2D27A" />
        </>
      ) : null}
      {kind === 1 ? (
        <>
          <rect width="400" height="180" fill="#22140C" />
          <ellipse cx="200" cy="120" rx="150" ry="46" fill="#2E2E2E" />
          <rect x="90" y="70" width="40" height="28" rx="10" fill="#9B3D18" />
          <rect x="150" y="62" width="40" height="28" rx="10" fill="#7A2E12" />
          <rect x="210" y="66" width="40" height="28" rx="10" fill="#C47A3A" />
          <rect x="270" y="74" width="40" height="28" rx="10" fill="#9B3D18" />
        </>
      ) : null}
      {kind === 2 ? (
        <>
          <rect width="400" height="180" fill="#F3E2C7" />
          <rect x="150" y="40" width="100" height="110" rx="16" fill="#fff" />
          <rect x="162" y="58" width="76" height="78" fill="#B5652B" />
          <ellipse cx="200" cy="58" rx="38" ry="8" fill="#D08A4E" />
        </>
      ) : null}
      {kind === 3 ? (
        <>
          <rect width="400" height="180" fill="#12343a" />
          <path d="M70 150 h260 M110 150 V70 h180 v80 M150 150 v-28 a50 40 0 0 1 100 0 v28" fill="none" stroke="#fff" strokeWidth="8" />
          <path d="M200 70 V40" stroke="#fff" strokeWidth="6" />
        </>
      ) : null}
    </svg>
  );
}

export function RestaurantCard({ place, city }: { place: ShellRestaurant; city: CityTheme }) {
  const tier = place.cert ? "certified" : place.trust === "Vegetarian" ? "vegetarian" : "attested";
  return (
    <a className="hl-card" href={`/${city.slug}/restaurants/${place.slug}`}>
      <div style={{ position: "relative", height: 200 }}>
        {place.photo ? (
          <div className="hl-card-photo" style={{ background: place.photo }} />
        ) : (
          <CardArt seed={place.slug} label={place.name} />
        )}
        <span className="hl-dist-badge">{place.dist || place.price}</span>
      </div>
      <div className="hl-card-body">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.name}</strong>
          <SealBadge tier={tier} />
        </div>
        <span className="hl-meta">{place.cuisine} · {place.area}</span>
        <span className="hl-meta">{place.rating !== "–" ? `★ ${place.rating} (${place.reviews})` : "No ratings yet"}</span>
      </div>
    </a>
  );
}

export function MasjidCard({ place, city }: { place: ShellMasjid; city: CityTheme }) {
  return (
    <a className="hl-card" href={`/${city.slug}/masjids/${place.slug}`}>
      <div style={{ position: "relative", height: 180 }}>
        {place.photo ? (
          <div className="hl-card-photo" style={{ background: place.photo }} />
        ) : (
          <CardArt seed={place.slug} label={place.name} />
        )}
        <span className="hl-dist-badge">{place.dist || place.kind}</span>
      </div>
      <div className="hl-card-body">
        <strong>{place.name}</strong>
        <span className="hl-meta">{place.kind} · {place.area}</span>
        <span className="hl-meta">{place.jummah || "Jumu'ah time not listed"}</span>
      </div>
    </a>
  );
}
