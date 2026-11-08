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

The app uses `data/reel-directory.json` for its Chennai, Bangalore, Mumbai and Hyderabad listings. The catalog records each city’s source profile and reel count. It groups repeat visits and alternate names under one listing and links to the original reels. `/api/reels/[id]` resolves Instagram’s public embed metadata and redirects the browser to the original Instagram CDN video. Only posters live in `public/reels/`. Source URLs refresh after ten minutes so expiring Instagram links stay out of the catalog. The player starts with sound enabled. If a browser blocks audible autoplay, the user can tap Play.

`data/google-places.json` enriches the directory with reviewed Gosom results. Reviewed Google place IDs and matching evidence are in `data/google-place-matches.json`. Building-only matches label the map and photos as venue information and omit venue reviews and hours. Landmark matches use the starting point shown in the reel for directions and keep the reel poster and original address directions. Listings without a reliable match use their reel details. Imported hours are a published schedule.

Refresh with `node scripts/places.mjs prepare`, `node scripts/places.mjs run`, then review new matches before `node scripts/places.mjs import --only-reviewed`. For this import, the two scrape batches were combined in `.local/places/combined-results.jsonl`. Raw extraction data and logs remain local and ignored. No Instagram cookies, Cloudflare credentials or paid Google API calls are shipped to the app.

## Loading and navigation

Internal links use the client router; the main navigation prefetches its destinations and city changes start immediately. Optional sponsored placements and live store products stream within independent Suspense boundaries, so they cannot block the city heading, directory, or shared navigation. Store cards render from the real local catalog while current prices arrive. Analytics starts from a measured snapshot for the current month and refreshes through its existing API.

Live traffic uses the `CLOUDFLARE_ANALYTICS_TOKEN` secret on the production Worker. Use an account-scoped Cloudflare token with Account Analytics Read permission. The card checks for fresh totals every five minutes while visible and when the tab becomes visible again. To refresh the fallback snapshot, run `node --env-file=.env.local scripts/traffic.mjs` with an analytics-capable token configured locally.

The homepage retains the mockup carousel below the hero and the banner after suggestions. The Medina Dates billboard between the advertising enquiry section and reels has been removed. The mockup creatives remain visible when no active placements are returned; configured live placements replace them within those slots.

Local place cards and galleries use prebuilt 320px/640px WebP images, served directly as static assets with no first-request transform. `pnpm build` generates missing variants; `pnpm images:build` refreshes them independently. Store product images use the configured Cloudflare Images optimizer. Photo lightboxes retain the originals. Figtree is hosted locally in `public/fonts/` with its OFL license. Versioned fonts and generated static bundles use immutable asset caching. Scroll reveals inspect newly added sections rather than rescanning the page on every animated counter update.


## Store products

The homepage selects five real products on each request, favoring different businesses. `data/store-products.json` is a fallback catalog of 487 available products from 40 verified businesses on `www.livingcollective.store`. Selected businesses’ product data is refreshed from the store’s public API with a ten-minute cache; cards use current prices and availability when that API responds. Every card links to its specific store product. Run `node scripts/store-products.mjs` to refresh the fallback pool. No store credentials are needed.

"Stay updated" sign-ups (`/api/subscribe`) are stored in `digest_subscribers` (one row per email; cities and topics merge on re-subscribe) and get a confirmation email from `updates@halal.livingcollective.net` through Resend (`lib/email.ts`).

The monthly digest (`lib/digest.ts`) runs from the Worker cron `30 3 1 * *` (09:00 IST on the 1st). Each subscriber gets the restaurants and masjids first featured (earliest reel date) in their cities since their last digest; nobody is emailed when there is nothing new. Every email has an unsubscribe link (`/unsubscribe`) and one-click `List-Unsubscribe` headers.

- Worker secrets: `RESEND_API_KEY`, `DIGEST_SECRET` (also stored in `private.app_secrets` in Supabase; the digest functions check it, so the table is never readable with the public key).
- Manual run: `POST /api/digest` with `Authorization: Bearer $DIGEST_SECRET` and `{"dryRun":true}` to preview, `{"to":"delivered@resend.dev"}` to send every email to one test address, or `{}` to send for real.
