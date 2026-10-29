import type { Metadata } from "next";
import { HalalApp } from "@/components/hl/halal-app";
import { emptyAppData } from "@/lib/app-data";

export const metadata: Metadata = {
  title: { absolute: "Page not found · Halal Living" },
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  return <HalalApp hlc={await emptyAppData()} />;
}
