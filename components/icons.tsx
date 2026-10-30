import type { CSSProperties } from "react";

// Stroke icons drawn on a 24px grid, taken from the mockup. Use these instead of emoji or text arrows.
const PATHS = {
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  chevronDown: "m6 9 6 6 6-6",
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "m9 18 6-6-6-6",
  bag: "M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0",
  arrowUpRight: "M7 17 17 7M8 7h9v9",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  arrowDown: "M12 5v14M5 12l7 7 7-7",
  arrowUp: "M12 19V5M5 12l7-7 7 7",
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  food: "M4 13h16a8 8 0 0 1-16 0zM3 13h18M9 9c0-1 1-1.5 1-2.5S9 5 9 4M14 9c0-1 1-1.5 1-2.5S14 5 14 4",
  masjid: "M4 21h16M6 21v-7h12v7M7 14c0-3 2.5-5 5-7 2.5 2 5 4 5 7M12 7V4M10 21v-3a2 2 0 0 1 4 0v3",
  masjidWide: "M4 21h16M6 21v-7h12v7M7 14c0-3 2.5-5 5-7 2.5 2 5 4 5 7M12 7V4M3 21V10M21 21V10M10 21v-3a2 2 0 0 1 4 0v3",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14",
  share: "M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  check: "m5 12.5 4.5 4.5L19 7.5",
  close: "M6 6l12 12M18 6 6 18",
  bell: "M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 20a2 2 0 0 0 3.4 0",
  bolt: "M13 3 5 14h6l-1 7 8-11h-6z",
  wifi: "M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01",
  iosShare: "M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1",
  plusSquare: "M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zM12 8v8M8 12h8",
  sort: "M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4",
  parking: "M4 4h16v16H4zM9 16V8h3.5a2.5 2.5 0 0 1 0 5H9",
  women: "M12 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM7 21l2-9h6l2 9M9 12l-2 4M15 12l2 4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M10 15h4",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  star: "m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  sparkle: "M12 3l2.1 6.9L21 12l-6.9 2.1L12 21l-2.1-6.9L3 12l6.9-2.1z",
  box: "M4 7h16v13H4zM4 7l2-4h12l2 4M9 11a3 3 0 0 0 6 0",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  locate: "M12 2v3M12 19v3M2 12h3M19 12h3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01",
  youtube: "M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM10 9v6l5-3z",
  whatsapp: "M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9a5 5 0 0 1-2.3-2.3l.9-1-1-2z",
  volume: "M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
  mute: "M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6",
} as const;

const FILLED = {
  play: "M8 5v14l11-7z",
  pause: "M7 5h4v14H7zM13 5h4v14h-4z",
  starFill: "m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z",
} as const;

export type IconName = keyof typeof PATHS | keyof typeof FILLED;

export function Icon({
  name,
  size = 18,
  stroke = 2.2,
  className,
  style,
  title,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const filled = name in FILLED;
  const d = filled ? FILLED[name as keyof typeof FILLED] : PATHS[name as keyof typeof PATHS];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: "none", ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d={d} />
    </svg>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="hl-stars" role="img" aria-label={`${full} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name="starFill" size={size} style={{ color: i < full ? "#F2A20C" : "#E2E2DE" }} />
      ))}
    </span>
  );
}
