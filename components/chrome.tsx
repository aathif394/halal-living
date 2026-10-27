import { CITIES, STORE_URL, type CityTheme } from "@/lib/cities";
import { CitySwitcher } from "./city-switcher";

export function Nav({ city, current }: { city: CityTheme; current?: "restaurants" | "masjids" }) {
  return (
    <div className="hl-nav">
      <a className="hl-brand" href={`/${city.slug}`}>
        <span className="hl-mark" aria-hidden="true">
          <img src="/store-logo.svg" alt="" width="46" height="46" />
        </span>
        Halal Living
      </a>
      <CitySwitcher city={city} />
      <div className="hl-nav-tabs">
        <a className="hl-pill" href={`/${city.slug}/restaurants`} aria-current={current === "restaurants" ? "page" : undefined}>
          Restaurants
        </a>
        <a className="hl-pill" href={`/${city.slug}/masjids`} aria-current={current === "masjids" ? "page" : undefined}>
          Masjids
        </a>
      </div>
      <a className="hl-store" href={STORE_URL} target="_blank" rel="noopener noreferrer">
        Store
      </a>
    </div>
  );
}

export function Footer({ city }: { city?: CityTheme }) {
  return (
    <footer className="hl-footer">
      <div className="hl-footer-grid">
        <div>
          <a className="hl-brand" href={city ? `/${city.slug}` : "/chennai"}>
            <span className="hl-mark"><img src="/store-logo.svg" alt="" width="46" height="46" /></span>
            Halal Living
          </a>
          <p>Halal restaurants and masjids in four cities, checked by people who live there.</p>
        </div>
        <div>
          <h2>CITIES</h2>
          {CITIES.map((item) => (
            <a key={item.slug} href={`/${item.slug}`}>{item.name}</a>
          ))}
        </div>
        <div>
          <h2>COMMUNITY</h2>
          <a href="/how-we-verify">How we verify</a>
          <a href="/suggest">Suggest a place</a>
          <a href="/advertise">Advertise with us</a>
          <a href={STORE_URL} target="_blank" rel="noopener noreferrer">Shop the store</a>
          <a href="/llms.txt">llms.txt</a>
        </div>
      </div>
      <p className="hl-copy">© {new Date().getFullYear()} Halal Living Collective</p>
    </footer>
  );
}

export function Frame({
  city,
  current,
  children,
}: {
  city: CityTheme;
  current?: "restaurants" | "masjids";
  children: React.ReactNode;
}) {
  return (
    <div data-city={city.slug}>
      <a className="hl-skip" href="#content">Skip to content</a>
      <header className="hl-bar">
        <div className="hl-pattern" />
        <Nav city={city} current={current} />
      </header>
      <main id="content">{children}</main>
      <Footer city={city} />
    </div>
  );
}
