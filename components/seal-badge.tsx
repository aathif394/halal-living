export function SealBadge({ tier }: { tier: "certified" | "vegetarian" | "attested" }) {
  const bg = tier === "attested" ? "#9A6A44" : "#1F6B12";
  const label = tier === "certified" ? "HMC certified" : tier === "vegetarian" ? "Vegetarian kitchen" : "Owner attested";
  return (
    <span className="hl-seal" style={{ background: bg }} title={label} aria-label={label}>
      {tier === "attested" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 12l2 2 4-4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </span>
  );
}
