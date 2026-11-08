import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./launch.css";
import { InstallProvider } from "@/components/install";
import { SITE_DESCRIPTION } from "@/lib/cities";
import { clarityId } from "@/lib/analytics";
import { graphLd, jsonLdScript, organizationLd, siteUrl, websiteLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const base = await siteUrl();
  return {
    metadataBase: new URL(base),
    title: { default: "Halal Living", template: "%s · Halal Living" },
    description: SITE_DESCRIPTION,
    applicationName: "Halal Living",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" }],
      apple: "/icons/apple-touch-icon.png",
    },
    appleWebApp: { capable: true, title: "Halal Living", statusBarStyle: "black-translucent" },
    openGraph: {
      type: "website",
      siteName: "Halal Living",
      locale: "en_IN",
      title: "Halal Living",
      description: SITE_DESCRIPTION,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#B94421",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const base = await siteUrl();
  const clarity = await clarityId();
  const graph = [organizationLd(base), websiteLd(base)];
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/figtree-latin-v9.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graphLd(graph)) }} />
        {clarity ? (
          <script
            id="microsoft-clarity"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarity}");`,
            }}
          />
        ) : null}
      </head>
      <body>
        <InstallProvider>{children}</InstallProvider>
      </body>
    </html>
  );
}
