import { Icon } from "@/components/icons";
import { CITIES } from "@/lib/cities";

// Inside a city the layout already draws the frame, so this is only the page body.
export default function CityNotFound() {
  return (
    <>
      <section className="hl-lhero">
        <div className="hl-stars-bg" aria-hidden="true" />
        <div className="hl-wrap hl-lhero__in">
          <p className="hl-kicker">PAGE NOT FOUND</p>
          <h1 className="hl-lhero__h">That place isn’t in the directory</h1>
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
    </>
  );
}
