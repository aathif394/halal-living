import { STORE_URL, type CityTheme } from "@/lib/cities";
import type { Featured } from "@/lib/types";
import type { PlaceCard, ReelSlide } from "@/lib/view";
import { StarPattern } from "./brand";
import { COMMUNITY } from "./chrome";
import { AdCarousel, AdvertiseButton, HeroWord, SuggestForm, SuggestSheetButton } from "./home-client";
import { SmartSearch } from "./smart-search";
import { ReelsCarousel } from "./reels";
import { Icon } from "./icons";
import { InstallCard } from "./install";
import { CountUp, HeroParallax } from "./motion";
import { PlaceBrowser } from "./place-browser";

const PRODUCTS: [string, string, string, string][] = [
  ["Ajwa dates, 500 g", "Pantry", "₹899", "Bestseller"],
  ["Travel prayer mat", "Prayer", "₹749", ""],
  ["Oud attar, 6 ml", "Fragrance", "₹1,250", "New"],
  ["HLC Cookbook, Vol. 1", "Books", "₹599", ""],
  ["Kids Arabic flashcards", "Kids", "₹399", ""],
];
const PRODUCT_BG = ["#F6E6CF", "#0F4C5C", "#F3E8DA", "#F6EEE6", "#F6F6F4"];

function countBy(values: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

const HERO_WORDS = ["food", "kebabs", "biryani", "burgers", "pizza", "eats"];

function Community() {
  return (
    <div className="hl-comm-list">
      {COMMUNITY.map((item, i) => (
        <a key={item.name} className="hl-comm hl-glass" href={item.url} target="_blank" rel="noopener noreferrer" style={{ animationDelay: `${500 + i * 110}ms` }}>
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

const AD_BG = ["#2B1710", "#3A1B14", "#12403F", "#1F2A44"];
const AD_ART = ["/art/food-1.svg", "/art/product-0.svg", "/art/product-2.svg", "/art/food-4.svg"];

function Sponsored({ featured, city }: { featured: Featured[]; city: CityTheme }) {
  if (!featured.length) return null;
  const ads = featured.map((ad, i) => ({
    id: ad.id,
    href: ad.restaurant_slug ? `/${ad.restaurant_city ?? city.slug}/restaurants/${ad.restaurant_slug}` : `/${city.slug}/restaurants`,
    label: ad.sponsor_label || "Sponsored",
    name: ad.name,
    pitch: ad.pitch,
    cta: ad.cta,
    art: AD_ART[i % AD_ART.length]!,
    bg: AD_BG[i % AD_BG.length]!,
  }));
  return (
    <div className="hl-wrap hl-sec-sm" data-rv="">
      <AdCarousel ads={ads} />
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
      <HeroParallax className="hl-hero">
        <StarPattern />
        <svg className="hl-hero__lm" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth=".55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={city.landmark} pathLength={1} />
        </svg>
        {/* Floating line icons that drift with the pointer (desktop). */}
        <svg className="hl-bob hl-bob--1 hl-only-desk" width="62" height="62" viewBox="0 0 60 60" aria-hidden="true">
          <path d="M10 28 H50 M12 28 Q12 52 30 52 Q48 52 48 28 M16 28 Q30 18 44 28 M22 20 q3 -5 0 -10 M30 18 q3 -5 0 -10 M38 20 q3 -5 0 -10" />
        </svg>
        <svg className="hl-bob hl-bob--2 hl-only-desk" width="50" height="50" viewBox="0 0 60 60" aria-hidden="true">
          <path d="M18 18 H42 L38 52 H22 Z M20 28 H40 M26 12 q3 -4 0 -8 M34 12 q3 -4 0 -8" />
        </svg>
        <svg className="hl-bob hl-bob--3 hl-only-desk" width="46" height="46" viewBox="0 0 60 60" aria-hidden="true">
          <path d="M8 52 L50 10 M14 40 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M24 30 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M34 20 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0" />
        </svg>
        <div className="hl-hero__grid">
          <div className="hl-hero__main">
            <h1 className="hl-hero__h" aria-label={`Halal food and masjids in ${city.name}`}>
              <span className="hl-hw">Halal</span> <HeroWord words={HERO_WORDS} /> <span className="hl-hw">&amp;</span> <span className="hl-hw">masjids</span>{" "}
              <span className="hl-hw">in</span> <span className="hl-hw hl-hw--city">{city.name}</span>
            </h1>
            <SmartSearch
              city={city.slug}
              cityName={city.name}
              examples={examples}
              places={[
                ...restaurants.map((place) => ({ type: "r" as const, name: place.name, sub: `${place.sub} · ${place.area}`, href: `/${city.slug}/restaurants/${place.slug}` })),
                ...masjids.map((place) => ({ type: "m" as const, name: place.name, sub: `${place.sub} · ${place.area}`, href: `/${city.slug}/masjids/${place.slug}` })),
              ]}
              dishes={countBy(restaurants.flatMap((place) => place.sub.split(/\s*[·—,/]\s*/)).filter(Boolean)).map(([name, count]) => ({ name, count }))}
              areas={countBy([...restaurants, ...masjids].map((place) => place.area).filter(Boolean)).map(([name, count]) => ({ name, count }))}
            />
          </div>
          <div className="hl-hero__side">
            <h2 className="hl-kicker">MORE FROM OUR COMMUNITY</h2>
            <Community />
            <div className="hl-only-mob">
              <InstallCard />
            </div>
          </div>
        </div>
      </HeroParallax>

      <Sponsored featured={featured} city={city} />

      <section className="hl-wrap hl-sec" aria-label={`Near you in ${city.name}`} data-rv="">
        <PlaceBrowser city={{ slug: city.slug, name: city.name }} restaurants={restaurants} masjids={masjids} areas={areas} mode="home" initialKind="restaurants" />
      </section>

      <section className="hl-stats" aria-labelledby="stats-h" data-rv="">
        <div className="hl-wrap">
          <h2 id="stats-h" className="hl-stats__h">
            Halal Living in {city.name}
          </h2>
          <div className="hl-stats__grid">
            <div className="hl-live-card">
              <span className="hl-live-card__c1" aria-hidden="true" />
              <span className="hl-live-card__c2" aria-hidden="true" />
              <span className="hl-live">
                <i />
                Live
              </span>
              <b className="hl-live-card__n">
                <CountUp value={city.monthlyReach} />
              </b>
              <span className="hl-live-card__l">visits this month</span>
            </div>
            <div className="hl-cc-tiles">
              <a className="cc-tile" href={`/${city.slug}/restaurants`}>
                <span className="cc-tile__top">
                  <span className="cc-tile__ic" style={{ color: city.soft, background: `${city.soft}22` }}>
                    <Icon name="food" size={22} stroke={1.8} />
                  </span>
                  <span className="cc-go">
                    <Icon name="arrowRight" size={14} stroke={2.8} />
                  </span>
                </span>
                <span>
                  <b className="cc-tile__n" style={{ color: city.soft }}>
                    <CountUp value={restaurants.length} />
                  </b>
                  <span className="cc-tile__l">halal restaurants</span>
                </span>
              </a>
              <a className="cc-tile" href={`/${city.slug}/masjids`}>
                <span className="cc-tile__top">
                  <span className="cc-tile__ic" style={{ color: "#E2BE62", background: "#E2BE6222" }}>
                    <Icon name="masjidWide" size={22} stroke={1.8} />
                  </span>
                  <span className="cc-go">
                    <Icon name="arrowRight" size={14} stroke={2.8} />
                  </span>
                </span>
                <span>
                  <b className="cc-tile__n" style={{ color: "#E2BE62" }}>
                    <CountUp value={masjids.length} />
                  </b>
                  <span className="cc-tile__l">masjids &amp; prayer halls</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="hl-store" aria-labelledby="store-h" data-rv="">
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

      <section id="advertise" className="hl-wrap hl-sec" aria-labelledby="ad-h2" data-rv="">
        <div className="hl-adv">
          <div>
            <div className="hl-adv__k">ADVERTISE WITH US</div>
            <h2 id="ad-h2">
              Reach {Math.round(city.monthlyReach / 1000)}k people a month in {city.name}
            </h2>
            <p className="hl-only-desk">Put your restaurant, shop or service in front of people looking for halal places near them.</p>
            <p className="hl-only-mob">Put your business in front of people looking for halal places near them.</p>
          </div>
          <AdvertiseButton city={city.slug} cityName={city.name} reach={`${Math.round(city.monthlyReach / 1000)}k`} />
        </div>
      </section>

      {reels.length ? <ReelsCarousel reels={reels} /> : null}

      <section id="suggest" className="hl-wrap hl-sec" aria-labelledby="sg-h" data-rv="">
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
              <SuggestSheetButton city={city.slug} cityName={city.name} areas={areas} />
            </div>
          </div>
          <div className="hl-sg__card hl-only-desk">
            <SuggestForm city={city.slug} cityName={city.name} areas={areas} />
          </div>
        </div>
      </section>
    </>
  );
}
