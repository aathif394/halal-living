"use client";

import { Icon } from "./icons";

/** Handle at the top of the mobile drawer: tap to pull the drawer over the reel, tap again to drop it. */
export function DrawerHandle() {
  return (
    <button
      type="button"
      className="hl-sheet__grab"
      aria-label="Show more details"
      onClick={(event) => {
        const sheet = event.currentTarget.closest("[data-sheet]") as HTMLElement | null;
        if (!sheet) return;
        const top = sheet.getBoundingClientRect().top + window.scrollY;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: window.scrollY + 8 >= top ? 0 : top, behavior: reduce ? "auto" : "smooth" });
      }}
    >
      <span />
    </button>
  );
}

export function CallButton({ phone, className, label = "Call", iconOnly }: { phone: string; className: string; label?: string; iconOnly?: boolean }) {
  if (!phone) return null;
  return (
    <a className={className} href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>
      <Icon name="phone" size={iconOnly ? 20 : 18} />
      {iconOnly ? null : label}
    </a>
  );
}

export function ShareButton({ title, url }: { title: string; url: string }) {
  return (
    <button
      type="button"
      className="hl-share"
      aria-label={`Share ${title}`}
      title="Share"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const href = new URL(url, window.location.href).toString();
        try {
          if (navigator.share) await navigator.share({ title, url: href });
          else await navigator.clipboard.writeText(href);
        } catch {
          // The visitor closed the share sheet.
        }
      }}
    >
      <Icon name="share" size={16} stroke={2.1} />
    </button>
  );
}
