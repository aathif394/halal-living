"use client";

import { usePathname } from "next/navigation";

export type Section = "home" | "restaurants" | "masjids";

/** Which part of the site the current URL is in: /chennai, /chennai/restaurants, /chennai/masjids/<slug>… */
export function useRouteState(): { section: Section | null; detail: boolean } {
  const parts = (usePathname() ?? "/").split("/").filter(Boolean);
  const kind = parts[1] === "restaurants" || parts[1] === "masjids" ? parts[1] : null;
  return {
    section: parts.length === 1 ? "home" : kind,
    detail: Boolean(kind && parts.length === 3),
  };
}
