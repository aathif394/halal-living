import type { CityTheme } from "@/lib/cities";
import { reelHandle } from "@/lib/reel-directory";
import type { Amenity, MasjidView, ReelSlide, RestaurantView } from "@/lib/view";
import { SealPill, VerifiedSeal } from "./brand";
import { CallButton, DrawerHandle } from "./detail-parts";
import { Icon, Stars, type IconName } from "./icons";
import { ReelPlayer } from "./reel-player";
import { mapEmbedUrl } from "@/lib/maps";
import { ReviewsCarousel } from "./reviews-carousel";
import { PhotoGallery } from "./photo-gallery";

const AMENITY_ICON: Record<Amenity["key"], IconName> = { parking: "parking", women: "women", jummah: "calendar" };

function MapArt({ kind, compact, name, lat, lng }: { kind: "restaurant" | "masjid"; compact?: boolean; name: string; lat: number | null; lng: number | null }) {
  const src = mapEmbedUrl(lat == null || lng == null ? null : [lat, lng]);
  if (src) return (
    <div className="hl-map-art">
      <iframe src={src} title={`${name} location map`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen style={{ display: "block", width: "100%", height: "100%", border: 0 }} />
    </div>
  );
  return (
    <div className="hl-map-art" aria-hidden="true">
      <svg width="100%" height="100%" viewBox={compact ? "0 0 360 150" : "0 0 1100 420"} preserveAspectRatio={compact ? "none" : "xMidYMid slice"}>
        {compact ? (
          <>
            <path d="M0 50 L360 38" stroke="#fff" strokeWidth="10" />
            <path d="M130 0 L145 150" stroke="#fff" strokeWidth="9" />
            <path d="M0 115 L360 108" stroke="#fff" strokeWidth="6" />
          </>
        ) : (
          <>
            <path d="M0 120 L1100 80" stroke="#fff" strokeWidth="18" />
            <path d="M0 310 L1100 290" stroke="#fff" strokeWidth="10" />
            <path d="M300 0 L330 420" stroke="#fff" strokeWidth="10" />
            <path d="M600 0 L630 420" stroke="#fff" strokeWidth="16" />
            <path d="M880 0 L865 420" stroke="#fff" strokeWidth="9" />
            <rect x="660" y="150" width="170" height="100" rx="14" fill="#D6EAD0" />
            <rect x="80" y="170" width="120" height="80" rx="12" fill="#D6EAD0" />
            <path d="M940 420 C 1000 320, 1060 300, 1100 296 L1100 420z" fill="#CFE3EE" />
          </>
        )}
      </svg>
      <svg className="hl-map-pin" width={compact ? 36 : 56} height={compact ? 45 : 68} viewBox="0 0 40 50">
        {kind === "restaurant" ? (
          <>
            <path d="M20 48c-8-11-17-19-17-29a17 17 0 0 1 34 0c0 10-9 18-17 29z" fill="var(--btn)" stroke="#fff" strokeWidth="2.5" />
            <circle cx="20" cy="19" r="6" fill="#fff" />
          </>
        ) : (
          <>
            <path d="M5 46V20a15 15 0 0 1 30 0v26z" fill="var(--btn)" stroke="#fff" strokeWidth="2.5" />
            <path d="M14 46V34a6 6 0 0 1 12 0v12" fill="none" stroke="#fff" strokeWidth="2.5" />
          </>
        )}
      </svg>
    </div>
  );
}

function PhotoGrid({ photos, art, label, name }: { photos: { src: string; credit: string }[]; art: string; label: string; name: string }) {
  return <div className="hl-photos"><div className="hl-card-k"><span>PHOTOS</span><small>{label}</small></div><PhotoGallery photos={photos} art={art} name={name} variant="grid" /></div>;
}

function VisitNote({ place }: { place: { description: string; sourceNote: string; website: string; businessStatus: string; openingHours?: MasjidView["openingHours"] } }) {
  return (
    <section className="hl-visit-note">
      <p>{place.description}</p>
      {place.sourceNote ? <p className="hl-visit-note__note">{place.sourceNote}</p> : null}
      {/closed/i.test(place.businessStatus) ? <p className="hl-visit-note__note">Google Maps lists this place as {place.businessStatus.toLowerCase()}. Check before visiting.</p> : null}
      {place.website ? <a className="hl-link" href={place.website} target="_blank" rel="noopener noreferrer">Website<Icon name="arrowUpRight" size={13} /></a> : null}
      {place.openingHours?.length ? (
        <details>
          <summary>Opening hours on Google</summary>
          <div className="hl-hours__groups">{place.openingHours.map(row => <div key={row.day}><span>{row.day}</span><span>{row.time}</span></div>)}</div>
          <p className="hl-visit-note__note">Opening hours are separate from Salah and Jumu’ah timings. Confirm with the masjid.</p>
        </details>
      ) : null}
    </section>
  );
}

function OpenBadge({ open, known = true }: { open: boolean; known?: boolean }) {
  return (
    <span className={`hl-open${open ? " is-open" : ""}`}>
      <i />
      {!known ? "Check hours" : open ? "Open now" : "Closed"}
    </span>
  );
}

export function RestaurantDetail({ city, place, reel }: { city: CityTheme; place: RestaurantView; reel: ReelSlide[] }) {
  const back = `/${city.slug}/restaurants`;
  const handle = reelHandle(city.slug);
  return (
    <>
      {/* Desktop: hero card | reel, then rating, hours, map, photos, reviews. */}
      <div className="hl-detail hl-detail--r hl-only-desk">
        <section className="hl-dhero">
          <div className="hl-stars-bg" aria-hidden="true" />
          <svg className="hl-dhero__art" width="300" height="300" viewBox="0 0 60 60" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 28 H50 M12 28 Q12 52 30 52 Q48 52 48 28 M16 28 Q30 18 44 28 M22 20 q3 -5 0 -10 M30 18 q3 -5 0 -10 M38 20 q3 -5 0 -10" />
          </svg>
          <div className="hl-dhero__seal">
            <VerifiedSeal trust={place.trust} />
          </div>
          <div className="hl-dhero__meta">
            {place.cuisine} · {place.price} · {place.area}
          </div>
          <div>
            <h1 className="hl-dhero__h">{place.name}</h1>
            <div className="hl-dhero__btns">
              <a className="hl-btn-white" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="pin" size={18} />
                Directions
              </a>
              <CallButton phone={place.phone} className="hl-btn-glass" />
            </div>
          </div>
        </section>
        <div className="hl-detail__reel">
          <ReelPlayer slides={reel} avatar={place.photo} handle={handle} variant="card" label={`Reel: ${place.name}`} />
        </div>
        <section className="hl-dcard hl-rating">
          <div className="hl-card-k">
            <span>GOOGLE RATING</span>
          </div>
          <div>
            <div className="hl-rating__n">{place.rating}</div>
            <Stars value={place.ratingValue} size={22} />
            <div className="hl-rating__c">from {place.reviewCount} reviews</div>
          </div>
          <a className="hl-link" href="#reviews">
            Read reviews
            <Icon name="arrowDown" size={14} stroke={2.6} />
          </a>
        </section>
        <section className="hl-dcard hl-hours">
          <div className="hl-card-k">
            <span>HOURS</span>
            <OpenBadge open={place.isOpen} known={place.hoursKnown} />
          </div>
          <div className="hl-hours__headrow">
            <div className="hl-hours__head">{place.openHead}</div>
            {place.openSub ? <div className="hl-hours__sub">{place.openSub}</div> : null}
          </div>
          <div className="hl-hours__groups">
            {place.hourGroups.map((g) => (
              <div key={g.days} className={g.today ? "is-today" : undefined}>
                <span>{g.days}</span>
                <span>{g.time}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="hl-dmap">
          <div className="hl-dmap__map">
            <MapArt kind="restaurant" name={place.name} lat={place.lat} lng={place.lng} />
          </div>
          <div className="hl-dmap__card">
            <div>
              <b>{place.address || place.area}</b>
              <span>
                {place.area} · {city.name}
              </span>
            </div>
            <a className="hl-btn-brand" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
              Directions
            </a>
          </div>
        </section>
        <section className="hl-dcard hl-dphotos">
          <PhotoGrid photos={place.photos} art={place.art} name={place.name} label={place.photos.some(photo => photo.credit.startsWith("Photo")) ? "from Google" : place.photos.length ? "from Halal Living reels" : "illustration"} />
          <VisitNote place={place} />
        </section>
        <section id="reviews" className="hl-dcard hl-dreviews">
          <div className="hl-dreviews__head">
            <h2>
              Google reviews
              <span>
                <Icon name="starFill" size={16} style={{ color: "#F2A20C" }} /> {place.rating} · {place.reviewCount}
              </span>
            </h2>
            <a className="hl-link" href={place.reviewsUrl} target="_blank" rel="noopener noreferrer">
              See all on Google
              <Icon name="arrowUpRight" size={13} stroke={2.6} />
            </a>
          </div>
          <ReviewsCarousel reviews={place.reviews} />
        </section>
      </div>

      {/* Mobile: the reel fills the screen; a white drawer peeks up and slides over it. */}
      <div className="hl-mdetail hl-only-mob">
        <div className="hl-mdetail__reel">
          <ReelPlayer slides={reel} avatar={place.photo} handle={handle} variant="full" backHref={back} label={`Reel: ${place.name}`} />
        </div>
        <section className="hl-sheet" data-sheet="1">
          <DrawerHandle />
          <div className="hl-sheet__title">
            <h1>{place.name}</h1>
            <SealPill trust={place.trust} />
          </div>
          <div className="hl-sheet__meta">
            {place.cuisine} · {place.area} · {place.price}
          </div>
          <div className="hl-sheet__facts">
            {place.rating !== "–" ? (
              <span className="hl-score">
                {place.rating}
                <Icon name="starFill" size={13} />
              </span>
            ) : null}
            <span className="hl-sheet__rc">{place.reviewCount} Google reviews</span>
            <OpenBadge open={place.isOpen} known={place.hoursKnown} />
          </div>
          <VisitNote place={place} />
          <PhotoGallery photos={place.photos} art={place.art} name={place.name} variant="strip" />
          <div className="hl-sheet__map">
            <div className="hl-sheet__mapart">
              <MapArt kind="restaurant" name={place.name} lat={place.lat} lng={place.lng} compact />
            </div>
            <div className="hl-sheet__addr">
              <div>
                <b>{place.address || place.area}</b>
                <span>Today · {place.today}</span>
              </div>
              <a className="hl-map-directions" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
                Directions<Icon name="arrowUpRight" size={14} />
              </a>
            </div>
          </div>
          <div className="hl-sheet__sec">
            <h2>Google reviews</h2>
            <a className="hl-link" href={place.reviewsUrl} target="_blank" rel="noopener noreferrer">
              See all
              <Icon name="arrowUpRight" size={12} stroke={2.6} />
            </a>
          </div>
          <ReviewsCarousel reviews={place.reviews} />
          <div style={{ height: 100 }} />
        </section>
        <div className="hl-actionbar">
          <a className="hl-actionbar__go" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="pin" size={18} />
            Directions
          </a>
          <CallButton phone={place.phone} className="hl-actionbar__call" iconOnly />
        </div>
      </div>
    </>
  );
}

export function MasjidDetail({ city, place, reel }: { city: CityTheme; place: MasjidView; reel: ReelSlide[] }) {
  const back = `/${city.slug}/masjids`;
  const handle = reelHandle(city.slug);
  return (
    <>
      <div className="hl-detail hl-detail--m hl-only-desk">
        <section className="hl-dhero hl-dhero--m">
          <div className="hl-geo-bg" aria-hidden="true" />
          <svg className="hl-dhero__dome" width="340" height="340" viewBox="0 0 60 60" fill="none" stroke="#D9B45A" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 52 H52 M12 52 V34 M48 52 V34 M10 34 H50 M14 34 Q14 18 30 14 Q46 18 46 34 M30 14 V9 M32.5 3.2 a3.2 3.2 0 1 0 0 5.6 a2.6 2.6 0 1 1 0 -5.6 M24 52 V43 a6 6 0 0 1 12 0 V52 M4 52 V24 M2 24 h4 M56 52 V24 M54 24 h4" />
          </svg>
          <div className="hl-dhero__meta">
            <span className="hl-kind">{place.kind}</span>
            {place.area}
          </div>
          <div>
            <h1 className="hl-dhero__h">{place.name}</h1>
            <div className="hl-dhero__addr">{place.address}</div>
            <div className="hl-amen-chips">
              {place.amenities.map((item) => (
                <span key={item.key} className={`hl-amen-chip${item.ok ? " is-ok" : ""}`} title={item.detail}>
                  <span>
                    <Icon name={AMENITY_ICON[item.key]} size={15} stroke={2} />
                  </span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>
        <div className="hl-detail__reel">
          <ReelPlayer slides={reel} avatar={place.photo} handle={handle} variant="card" label={`Reel: ${place.name}`} />
        </div>
        <section className="hl-dmap hl-dmap--m">
          <div className="hl-dmap__map">
            <MapArt kind="masjid" name={place.name} lat={place.lat} lng={place.lng} />
          </div>
          <div className="hl-dmap__card">
            <div>
              <b>{place.address || place.area}</b>
              <span>{place.jummah ? `Jumu’ah at ${place.jummah}` : `${place.area} · ${city.name}`}</span>
            </div>
            <CallButton phone={place.phone} className="hl-btn-brand" />
            <a className="hl-btn-brand" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
              Directions
            </a>
          </div>
        </section>
        <section className="hl-dcard hl-dphotos">
          <PhotoGrid photos={place.photos} art={place.art} name={place.name} label={place.photos.some(photo => photo.credit.startsWith("Photo")) ? "from Google" : place.photos.length ? "from Halal Living reels" : "illustration"} />
          <VisitNote place={place} />
        </section>
      </div>

      <div className="hl-mdetail hl-only-mob">
        <div className="hl-mdetail__reel">
          <ReelPlayer slides={reel} avatar={place.photo} handle={handle} variant="full" backHref={back} label={`Reel: ${place.name}`} />
        </div>
        <section className="hl-sheet" data-sheet="1">
          <DrawerHandle />
          <h1 className="hl-sheet__h">{place.name}</h1>
          <div className="hl-sheet__facts">
            <span className="hl-kind hl-kind--tint">{place.kind}</span>
          </div>
          <p className="hl-sheet__address">{place.address}</p>
          <div className="hl-sheet__cta">
            <CallButton phone={place.phone} className="hl-btn-brand" />
            <a className="hl-actionbar__go" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
              Directions
            </a>
          </div>
          <h2 className="hl-sheet__h2">Photos</h2>
          <VisitNote place={place} />
          <PhotoGallery photos={place.photos} art={place.art} name={place.name} variant="strip" />
          <h2 className="hl-sheet__h2">Amenities</h2>
          <div className="hl-amen-grid">
            {place.amenities.map((item) => (
              <div key={item.key} className={`hl-amen${item.ok ? " is-ok" : ""}`}>
                <span className="hl-amen__ic">
                  <Icon name={AMENITY_ICON[item.key]} size={22} stroke={1.9} />
                  <span className="hl-amen__mark">
                    <Icon name={item.ok ? "check" : "close"} size={10} stroke={3.4} />
                  </span>
                </span>
                <span className="hl-amen__l">{item.label}</span>
              </div>
            ))}
          </div>
          <h2 className="hl-sheet__h2">Location</h2>
          <div className="hl-sheet__map">
            <div className="hl-sheet__mapart">
              <MapArt kind="masjid" name={place.name} lat={place.lat} lng={place.lng} compact />
            </div>
            <div className="hl-sheet__addr">
              <div>
                <b>{place.address || place.area}</b>
                <span>{place.area} · {city.name}</span>
              </div>
              <a className="hl-map-directions" href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
                Directions<Icon name="arrowUpRight" size={14} />
              </a>
            </div>
          </div>
          <div style={{ height: 100 }} />
        </section>
      </div>
    </>
  );
}
