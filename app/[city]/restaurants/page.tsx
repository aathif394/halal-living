import { CityPage, cityMetadata, citySlugs } from "@/components/city-page";
import type { SearchRecord } from "@/lib/app-data";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<SearchRecord> };

export const generateStaticParams = citySlugs;

export async function generateMetadata({ params, searchParams }: Props) {
  return cityMetadata((await params).city, { page: "list", kind: "restaurants" }, await searchParams);
}

export default async function Page({ params, searchParams }: Props) {
  return <CityPage city={(await params).city} kind={{ page: "list", kind: "restaurants" }} searchParams={await searchParams} />;
}
