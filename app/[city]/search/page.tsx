import { redirect } from "next/navigation";
import { cityOr404, one } from "@/lib/load";

type Props = { params: Promise<{ city: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CitySearch({ params, searchParams }: Props) {
  const city = cityOr404((await params).city);
  const q = one((await searchParams).q);
  redirect(`/${city.slug}/restaurants${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}
