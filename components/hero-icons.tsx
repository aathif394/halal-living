const ICONS: { path: string; size: number; style: React.CSSProperties; delay: string }[] = [
  {
    path: "M10 28 H50 M12 28 Q12 52 30 52 Q48 52 48 28 M16 28 Q30 18 44 28 M22 20 q3 -5 0 -10 M30 18 q3 -5 0 -10 M38 20 q3 -5 0 -10",
    size: 62,
    style: { left: "47%", top: 96 },
    delay: "6s ease-in-out 0s",
  },
  {
    path: "M18 18 H42 L38 52 H22 Z M20 28 H40 M26 12 q3 -4 0 -8 M34 12 q3 -4 0 -8",
    size: 50,
    style: { left: "40%", bottom: 40 },
    delay: "7s ease-in-out -2s",
  },
  {
    path: "M8 52 L50 10 M14 40 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M24 30 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M34 20 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0",
    size: 46,
    style: { left: "56%", bottom: 150 },
    delay: "5.5s ease-in-out -1s",
  },
  {
    path: "M30 6 L36 24 L54 30 L36 36 L30 54 L24 36 L6 30 L24 24 Z",
    size: 26,
    style: { left: "30%", top: 70 },
    delay: "4s ease-in-out -3s",
  },
  {
    path: "M12 52 H48 M16 52 V38 Q30 14 44 38 V52 M30 24 V14 M33 9 a4 4 0 1 1 -4 -4 a3 3 0 1 0 4 4 M26 52 V44 Q30 38 34 44 V52",
    size: 40,
    style: { left: "44%", top: 210 },
    delay: "6.5s ease-in-out -1.5s",
  },
  {
    path: "M30 6 L36 24 L54 30 L36 36 L30 54 L24 36 L6 30 L24 24 Z",
    size: 18,
    style: { left: "60%", top: 300 },
    delay: "4.5s ease-in-out -2s",
  },
];

export function HeroIcons() {
  return (
    <>
      {ICONS.map((icon, index) => (
        <svg
          key={index}
          className="hl-hero-icon"
          width={icon.size}
          height={icon.size}
          viewBox="0 0 60 60"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ ...icon.style, animationDuration: icon.delay.split(" ")[0], animationDelay: icon.delay.split(" ").slice(2).join(" ") }}
        >
          <path d={icon.path} />
        </svg>
      ))}
    </>
  );
}
