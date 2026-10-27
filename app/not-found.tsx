import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { CITIES } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Frame city={CITIES[0]!}>
      <div className="hl-page-main">
        <h1>That page is not in the directory.</h1>
        <p className="hl-prose">Try one of the four cities.</p>
        <div className="hl-chips">
          {CITIES.map((city) => (
            <a className="hl-chip" key={city.slug} href={`/${city.slug}`}>{city.name}</a>
          ))}
        </div>
      </div>
    </Frame>
  );
}
