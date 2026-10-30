# Halal Living

New app built from the mockup "Halal Living 2.html" (not in repo). Stack: vinext (Next-compatible on Vite) + Cloudflare Workers + Supabase + Tailwind.

- Package manager: pnpm. Commands in README.
- Supabase schema in `supabase/migrations`. Latest: `20261027120000_google_place_cache.sql` (Google Place cache).
- Public repo: never commit secrets. Only the publishable anon key is allowed in config.
- Previous apps (admin, halal) were in an older private-history repo and are not carried over.
- The UI is real React components rendered by the app router (`app/[city]/...`), following the mockup in `handoff/` (see `handoff/CLAUDE.md`). Do not serve the mockup HTML directly.
  - `components/`: `chrome` (top bar, footer, frame), `bottom-nav`, `city-home`, `list-page`, `place-browser` (filters, distance sort, map), `detail` (place pages), `reel-player`, `brand` (verified seal, logos), `install` (install card + sheet), `icons`.
  - `lib/view.ts` shapes database rows for the components. Styles live in `app/globals.css`; phones first, desktop layout from 1100px.
  - Use `<Icon>` from `components/icons.tsx` for every symbol. No emoji or text arrows in the UI.
  - Artwork from the mockup is in `public/art/` (illustration fallbacks) and `public/brand/` (city and partner logos).
