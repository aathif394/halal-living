import { notFound } from "next/navigation";
import { getCity } from "@/lib/cities";
import { Footer } from "@/components/chrome";
import { InstallPrompt } from "@/components/install-prompt";
import { NavChrome } from "@/components/nav-chrome";
import { SubscribeWidget } from "@/components/subscribe-widget";

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;
  const city = getCity(citySlug);
  if (!city) notFound();

  return (
    <div data-city={city.slug}>
      <a className="hl-skip" href="#content">Skip to content</a>
      <NavChrome city={city} />
      <main id="content">{children}</main>
      <Footer city={city} />
      <InstallPrompt />
      <SubscribeWidget />
    </div>
  );
}
