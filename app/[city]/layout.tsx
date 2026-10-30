import { Frame } from "@/components/chrome";
import { cityOr404 } from "@/lib/load";

// The frame (top bar, bottom bar, footer, overlays) lives here so it stays mounted while pages change:
// the tab indicators slide and nothing reloads.
export default async function CityLayout({ children, params }: { children: React.ReactNode; params: Promise<{ city: string }> }) {
  const city = cityOr404((await params).city);
  return <Frame city={city}>{children}</Frame>;
}
