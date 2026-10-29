"use client";

import { usePathname } from "next/navigation";
import type { CityTheme } from "@/lib/cities";
import { BottomNav } from "./bottom-nav";
import { Header } from "./header";

export function NavChrome({ city }: { city: CityTheme }) {
  const pathname = usePathname();
  const rest = pathname?.slice(`/${city.slug}`.length) ?? "";
  const headerCurrent = rest.startsWith("/restaurants") ? "restaurants" : rest.startsWith("/masjids") ? "masjids" : undefined;
  const bottomCurrent = headerCurrent ?? "home";
  return (
    <>
      <Header city={city} current={headerCurrent} />
      <BottomNav city={city} current={bottomCurrent} />
    </>
  );
}
