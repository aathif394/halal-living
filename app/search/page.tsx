import { redirect } from "next/navigation";
import { one } from "@/lib/load";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Search({ searchParams }: Props) {
  const q = one((await searchParams).q);
  redirect(`/chennai/restaurants${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}
