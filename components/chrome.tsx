import { CITIES, STORE_URL, type CityTheme } from "@/lib/cities";
import { NavChrome } from "./nav-chrome";

export function Footer({ city }: { city?: CityTheme }) {
  return (
    <footer className="hl-footer">
      <div className="hl-footer-grid">
        <div>
          <a className="hl-brand" href={city ? `/${city.slug}` : "/chennai"}>
            <span className="hl-mark"><img src={`/icons/cities/${city?.slug ?? "chennai"}.jpg`} alt="" width="46" height="46" /></span>
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
  children,
}: {
  city: CityTheme;
  children: React.ReactNode;
}) {
  return (
    <div data-city={city.slug}>
      <a className="hl-skip" href="#content">Skip to content</a>
      <NavChrome city={city} />
      <main id="content">{children}</main>
      <Footer city={city} />
    </div>
  );
}
