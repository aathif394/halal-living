import { CityPage, cityMetadata } from "@/components/city-page";
import type { SearchRecord } from "@/lib/app-data";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<SearchRecord> };

export async function generateMetadata({ params, searchParams }: Props) {
  return cityMetadata((await params).city, { page: "search" }, await searchParams);
}

export default async function Page({ params, searchParams }: Props) {
  return <CityPage city={(await params).city} kind={{ page: "search" }} searchParams={await searchParams} />;
}
