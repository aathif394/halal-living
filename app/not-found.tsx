import type { Metadata } from "next";
import { Frame } from "@/components/chrome";
import { Icon } from "@/components/icons";
import { CITIES } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Frame city={CITIES[0]!}>
      <section className="hl-lhero">
        <div className="hl-stars-bg" aria-hidden="true" />
        <div className="hl-wrap hl-lhero__in">
          <p className="hl-kicker">PAGE NOT FOUND</p>
          <h1 className="hl-lhero__h">That page isn’t in the directory</h1>
        </div>
      </section>
      <div className="hl-wrap hl-sec">
        <div className="hl-nf-cities">
          {CITIES.map((city) => (
            <a key={city.slug} href={`/${city.slug}`} style={{ background: city.btn }}>
              {city.name}
              <Icon name="arrowRight" size={18} stroke={2.4} />
            </a>
          ))}
        </div>
      </div>
    </Frame>
  );
}
