import type { CityTheme } from "@/lib/cities";
import type { PrayerHall, Restaurant } from "@/lib/types";

function artKind(seed: string): number {
  return [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
}

export function CardArt({ seed, image, label }: { seed: string; image?: string | null; label: string }) {
  if (image) {
    return (
      <div className="hl-card-art">
        <img src={image} alt="" />
      </div>
    );
  }
  const kind = artKind(seed);
  return (
    <div className="hl-card-art" style={{ background: kind === 3 ? "#12343a" : "var(--tint)" }} aria-hidden="true">
      <svg viewBox="0 0 400 180" role="img">
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
    </div>
  );
}

export function RestaurantCard({ place, city }: { place: Restaurant; city: CityTheme }) {
  return (
    <a className="hl-card" href={`/${city.slug}/restaurants/${place.slug}`}>
      <div style={{ position: "relative" }}>
        <CardArt seed={place.slug} image={place.hero_image} label={place.name} />
        <span className="hl-badge left">{place.certification.includes("HMC") ? "HMC certified" : place.certification.includes("Vegetarian") ? "Vegetarian" : "Self-certified"}</span>
        {place.distanceKm != null ? <span className="hl-badge right">{place.distanceKm.toFixed(1)} km</span> : null}
      </div>
      <div className="hl-card-body">
        <strong>{place.name}</strong>
        <span className="hl-meta">{place.cuisine} · {place.neighborhood}</span>
        <span className="hl-meta">{place.price_range}{place.review_count > 0 ? ` · ${place.rating.toFixed(1)}` : ""}{place.is_open ? " · Listed as open" : ""}</span>
      </div>
    </a>
  );
}

export function MasjidCard({ place, city }: { place: PrayerHall; city: CityTheme }) {
  return (
    <a className="hl-card" href={`/${city.slug}/masjids/${place.slug}`}>
      <div style={{ position: "relative" }}>
        <CardArt seed={place.slug} label={place.name} />
        <span className="hl-badge left">{place.madhab}</span>
        {place.distanceKm != null ? <span className="hl-badge right">{place.distanceKm.toFixed(1)} km</span> : null}
      </div>
      <div className="hl-card-body">
        <strong>{place.name}</strong>
        <span className="hl-meta">{place.nick ? `${place.nick} · ` : ""}{place.neighborhood}</span>
        <span className="hl-meta">Jumu'ah {place.jummah_time}{place.capacity > 0 ? ` · ${place.capacity.toLocaleString("en-IN")} people` : ""}</span>
      </div>
    </a>
  );
}
