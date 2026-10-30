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
