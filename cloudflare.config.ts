import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "halal-living",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-26",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: true,
    observability: { enabled: true, headSamplingRate: 1 },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*", "!/icons/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      NEXT_PUBLIC_SUPABASE_URL: bindings.text("https://xrhwforbjljuztqcpqnp.supabase.co"),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.text("sb_publishable_vo7N12rMCyBxnOb4OOSTNQ_ueZJRUf_"),
      NEXT_PUBLIC_CLARITY_ID: bindings.text(""),
    },
  }),
});
