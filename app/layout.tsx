import type { Metadata, Viewport } from "next";
import "./hl.css";
import { ERROR_HTML, LAUNCH_HTML, LAUNCH_JS } from "@/components/hl/static-html";
import { clarityId, clarityScript } from "@/lib/analytics";
import { SITE_DESCRIPTION } from "@/lib/cities";
import { graphLd, jsonLdScript, organizationLd, siteUrl, websiteLd } from "@/lib/seo";

const GLOBALS =
  'window.__HL_LOGOS={chennai:"/icons/cities/chennai.jpg",mumbai:"/icons/cities/mumbai.jpg",bangalore:"/icons/cities/bangalore.jpg",hyderabad:"/icons/cities/hyderabad.jpg"};window.__HL_APPICON="/hl/f68a5293e0c0.png";';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1C1C1C",
};

export async function generateMetadata(): Promise<Metadata> {
  const base = await siteUrl();
  return {
    metadataBase: new URL(base),
    title: { default: "Halal Living", template: "%s · Halal Living" },
    description: SITE_DESCRIPTION,
    applicationName: "Halal Living",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "Halal Living", statusBarStyle: "black-translucent" },
    icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
    openGraph: { type: "website", siteName: "Halal Living", locale: "en_IN", title: "Halal Living", description: SITE_DESCRIPTION },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const base = await siteUrl();
  const clarity = await clarityId();
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: GLOBALS }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(graphLd([organizationLd(base), websiteLd(base)])) }} />
        {clarity ? <script dangerouslySetInnerHTML={{ __html: clarityScript(clarity).replace(/^<script>|<\/script>$/g, "") }} /> : null}
      </head>
      <body suppressHydrationWarning>
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: ERROR_HTML }} />
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: LAUNCH_HTML + "<script>" + LAUNCH_JS + "</script>" }} />
        {children}
      </body>
    </html>
  );
}
