import { CityPage, cityMetadata } from "@/components/city-page";

export async function generateMetadata() {
  return cityMetadata("chennai", { page: "advertise" });
}

export default function Page() {
  return <CityPage city="chennai" kind={{ page: "advertise" }} />;
}
