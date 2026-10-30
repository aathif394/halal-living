import { Frame } from "@/components/chrome";
import { countPlaces } from "@/lib/data";
import { cityOr404 } from "@/lib/load";

// The frame (top bar, bottom bar, footer, overlays) lives here so it stays mounted while pages change:
// the tab indicators slide and nothing reloads.
export default async function CityLayout({ children, params }: { children: React.ReactNode; params: Promise<{ city: string }> }) {
  const city = cityOr404((await params).city);
  const counts = await countPlaces(city.slug).catch(() => null);
  return (
    <Frame city={city} counts={counts}>
      {children}
    </Frame>
  );
}
