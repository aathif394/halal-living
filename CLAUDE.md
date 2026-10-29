# Halal Living

New app built from the mockup "Halal Living 2.html" (not in repo). Stack: vinext (Next-compatible on Vite) + Cloudflare Workers + Supabase + Tailwind.

- Package manager: pnpm. Commands in README.
- Supabase schema in `supabase/migrations`. Latest: `20261027120000_google_place_cache.sql` (Google Place cache).
- Public repo: never commit secrets. Only the publishable anon key is allowed in config.
- Previous apps (admin, halal) were in an older private-history repo and are not carried over.
- UI: `components/hl/` is the approved mockup (`handoff/index.html`) compiled to TSX by `scripts/dc2jsx.mjs`: `*-view.tsx` are the templates, `*-logic.js` the mockup's logic classes, `runtime.tsx` reproduces the mockup engine (state, a11y buttons, hover classes). Edit these directly; match `handoff/` for any visual change. Global CSS is `app/hl.css` (no Tailwind).
- Routes (`app/[city]/...`) are server components: `components/city-page.tsx` loads Supabase data (`lib/app-data.ts`), sets metadata/JSON-LD, and renders `HalalApp`.
