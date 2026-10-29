import { CityPage, cityMetadata } from "@/components/city-page";

type Props = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { city, slug } = await params;
  return cityMetadata(city, { page: "place", kind: "restaurants", slug: decodeURIComponent(slug) });
}

export default async function Page({ params }: Props) {
  const { city, slug } = await params;
  return <CityPage city={city} kind={{ page: "place", kind: "restaurants", slug: decodeURIComponent(slug) }} />;
}
