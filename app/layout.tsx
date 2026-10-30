import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./launch.css";
import { InstallProvider } from "@/components/install";
import { SITE_DESCRIPTION } from "@/lib/cities";
import { graphLd, jsonLdScript, organizationLd, siteUrl, websiteLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const base = await siteUrl();
  return {
    metadataBase: new URL(base),
    title: { default: "Halal Living", template: "%s · Halal Living" },
    description: SITE_DESCRIPTION,
    applicationName: "Halal Living",
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
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
  const graph = [organizationLd(base), websiteLd(base)];
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graphLd(graph)) }} />
      </head>
      <body>
        <InstallProvider>{children}</InstallProvider>
      </body>
    </html>
  );
}
