import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "halal-living",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-10-26",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: true,
    // Monthly "Stay updated" digest: 03:30 UTC on the 1st = 09:00 IST (worker/index.ts scheduled()).
    triggers: [triggers.scheduled({ schedule: "30 3 1 * *" })],
    observability: { enabled: true, headSamplingRate: 1 },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*", "!/icons/*", "!/art/*", "!/brand/*", "!/fonts/*", "!/places/photos/*", "!/reels/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      ENABLE_PAID_GOOGLE_PLACES: bindings.text("false"),
      NEXT_PUBLIC_SUPABASE_URL: bindings.text("https://xrhwforbjljuztqcpqnp.supabase.co"),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.text("sb_publishable_vo7N12rMCyBxnOb4OOSTNQ_ueZJRUf_"),
      NEXT_PUBLIC_CLARITY_ID: bindings.text("z7by4r07yv"),
    },
  }),
});
