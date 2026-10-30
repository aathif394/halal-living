import { STORE_URL, type CityTheme } from "@/lib/cities";
import type { Featured } from "@/lib/types";
import type { PlaceCard, ReelSlide } from "@/lib/view";
import { Landmark, StarPattern } from "./brand";
import { COMMUNITY } from "./chrome";
import { AdvertiseButton, HeroWord, ReelsStrip, SuggestForm, SuggestSheetButton, TypingSearch } from "./home-client";
import { Icon } from "./icons";
import { InstallCard } from "./install";
import { PlaceBrowser } from "./place-browser";

const PRODUCTS: [string, string, string, string][] = [
  ["Ajwa dates, 500 g", "Pantry", "₹899", "Bestseller"],
  ["Travel prayer mat", "Prayer", "₹749", ""],
  ["Oud attar, 6 ml", "Fragrance", "₹1,250", "New"],
  ["HLC Cookbook, Vol. 1", "Books", "₹599", ""],
  ["Kids Arabic flashcards", "Kids", "₹399", ""],
];
const PRODUCT_BG = ["#F6E6CF", "#0F4C5C", "#F3E8DA", "#F6EEE6", "#F6F6F4"];

const HERO_WORDS = ["food", "kebabs", "biryani", "burgers", "pizza", "eats"];

function Community() {
  return (
    <div className="hl-comm-list">
      {COMMUNITY.map((item) => (
        <a key={item.name} className="hl-comm hl-glass" href={item.url} target="_blank" rel="noopener noreferrer">
          <span className="hl-mono">
            <img src={item.logo} alt="" />
          </span>
          <span className="hl-comm__t">
            <span className="hl-comm__n">{item.name}</span>
            <span className="hl-comm__s">{item.short}</span>
          </span>
          <span className="hl-arr">
            <Icon name="arrowUpRight" size={13} stroke={2.6} />
          </span>
        </a>
      ))}
    </div>
  );
}

function Sponsored({ featured, city }: { featured: Featured[]; city: CityTheme }) {
  const lead = featured[0];
  if (!lead) return null;
  const href = lead.restaurant_slug ? `/${lead.restaurant_city ?? city.slug}/restaurants/${lead.restaurant_slug}` : `/${city.slug}/restaurants`;
  return (
    <div className="hl-wrap hl-sec-sm">
      <a className="hl-ad" href={href}>
        <span className="hl-ad__art" aria-hidden="true">
          <img src="/art/food-1.svg" alt="" />
        </span>
        <span className="hl-ad__t">
          <span className="hl-ad__k">{lead.sponsor_label || "Sponsored"}</span>
          <b>{lead.name}</b>
          <span className="hl-ad__p">{lead.pitch}</span>
        </span>
        <span className="hl-ad__cta">
          {lead.cta}
          <Icon name="arrowRight" size={14} stroke={2.6} />
        </span>
      </a>
    </div>
  );
}

export function CityHome({
  city,
  restaurants,
  masjids,
  areas,
  featured,
  reels,
}: {
  city: CityTheme;
  restaurants: PlaceCard[];
  masjids: PlaceCard[];
  areas: string[];
  featured: Featured[];
  reels: ReelSlide[];
}) {
  const examples = [
    `Mutton biryani in ${areas[0] ?? city.areas[0]}`,
    "Kebabs open after Isha",
    `Family seating in ${areas[1] ?? city.areas[1]}`,
    `Haleem near ${areas[2] ?? city.areas[2]}`,
    "Chai and bun maska",
  ];
  return (
    <>
      <section className="hl-hero">
        <StarPattern />
        <Landmark city={city} size={460} className="hl-hero__lm" />
        <svg className="hl-hero__bob hl-only-desk" width="62" height="62" viewBox="0 0 60 60" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 28 H50 M12 28 Q12 52 30 52 Q48 52 48 28 M16 28 Q30 18 44 28 M22 20 q3 -5 0 -10 M30 18 q3 -5 0 -10 M38 20 q3 -5 0 -10" />
        </svg>
        <div className="hl-hero__grid">
          <div className="hl-hero__main">
            <h1 className="hl-hero__h" aria-label={`Halal food and masjids in ${city.name}`}>
              <span className="hl-hw">Halal</span> <HeroWord words={HERO_WORDS} /> <span className="hl-hw">&amp;</span> <span className="hl-hw">masjids</span>{" "}
              <span className="hl-hw">in</span> <span className="hl-hw hl-hw--city">{city.name}</span>
            </h1>
            <TypingSearch action={`/${city.slug}/restaurants`} examples={examples} label={`Search halal places in ${city.name}`} />
          </div>
          <div className="hl-hero__side">
            <h2 className="hl-kicker">MORE FROM OUR COMMUNITY</h2>
            <Community />
            <div className="hl-only-mob">
              <InstallCard />
            </div>
          </div>
        </div>
      </section>

      <Sponsored featured={featured} city={city} />

      <section className="hl-wrap hl-sec" aria-label={`Near you in ${city.name}`}>
        <PlaceBrowser city={{ slug: city.slug, name: city.name }} restaurants={restaurants} masjids={masjids} areas={areas} mode="home" initialKind="restaurants" />
      </section>

      <section className="hl-stats" aria-labelledby="stats-h">
        <div className="hl-wrap">
          <h2 id="stats-h" className="hl-h2">
            Halal Living in {city.name}
          </h2>
          <div className="hl-stats__grid">
            <div className="hl-stat hl-stat--big">
              <span className="hl-live">
                <i />
                Live
              </span>
              <b>{restaurants.length + masjids.length}</b>
              <span>places checked by the community</span>
            </div>
            <a className="hl-stat" href={`/${city.slug}/restaurants`}>
              <span className="hl-stat__top">
                <span className="hl-stat__ic">
                  <Icon name="food" size={18} stroke={2} />
                </span>
                <span className="hl-stat__go">
                  <Icon name="arrowRight" size={14} stroke={2.6} />
                </span>
              </span>
              <b>{restaurants.length}</b>
              <span>halal restaurants</span>
            </a>
            <a className="hl-stat" href={`/${city.slug}/masjids`}>
              <span className="hl-stat__top">
                <span className="hl-stat__ic hl-stat__ic--gold">
                  <Icon name="masjidWide" size={18} stroke={2} />
                </span>
                <span className="hl-stat__go">
                  <Icon name="arrowRight" size={14} stroke={2.6} />
                </span>
              </span>
              <b className="hl-gold">{masjids.length}</b>
              <span>masjids &amp; prayer halls</span>
            </a>
          </div>
        </div>
      </section>

      <section className="hl-store" aria-labelledby="store-h">
        <div className="hl-wrap hl-store__grid">
          <div className="hl-store__intro">
            <div className="hl-store__k">HALAL LIVING STORE</div>
            <h2 id="store-h">Shop from Muslim-owned businesses</h2>
            <div className="hl-store__perks">
              <span>
                <i>
                  <Icon name="box" size={14} stroke={2.2} />
                </i>
                100+ Muslim-owned brands
              </span>
              <span>
                <i>
                  <Icon name="sparkle" size={14} stroke={2.2} />
                </i>
                Picked by the Halal Living team
              </span>
            </div>
            <a className="hl-store__cta hl-only-desk" href={STORE_URL} target="_blank" rel="noopener noreferrer">
              Shop the store
              <Icon name="arrowUpRight" size={13} stroke={2.6} />
            </a>
          </div>
          <div className="hl-store__cards">
            {PRODUCTS.map(([name, cat, price], i) => (
              <a key={name} className={`hl-prod${i === 0 ? " hl-prod--big" : ""}`} href={STORE_URL} target="_blank" rel="noopener noreferrer" aria-label={`${name}, ${price}`}>
                <span className="hl-prod__img" style={{ background: PRODUCT_BG[i] }}>
                  <img src={`/art/product-${i}.svg`} alt="" loading="lazy" />
                </span>
                <span className="hl-prod__t">
                  <span className="hl-prod__n">{i === 0 ? name : name}</span>
                  <b>{price}</b>
                  <span className="hl-prod__c">{cat}</span>
                </span>
                {i === 0 ? (
                  <span className="hl-prod__go">
                    Shop now
                    <Icon name="arrowUpRight" size={12} stroke={2.6} />
                  </span>
                ) : null}
              </a>
            ))}
          </div>
          <a className="hl-store__cta hl-store__cta--block hl-only-mob" href={STORE_URL} target="_blank" rel="noopener noreferrer">
            Shop the store
            <Icon name="arrowUpRight" size={13} stroke={2.6} />
          </a>
        </div>
      </section>

      <section id="advertise" className="hl-wrap hl-sec" aria-labelledby="ad-h2">
        <div className="hl-adv">
          <div>
            <div className="hl-adv__k">ADVERTISE WITH US</div>
            <h2 id="ad-h2">Reach people looking for halal places in {city.name}</h2>
            <p>Put your restaurant, shop or service in front of people looking for halal places near them.</p>
          </div>
          <AdvertiseButton city={city.slug} cityName={city.name} />
        </div>
      </section>

      {reels.length ? <ReelsStrip reels={reels} /> : null}

      <section id="suggest" className="hl-wrap hl-sec" aria-labelledby="sg-h">
        <div className="hl-sg">
          <StarPattern />
          <div className="hl-sg__intro">
            <h2 id="sg-h" className="hl-sg__h">
              Know a
              <br />
              <span>chai stall</span>
              <br />
              we haven't found?
            </h2>
            <details className="hl-halal">
              <summary aria-label="What we consider as halal. Tap to read">
                <Icon name="info" size={16} stroke={2.2} />
                What we consider as halal
                <Icon name="chevronDown" size={12} stroke={3} className="hl-halal-chev" />
              </summary>
              <div role="note">
                We only cover places where we have personally verified that only Zabiha sourced meat is used. This sometimes excludes restaurants serving sausages, momos, frozen meat, unless we can source their
                actual zabiha process.
              </div>
            </details>
            <ol className="hl-sg__steps">
              <li>
                <b>You tell us</b>
                <span>The name, the area and why you rate it.</span>
              </li>
              <li>
                <b>We go and check</b>
                <span>A local volunteer visits within a week.</span>
              </li>
              <li>
                <b>It goes live</b>
                <span>Listed with a badge that says what we found.</span>
              </li>
            </ol>
            <div className="hl-only-mob">
              <SuggestSheetButton city={city.slug} areas={areas} />
            </div>
          </div>
          <div className="hl-sg__card hl-only-desk">
            <SuggestForm city={city.slug} areas={areas} />
          </div>
        </div>
      </section>
    </>
  );
}
