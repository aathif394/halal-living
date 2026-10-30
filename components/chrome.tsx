import { CITIES, STORE_URL, type CityTheme } from "@/lib/cities";
import { CityLogo, Landmark, StarPattern, themeStyle } from "./brand";
import { BottomNav } from "./bottom-nav";
import { CitySwitcher, CityWipeIn } from "./city-switcher";
import { Icon } from "./icons";
import { InstallLink } from "./install";
import { LaunchLoader } from "./launch";
import { LocatorLink, MasjidLocator } from "./locator";
import { Motion } from "./motion";
import { CityOrBack, FrameRoot, HeaderScroll, NavSwitch } from "./nav-switch";
import { Subscribe } from "./subscribe";

const COMMUNITY = [
  { name: "Living Collective", short: "Grow your network and business", url: "https://livingcollective.net", logo: "/brand/living-collective.jpg" },
  { name: "The Umrah Company", short: "Umrah trips with people who’ve been", url: "https://theumrahcompany.in", logo: "/brand/the-umrah-company.jpg" },
  { name: "Halal Interactions", short: "Matrimony, with family in the loop", url: "https://halalinteractions.in", logo: "/brand/halal-interactions.jpg" },
  { name: "Living Collective Store", short: "Buy from 100+ Muslim owned businesses", url: STORE_URL, logo: "/brand/living-collective-store.png" },
];

export { COMMUNITY };

function StoreLink({ variant }: { variant: "glass" | "solid" }) {
  return (
    <a className={variant === "glass" ? "hl-store-btn hl-shine" : "hl-store-btn hl-store-btn--solid"} href={STORE_URL} target="_blank" rel="noopener noreferrer">
      <Icon name="bag" size={17} />
      Store
      <Icon name="arrowUpRight" size={12} stroke={2.6} />
    </a>
  );
}

/** Desktop top bar: logo, city, Restaurants / Masjids switch, Get the app, Store. */
function DesktopBar({ city }: { city: CityTheme }) {
  return (
    <div className="hl-dbar">
      <a className="hl-dbar__brand" href={`/${city.slug}`}>
        <CityLogo city={city} size={46} />
        <span>Halal Living</span>
      </a>
      <CityOrBack city={city.slug} name={city.name} chooser={<CitySwitcher city={city} variant="pill" />} />
      <nav className="hl-dbar__right" aria-label="Main">
        <NavSwitch city={city.slug} />
        <StoreLink variant="solid" />
      </nav>
    </div>
  );
}

/** Mobile top bar: logo, city name with chooser, Store. */
function MobileBar({ city }: { city: CityTheme }) {
  return (
    <div className="hl-mbar">
      <span className="hl-mbar__left">
        <a href={`/${city.slug}`} aria-label="Halal Living home">
          <CityLogo city={city} size={42} />
        </a>
        <CitySwitcher city={city} variant="title" />
      </span>
      <StoreLink variant="glass" />
    </div>
  );
}

export function TopBar({ city }: { city: CityTheme }) {
  return (
    <header className="hl-topbar">
      <HeaderScroll />
      <DesktopBar city={city} />
      <MobileBar city={city} />
    </header>
  );
}

export function Footer({ city, counts }: { city: CityTheme; counts?: { restaurants: number; masjids: number } | null }) {
  return (
    <footer className="hl-footer" data-rv="">
      <div className="hl-footer__glow" aria-hidden="true" />
      <div className="hl-wrap">
        <div className="hl-footer__cta">
          <a className="hl-fcta hl-fcta--brand" href={`/${city.slug}/restaurants`}>
            <span className="hl-fcta__ic">
              <Icon name="food" size={24} stroke={2} />
            </span>
            <span className="hl-fcta__t">
              <b>Find halal food</b>
              <span>{counts ? `${counts.restaurants} restaurants in ${city.name}` : `Restaurants in ${city.name}`}</span>
            </span>
            <span className="hl-fgo">
              <Icon name="arrowRight" size={18} stroke={2.4} />
            </span>
          </a>
          <a className="hl-fcta" href={`/${city.slug}/masjids`}>
            <span className="hl-fcta__ic hl-fcta__ic--gold">
              <Icon name="masjidWide" size={24} stroke={2} />
            </span>
            <span className="hl-fcta__t">
              <b>Find a masjid</b>
              <span>{counts ? `${counts.masjids} masjids & prayer halls` : "Masjids & prayer halls"}</span>
            </span>
            <span className="hl-fgo">
              <Icon name="arrowRight" size={18} stroke={2.4} />
            </span>
          </a>
        </div>
        <div className="hl-footer__grid">
          <div className="hl-footer__about">
            <CityLogo city={city} size={48} />
            <p>Halal restaurants and masjids in four cities, checked by people who live there.</p>
            <div className="hl-footer__social">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Icon name="instagram" size={18} stroke={2} />
              </a>
              <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Icon name="youtube" size={18} stroke={2} />
              </a>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <Icon name="whatsapp" size={18} stroke={2} />
              </a>
            </div>
          </div>
          <div>
            <h2>EXPLORE</h2>
            <a className="hl-flink" href={`/${city.slug}/restaurants`}>Restaurants</a>
            <a className="hl-flink" href={`/${city.slug}/masjids`}>Masjids</a>
            <LocatorLink className="hl-flink" city={city.slug}>
              Closest masjid
            </LocatorLink>
            <a className="hl-flink" href={`/${city.slug}#suggest`}>Suggest a place</a>
            <InstallLink className="hl-flink" />
          </div>
          <div>
            <h2>COMMUNITY</h2>
            {COMMUNITY.map((item) => (
              <a key={item.name} className="hl-flink hl-flink--logo" href={item.url} target="_blank" rel="noopener noreferrer">
                <img src={item.logo} alt="" width="24" height="24" />
                {item.name}
              </a>
            ))}
          </div>
          <div>
            <h2>ABOUT</h2>
            <a className="hl-flink" href="/how-we-verify">How we verify</a>
            <a className="hl-flink" href={`/${city.slug}#advertise`}>Advertise with us</a>
          </div>
          <div>
            <h2>CITIES</h2>
            {CITIES.map((item) => (
              <a key={item.slug} className="hl-flink hl-flink--city" href={`/${item.slug}`} aria-current={item.slug === city.slug ? "page" : undefined}>
                <i style={{ background: item.btn }} />
                {item.name}
              </a>
            ))}
          </div>
        </div>
        <div className="hl-footer__base">
          <span>© {new Date().getFullYear()} Halal Living Collective</span>
          <a className="hl-top" href="#top">
            Back to top
            <Icon name="arrowUp" size={14} stroke={2.6} />
          </a>
        </div>
      </div>
      <div className="hl-wordmark" aria-hidden="true">
        <svg viewBox="0 4 1000 225" width="100%">
          <text x="10" y="200" textLength="980" lengthAdjust="spacingAndGlyphs">
            Halal Living
          </text>
        </svg>
      </div>
    </footer>
  );
}

/**
 * Page frame: theme colours, top bar, footer, mobile bottom bar and the site-wide overlays.
 * Used by the [city] layout, so it stays mounted while pages change and its indicators can slide.
 */
export function Frame({ city, counts, children }: { city: CityTheme; counts?: { restaurants: number; masjids: number } | null; children: React.ReactNode }) {
  return (
    <FrameRoot className="hl-frame" city={city.slug} style={themeStyle(city)}>
      {/* City colours on :root too, so dialogs rendered on <body> (search, install, reels) match the page. */}
      <style>{`:root{--btn:${city.btn};--tint:${city.tint};--soft:${city.soft}}`}</style>
      <LaunchLoader city={city.slug} />
      <Motion />
      <a className="hl-skip" href="#content">
        Skip to content
      </a>
      <div className="hl-band" aria-hidden="true">
        <StarPattern />
        <Landmark city={city} size={210} className="hl-band__lm" />
      </div>
      <TopBar city={city} />
      <main id="content">{children}</main>
      <Footer city={city} counts={counts} />
      <BottomNav city={city} />
      <MasjidLocator city={city.slug} cityName={city.name} />
      <CityWipeIn />
      <Subscribe city={city.slug} />
    </FrameRoot>
  );
}
