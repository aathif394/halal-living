export type CitySlug = "chennai" | "mumbai" | "bangalore" | "hyderabad";

export type CityTheme = {
  slug: CitySlug;
  name: string;
  btn: string;
  tint: string;
  soft: string;
  accent: string;
  landmark: string;
  areas: string[];
  /** Monthly visitors, shown as "Reach 96k people a month". From the mockup; replace with analytics figures. */
  monthlyReach: number;
};

export const CITIES: CityTheme[] = [
  {
    slug: "chennai",
    name: "Chennai",
    btn: "#B94421",
    tint: "#FAEDE8",
    soft: "#F0CFC2",
    accent: "#1F6B12",
    landmark:
      "M2 21h20M3 21v-6h18v6M10 21V8h4v13M9.5 8 12 5l2.5 3M12 5V3M13 10.5a1 1 0 1 1-2 0 1 1 0 1 1 2 0M3 15v-3h3v3M18 15v-3h3v3M2.5 12l2-1.8 2 1.8M17.5 12l2-1.8 2 1.8M6.5 21v-2a1 1 0 0 1 2 0v2M15.5 21v-2a1 1 0 0 1 2 0v2",
    monthlyReach: 96410,
    areas: ["Triplicane", "Royapettah", "Mount Road", "T. Nagar", "Periamet", "Mannady", "Vepery", "Purasawalkam"],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    btn: "#5A2FAC",
    tint: "#EFEAF8",
    soft: "#D6CBEE",
    accent: "#B8835A",
    landmark:
      "M2 21h20M4 21V9h16v12M4 11.5h16M9.5 21v-5a2.5 2.5 0 0 1 5 0v5M7 9V6h2v3M15 9V6h2v3M7 6a1 1 0 0 1 2 0M15 6a1 1 0 0 1 2 0M5.5 18v-2a1 1 0 0 1 2 0v2M16.5 18v-2a1 1 0 0 1 2 0v2",
    monthlyReach: 212880,
    areas: ["Mohammed Ali Rd", "Bandra West", "Kurla", "Colaba", "Bhendi Bazaar", "Mahim", "Byculla", "Mira Road"],
  },
  {
    slug: "bangalore",
    name: "Bangalore",
    btn: "#45A34D",
    tint: "#ECF6ED",
    soft: "#CBE7CE",
    accent: "#B8835A",
    landmark:
      "M2 21h20M2 21v-6h20v6M8 15v-4h8v4M8.5 11a3.5 3.5 0 0 1 7 0M12 7.5V5M3 15a1.5 1.5 0 0 1 3 0M18 15a1.5 1.5 0 0 1 3 0M9 17h6M10 21v-4M12 21v-4M14 21v-4",
    monthlyReach: 148250,
    areas: ["Frazer Town", "Shivajinagar", "Koramangala", "Indiranagar", "Tannery Road", "RT Nagar", "Johnson Market", "BTM Layout"],
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    btn: "#09AAAC",
    tint: "#E5F6F6",
    soft: "#BDE8E8",
    accent: "#B8835A",
    landmark:
      "M3 21h18M5 21V7M19 21V7M4 7h2M18 7h2M5 7V4.5M19 7V4.5M5 12h14M5 9h14M8 21v-4.5a4 4 0 0 1 8 0V21M10 9V7.5a2 2 0 0 1 4 0V9",
    monthlyReach: 204310,
    areas: ["Charminar", "Tolichowki", "Mehdipatnam", "Banjara Hills", "Mallepally", "Masab Tank", "Shah Ali Banda", "Gachibowli"],
  },
];

export function getCity(slug: string): CityTheme | undefined {
  return CITIES.find((city) => city.slug === slug);
}

export const STORE_URL = "https://store.halallivingcollective.in";

export const SITE_DESCRIPTION =
  "Halal restaurants and masjids in Chennai, Mumbai, Bangalore, and Hyderabad, checked by people who live there.";
