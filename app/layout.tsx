import type { Metadata } from "next";
import "./globals.css";
import { SITE_DESCRIPTION } from "@/lib/cities";
import { graphLd, jsonLdScript, organizationLd, siteUrl, websiteLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const base = await siteUrl();
  return {
    metadataBase: new URL(base),
    title: { default: "Halal Living", template: "%s · Halal Living" },
    description: SITE_DESCRIPTION,
    applicationName: "Halal Living",
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const base = await siteUrl();
  const graph = [organizationLd(base), websiteLd(base)];
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graphLd(graph)) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
