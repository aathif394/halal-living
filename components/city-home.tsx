import { STORE_URL, type CityTheme } from "@/lib/cities";
import type { CommunityPost, Featured, PrayerHall, Restaurant } from "@/lib/types";
import { faqLd } from "@/lib/seo";
import { MasjidCard, RestaurantCard } from "./cards";
import { Footer, Nav } from "./chrome";
import { FormNotice } from "./form-notice";
import { JsonLd } from "./json-ld";
import { SuggestForm } from "./suggest-form";
import { WordCycle } from "./word-cycle";

const PRODUCTS: [string, string, string, string][] = [
  ["Ajwa dates, 500 g", "Pantry", "₹899", "Bestseller"],
  ["Travel prayer mat", "Prayer", "₹749", ""],
  ["Oud attar, 6 ml", "Fragrance", "₹1,250", "New"],
  ["HLC Cookbook, Vol. 1", "Books", "₹599", ""],
  ["Kids Arabic flashcards", "Kids", "₹399", ""],
  ["Olive-wood tasbih", "Prayer", "₹299", ""],
  ["Biryani spice box", "Pantry", "₹499", "New"],
  ["HLC tote bag", "Merch", "₹449", ""],
];

export function CityHome({
  city,
  restaurants,
  masjids,
  featured,
  posts,
  notice,
}: {
  city: CityTheme;
  restaurants: Restaurant[];
  masjids: PrayerHall[];
  featured: Featured[];
  posts: CommunityPost[];
  notice?: "sent" | "error";
}) {
  const areas = [...new Set(restaurants.map((place) => place.neighborhood).concat(masjids.map((place) => place.neighborhood)))].slice(0, 8);
  const lead = featured[0];
  const questions = [
    {
      q: `Where can I find halal food in ${city.name}?`,
      a: restaurants.length
        ? `${city.name} currently has ${restaurants.length} halal restaurants on Halal Living, including ${restaurants.slice(0, 3).map((place) => place.name).join(", ")}.`
        : `Halal Living does not have restaurant listings for ${city.name} yet. Suggest a place and someone from the community checks it before it is listed.`,
    },
    {
      q: `Which masjids are listed in ${city.name}?`,
      a: masjids.length
        ? `${masjids.length} masjids and prayer halls are listed, including ${masjids.slice(0, 3).map((place) => place.name).join(", ")}. Each page shows Jumu'ah time, madhab, and facilities.`
        : `No masjids are listed in ${city.name} yet.`,
    },
    {
      q: "How does a listing get on Halal Living?",
      a: "Someone suggests a restaurant or masjid. A person from the community checks it before it is published. Halal certification is labelled as HMC certified, self-certified, or vegetarian.",
    },
  ];

  return (
    <div data-city={city.slug}>
      <a className="hl-skip" href="#content">Skip to content</a>
      <header className="hl-hero">
        <div className="hl-pattern" />
        <svg className="hl-landmark" width="460" height="460" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="0.5" aria-hidden="true">
          <path d={city.landmark} />
        </svg>
        <Nav city={city} />
        <div className="hl-hero-grid">
          <div>
            <h1>
              <span>Halal</span>
              <WordCycle words={["food", "kebabs", "biryani", "burgers", "pizza", "eats"]} />
              <span>&amp;</span>
              <span>masjids</span>
              <span>in</span>
              <span className="hl-soft hl-under">{city.name}</span>
            </h1>
            <p className="hl-dek">Halal restaurants and masjids in {city.name}, checked by people who live there.</p>
            <form className="hl-search" action={`/${city.slug}/search`}>
              <span className="hl-sr">Search</span>
              <input name="q" placeholder="Search restaurants, masjids, or areas" aria-label={`Search halal places in ${city.name}`} />
              <button type="submit">Search</button>
            </form>
          </div>
          <aside className="hl-side">
            {lead ? (
              <a className="hl-side-card" href={lead.restaurant_slug ? `/${lead.restaurant_city ?? city.slug}/restaurants/${lead.restaurant_slug}` : `/${city.slug}/restaurants`}>
                <div className="hl-kicker">{lead.sponsor_label || "SPONSORED"}</div>
                <strong>{lead.name}</strong>
                <p>{lead.pitch}</p>
                <b>{lead.cta}</b>
              </a>
            ) : null}
            <div className="hl-near">
              <div className="hl-kicker">NEAR YOU IN {city.name.toUpperCase()}</div>
              <a href={`/${city.slug}/restaurants`}><span>Restaurants</span><span>{restaurants.length}</span></a>
              <a href={`/${city.slug}/masjids`}><span>Masjids & prayer halls</span><span>{masjids.length}</span></a>
              <a href={`/${city.slug}/masjids`}>Locate nearest masjid</a>
            </div>
          </aside>
        </div>
      </header>
      <main id="content">
        <section className="hl-section hl-wrap" aria-labelledby="restaurants-heading">
          <div className="hl-section-head">
            <h2 id="restaurants-heading">Restaurants</h2>
            <a className="hl-link" href={`/${city.slug}/restaurants`}>See all {restaurants.length} →</a>
          </div>
          {areas.length ? (
            <div className="hl-chips">
              {areas.map((area) => (
                <a className="hl-chip" key={area} href={`/${city.slug}/restaurants?area=${encodeURIComponent(area)}`}>{area}</a>
              ))}
            </div>
          ) : null}
          {restaurants.length ? (
            <div className="hl-grid cols-3">
              {restaurants.slice(0, 6).map((place) => <RestaurantCard key={place.id} place={place} city={city} />)}
            </div>
          ) : (
            <div className="hl-empty">No restaurants in {city.name} yet. <a className="hl-link" href="/suggest">Suggest a place</a></div>
          )}
        </section>

        <section className="hl-section hl-wrap" aria-labelledby="masjid-heading">
          <div className="hl-section-head">
            <h2 id="masjid-heading">Masjids & prayer halls</h2>
            <a className="hl-link" href={`/${city.slug}/masjids`}>See all {masjids.length} →</a>
          </div>
          {masjids.length ? (
            <div className="hl-grid cols-3">
              {masjids.slice(0, 6).map((place) => <MasjidCard key={place.id} place={place} city={city} />)}
            </div>
          ) : (
            <div className="hl-empty">No masjids in {city.name} yet. <a className="hl-link" href="/suggest">Suggest a place</a></div>
          )}
        </section>

        {posts.length ? (
          <section className="hl-section hl-wrap" aria-labelledby="community-heading">
            <div className="hl-section-head">
              <h2 id="community-heading">More from our community</h2>
            </div>
            <div className="hl-community">
              {posts.slice(0, 4).map((post) => (
                <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer">
                  <img src={post.media_url} alt={post.alt_text || post.caption || "Community photo"} />
                  {post.caption ? <p>{post.caption}</p> : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="hl-stats" aria-labelledby="stats-heading">
          <div className="hl-wrap hl-section">
            <h2 id="stats-heading">Halal Living in {city.name}</h2>
            <div className="hl-stats-grid" style={{ marginTop: 22 }}>
              <a className="hl-stat" href={`/${city.slug}/restaurants`}><b>{restaurants.length}</b>Restaurants. Every one shows its halal status.</a>
              <a className="hl-stat" href={`/${city.slug}/masjids`}><b>{masjids.length}</b>Masjids and prayer halls, with Jumu'ah times.</a>
              <div className="hl-stat"><b>{areas.length}</b>Neighbourhoods covered from the live directory.</div>
            </div>
          </div>
        </section>

        <section className="hl-faq hl-section hl-wrap" aria-labelledby="answers-heading">
          <h2 id="answers-heading">Answers</h2>
          <div className="hl-faq" style={{ marginTop: 18 }}>
            {questions.map((item) => (
              <article key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="hl-store hl-section" aria-labelledby="store-heading">
          <div className="hl-wrap">
            <div className="hl-section-head">
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <img src="/store-logo.svg" alt="" width="72" height="72" />
                <h2 id="store-heading">Halal Living Store</h2>
              </div>
              <a className="hl-link" href={STORE_URL}>Shop the edit →</a>
            </div>
            <p>Buy from Muslim-owned businesses. The store is a separate shop.</p>
            <div className="hl-products">
              {PRODUCTS.map(([name, cat, price, badge]) => (
                <a className="hl-product" key={name} href={STORE_URL} target="_blank" rel="noopener noreferrer">
                  <div style={{ background: "var(--soft)" }} />
                  <p><b>{name}</b><br />{cat} · {price}{badge ? <> · <em>{badge}</em></> : null}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="hl-suggest" id="suggest" aria-labelledby="suggest-heading">
          <div className="hl-kicker">SUGGEST A PLACE</div>
          <h2 id="suggest-heading" style={{ margin: "10px 0 0", fontSize: "clamp(32px, 4vw, 48px)", letterSpacing: "-0.03em" }}>
            Know a place we haven't found?
          </h2>
          <p>Tell us about a restaurant or masjid. Someone from the community checks it before it's listed.</p>
          <FormNotice
            notice={notice}
            sent="Thanks. Someone from the community will check this before it's listed."
            error="That didn't send. Add the place name, a real email, and a short note, then try again."
          />
          <SuggestForm next={`/${city.slug}`} areaPlaceholder={city.areas[0]} />
        </section>
      </main>
      <Footer city={city} />
      <JsonLd data={faqLd(questions)} />
    </div>
  );
}
