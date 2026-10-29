import { CityPage, cityMetadata } from "@/components/city-page";

export async function generateMetadata() {
  return cityMetadata("chennai", { page: "suggest" });
}

export default function Page() {
  return <CityPage city="chennai" kind={{ page: "suggest" }} />;
}
