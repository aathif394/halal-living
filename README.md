# Halal Living

Discovery site for halal restaurants and masjids in Chennai, Mumbai, Bangalore, and Hyderabad. Reads a Supabase project, runs on Cloudflare Workers through vinext.

```sh
pnpm install
cp .env.example .env.local   # fill in anon key
pnpm dev
pnpm build
pnpm deploy                  # Cloudflare Workers
```

- `app/`, `components/`, `lib/`: the Next-style app (vinext). Pages are React components built from the mockup in `handoff/`
- `supabase/`: migrations and seed SQL
- `cloudflare.config.ts`: worker + bindings

The store lives at https://store.halallivingcollective.in.

## Local Google place snapshot

This integration starts from `d67e035` on `claude/peaceful-cray-220zu9`, matching production version `70f800e3`. Preserve the current React app; make UI changes only when explicitly requested. Do not deploy the older prototype shell from `main`.

`data/google-places.json` overlays matched Google place fields when existing listing rows are read. Static, content-addressed photos are in `public/places/photos/`. Unmatched listings keep their original data. Google maps use a keyless consumer embed within the existing map containers. Paid Places API calls are disabled by default.

Run `node --test tests/*.test.mjs` to verify matching, photo safety, map URLs, and preservation of the baseline UI. Refresh data locally with `node scripts/places.mjs refresh`; it uses the local gosom scraper and does not write to Supabase.

The UI fixes on top of that data integration add swipeable review cards with arrow controls, open place reels in the existing full-screen viewer, keep hero text sharp, rotate the suggestion heading, and constrain mobile filters to their page padding. Navigation remains the current docked design.


## Reel directory

The app uses `data/reel-directory.json` as its directory: 33 restaurants and 45 masjids/prayer spaces featured in 79 relevant reels, reviewed from the profile’s 161 reels. Multiple names and repeat visits are grouped into one place. Existing React layouts, filters, maps and mobile full-screen reels are preserved. Original reel links are retained. `/api/reels/[id]` resolves Instagram’s public embed metadata and redirects the browser to the original Instagram CDN video; videos are never downloaded or re-encoded by this app. Only posters live in `public/reels/`. Source URLs refresh after ten minutes so expiring Instagram links are not saved in the catalog. The player starts with sound enabled; if a browser blocks audible autoplay, the user can tap Play.

`data/google-places.json` enriches only these listings. The 2026-11-02 Gosom import contains 435 local Google photos and 446 written reviews. Reviewed Google place IDs and matching evidence are in `data/google-place-matches.json`. Five prayer rooms have building-only matches: their maps/photos are labeled as venue information and their venue reviews and opening hours are excluded. Missing Google photos fall back to the reel poster. Imported hours are a schedule, never a live open/closed signal.

Refresh with `node scripts/places.mjs prepare`, `node scripts/places.mjs run`, then review new matches before `node scripts/places.mjs import --only-reviewed`. For this import, the two scrape batches were combined in `.local/places/combined-results.jsonl`. Raw extraction data and logs remain local and ignored. No Instagram cookies, Cloudflare credentials or paid Google API calls are shipped to the app.

## Loading and navigation

Internal links use the client router; the main navigation prefetches its destinations and city changes start immediately. Optional sponsored placements and live store products stream within independent Suspense boundaries, so they cannot block the city heading, directory, or shared navigation. Store cards render from the real local catalog while current prices arrive. Analytics starts from a measured snapshot for the current month and refreshes through its existing API.

The homepage retains the mockup carousel below the hero and the banner after suggestions. The Medina Dates billboard between the advertising enquiry section and reels has been removed. The mockup creatives remain visible when no active placements are returned; configured live placements replace them within those slots.

Local place cards and galleries use prebuilt 320px/640px WebP images, served directly as static assets with no first-request transform. `pnpm build` generates missing variants; `pnpm images:build` refreshes them independently. Store product images use the configured Cloudflare Images optimizer. Photo lightboxes retain the originals. Figtree is hosted locally in `public/fonts/` with its OFL license. Versioned fonts and generated static bundles use immutable asset caching. Scroll reveals inspect newly added sections rather than rescanning the page on every animated counter update.


## Store products

The homepage selects five real products on each request, favoring different businesses. `data/store-products.json` is a fallback catalog of 487 available products from 40 verified businesses on `www.livingcollective.store`. Selected businesses’ product data is refreshed from the store’s public API with a ten-minute cache; cards use current prices and availability when that API responds. Every card links to its specific store product. Run `node scripts/store-products.mjs` to refresh the fallback pool. No store credentials are needed.
