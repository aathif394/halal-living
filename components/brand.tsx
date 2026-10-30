import type { CityTheme } from "@/lib/cities";
import type { Trust } from "@/lib/view";

// Scalloped badge outline from the mockup's "Halal Living Verified" seal (120 x 120 box).
const SCALLOP =
  "M112.50 60.00Q122.10 68.18 110.71 73.59Q117.87 83.97 105.47 86.25Q109.70 98.13 97.12 97.12Q98.13 109.70 86.25 105.47Q83.97 117.87 73.59 110.71Q68.18 122.10 60.00 112.50Q51.82 122.10 46.41 110.71Q36.03 117.87 33.75 105.47Q21.87 109.70 22.88 97.12Q10.30 98.13 14.53 86.25Q2.13 83.97 9.29 73.59Q-2.10 68.18 7.50 60.00Q-2.10 51.82 9.29 46.41Q2.13 36.03 14.53 33.75Q10.30 21.87 22.88 22.88Q21.87 10.30 33.75 14.53Q36.03 2.13 46.41 9.29Q51.82 -2.10 60.00 7.50Q68.18 -2.10 73.59 9.29Q83.97 2.13 86.25 14.53Q98.13 10.30 97.12 22.88Q109.70 21.87 105.47 33.75Q117.87 36.03 110.71 46.41Q122.10 51.82 112.50 60.00Z";

const SEAL_ICON: Record<Trust["key"], string> = {
  verified: "M50 60.5l7 7L71 53",
  owner: "M60 50v.5M60 58v14",
  reported: "M52 50h16M52 60h16M52 70h10",
};

const RING: Record<Trust["key"], { text: string; length: number }> = {
  verified: { text: "HALAL LIVING VERIFIED", length: 188 },
  owner: { text: "OWNER ATTESTED · HALAL LIVING · ", length: 218.9 },
  reported: { text: "COMMUNITY REPORTED · HALAL LIVING · · ", length: 218.9 },
};

/** Desktop seal: scalloped badge with ring text that slowly spins. */
export function VerifiedSeal({ trust, size = 132 }: { trust: Trust; size?: number }) {
  const ring = RING[trust.key];
  const id = `hl-seal-ring-${trust.key}`;
  return (
    <div className="hl-seal" role="img" aria-label={trust.label} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
        <path d={SCALLOP} fill="#fff" />
        <circle cx="60" cy="60" r="48.5" fill="none" stroke={trust.color} strokeWidth="1.2" strokeDasharray="1.5 2.5" opacity=".7" />
        <circle cx="60" cy="60" r="25" fill={trust.color} />
        <path d={SEAL_ICON[trust.key]} fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <path id={id} d="M60 60 m-35 0 a35 35 0 1 1 70 0 a35 35 0 1 1 -70 0" />
        </defs>
        <g className="hl-seal__ring">
          <text className="hl-seal__text" style={{ fill: trust.color }}>
            <textPath href={`#${id}`} startOffset="0" textLength={ring.length} lengthAdjust="spacing">
              {ring.text}
            </textPath>
          </text>
          {trust.key === "verified" ? (
            // A small star closes the ring, drawn as a shape so it is not an emoji glyph.
            <g transform="translate(60 60) rotate(-27) translate(-35 0)">
              <path d="M0 -4.2 1.2 -1.3 4.2 -1.3 1.8 0.5 2.7 3.4 0 1.7 -2.7 3.4 -1.8 0.5 -4.2 -1.3 -1.2 -1.3Z" fill={trust.color} />
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  );
}

/** Mobile seal: compact pill with a small scalloped badge. */
export function SealPill({ trust }: { trust: Trust }) {
  return (
    <span className="hl-seal-pill" aria-label={trust.label} style={{ background: trust.tint, color: trust.color }}>
      <svg width="28" height="28" viewBox="0 0 120 120" aria-hidden="true">
        <path d={SCALLOP} fill={trust.color} />
        <path d={SEAL_ICON[trust.key]} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hl-seal-pill__txt">
        <span className="hl-seal-pill__k">HALAL LIVING</span>
        <span>{trust.short}</span>
      </span>
    </span>
  );
}

/** Small trust mark for cards. */
export function TrustDot({ trust }: { trust: Trust }) {
  return (
    <span className="hl-trust-dot" title={trust.label} style={{ background: trust.color }}>
      <svg width="11" height="11" viewBox="40 40 40 40" aria-hidden="true">
        <path d={SEAL_ICON[trust.key]} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function CityLogo({ city, size = 42 }: { city: CityTheme; size?: number }) {
  return (
    <span className="hl-logo" style={{ width: size, height: size }}>
      <img src={`/brand/city-${city.slug}.jpg`} alt="Halal Living" width={size} height={size} />
    </span>
  );
}

export function StarPattern({ opacity = 0.1 }: { opacity?: number }) {
  return <div className="hl-stars-bg" style={{ opacity }} aria-hidden="true" />;
}

export function Landmark({ city, size, className }: { city: CityTheme; size: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth=".6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={city.landmark} />
    </svg>
  );
}

export function themeStyle(city: CityTheme): React.CSSProperties {
  return { "--btn": city.btn, "--tint": city.tint, "--soft": city.soft } as React.CSSProperties;
}
