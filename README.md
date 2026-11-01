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
