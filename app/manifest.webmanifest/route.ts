export const dynamic = "force-dynamic";

const manifest = {
  id: "/",
  name: "Halal Living",
  short_name: "Halal Living",
  description: "Halal restaurants and masjids in Chennai, Mumbai, Bangalore and Hyderabad, checked by people who live there.",
  start_url: "/chennai",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  background_color: "#FBF1EC",
  theme_color: "#B94421",
  lang: "en",
  categories: ["food", "lifestyle"],
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const body = { ...manifest, related_applications: [{ platform: "webapp", url: `${origin}/manifest.webmanifest` }] };
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
